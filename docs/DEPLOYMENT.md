# Deployment Guide — AWS ECS (Fargate)

This guide covers deploying the E-Commerce Store (NestJS backend + Next.js
storefront) to AWS ECS on Fargate, with RDS PostgreSQL, ElastiCache Redis,
and GitHub Actions CI/CD.

## Architecture

```
                        Internet
                           │
                 ┌─────────▼──────────┐
                 │  ALB (HTTP/HTTPS)  │  public subnets
                 └─────────┬──────────┘
                           │ :3000
              ┌────────────▼────────────┐
              │  storefront (Next.js)   │  ECS service, private subnets
              │  serves UI + proxies    │
              │  /api/* at runtime      │
              └────────────┬────────────┘
                           │ http://store.ecommerce.local:5000
              ┌────────────▼────────────┐
              │  store (NestJS API)     │  ECS service, private,
              │                         │  discovered via Cloud Map
              └──┬─────────┬────────┬───┘
                 │         │        │
        ┌────────▼──┐ ┌────▼─────┐ ┌▼──────────┐
        │ RDS       │ │ Elasti-  │ │ Stripe    │
        │ Postgres  │ │ Cache    │ │ (egress)  │
        └───────────┘ │ Redis    │ └───────────┘
                      └──────────┘
```

Key properties of this setup:

- **One public entry point.** Only the storefront sits behind the ALB. The
  backend is private; the storefront's `/api/[...path]` route proxies every
  API call server-side at request time — including **Stripe webhooks**,
  which arrive at `https://<your-domain>/api/payments/webhook` and are
  forwarded byte-for-byte (signature verification stays intact).
- **Environment-agnostic images.** Nothing environment-specific is baked at
  build time: the storefront reads `API_URL` per request, and the Stripe
  publishable key is served by the backend (`GET /payments/config`). The
  same image works in dev, staging, and prod.
- **Graceful degradation.** Without `REDIS_URL` reachable, caching silently
  disables. Without `STRIPE_SECRET_KEY`, orders are created unpaid. Without
  `SMTP_HOST`, emails are logged instead of sent.

## Status overview

| # | Step | Owner | Status |
|---|------|-------|--------|
| 1 | Production Docker images (both apps) | Claude | ✅ Done |
| 2 | Runtime API proxy (no baked URLs) | Claude | ✅ Done |
| 3 | Stripe publishable key served at runtime | Claude | ✅ Done |
| 4 | `/health` endpoint for health checks | Claude | ✅ Done |
| 5 | Migration toggle for multi-instance safety | Claude | ✅ Done |
| 6 | ECS task definition templates | Claude | ✅ Done |
| 7 | GitHub Actions deploy workflow (OIDC) | Claude | ✅ Done |
| 8 | ECR repositories | You | ⬜ To do |
| 9 | Networking (VPC, security groups) | You | ⬜ To do |
| 10 | RDS PostgreSQL | You | ⬜ To do |
| 11 | ElastiCache Redis | You | ⬜ To do |
| 12 | Secrets Manager entries | You | ⬜ To do |
| 13 | IAM roles (task execution + GitHub OIDC) | You | ⬜ To do |
| 14 | ECS cluster + Cloud Map namespace | You | ⬜ To do |
| 15 | ALB + target group | You | ⬜ To do |
| 16 | Fill task definition placeholders | You | ⬜ To do |
| 17 | First deploy (register task defs, create services) | You | ⬜ To do |
| 18 | GitHub repository secrets/variables | You | ⬜ To do |
| 19 | Stripe webhook endpoint | You | ⬜ To do |
| 20 | (Optional) SMTP, seeding, scaling out | You | ⬜ Optional |

---

## Part 1 — Already configured in this repo (✅)

### 1. Production Docker images
Both [store/Dockerfile](../store/Dockerfile) and
[storefront/Dockerfile](../storefront/Dockerfile) are multi-stage:
a `development` stage for `docker compose up --watch`, and a `production`
stage (compiled NestJS on port **5000**; Next.js standalone server on port
**3000**). CI builds with `--target production`.

### 2. Runtime API proxy
[storefront/app/api/[...path]/route.ts](../storefront/app/api/%5B...path%5D/route.ts)
forwards `/api/*` to `process.env.API_URL` **at request time** (previously
a build-time rewrite). This is why the backend needs no public exposure and
one storefront image works everywhere. Set `API_URL` in the storefront task
definition (already templated as `http://store.ecommerce.local:5000`).

### 3. Stripe publishable key at runtime
The backend serves `GET /payments/config` → `{ publishableKey }` from its
`STRIPE_PUBLISHABLE_KEY` env var; the checkout modal fetches it before
loading Stripe Elements. **Note:** the key therefore now lives in the
*backend* environment (locally: `store/.env`), not the storefront's.

### 4. Health endpoint
`GET /health` on the backend returns `{ status: "ok", uptime }`. Both task
definitions include container health checks (backend hits `/health`,
storefront hits `/`).

### 5. Migration safety toggle
The backend container runs `prisma migrate deploy` on startup by default —
fine for a single instance. When scaling beyond 1, set
`SKIP_MIGRATIONS=true` in the task definition and run migrations as a
one-off task instead (see Part 3, "Scaling out").

### 6. Task definition templates
[deploy/ecs/taskdef-store.json](../deploy/ecs/taskdef-store.json) and
[deploy/ecs/taskdef-storefront.json](../deploy/ecs/taskdef-storefront.json)
— Fargate, awsvpc networking, CloudWatch logs, health checks, secrets from
Secrets Manager. They contain `<PLACEHOLDERS>` you must fill (step 16).

### 7. CI/CD workflow
[.github/workflows/deploy.yml](../.github/workflows/deploy.yml): on every
push to `main` touching `store/`, `storefront/`, or `deploy/`, it assumes an
AWS role via **OIDC** (no stored AWS keys), builds and pushes both images to
ECR tagged with the commit SHA, renders the task definitions, and updates
both ECS services, waiting for stability.

---

## Part 2 — Your AWS setup (step by step)

> Prerequisites: an AWS account, AWS CLI v2 configured (`aws configure`),
> and a region choice (examples use `us-east-1` — replace throughout).
> Everything below is also doable in the AWS Console if you prefer.
>
> **Windows / PowerShell note:** bash-style single-quoted arguments don't
> survive Windows shells — inline JSON gets its quotes mangled (producing
> `Unknown options` errors) and single-quoted shorthand arrives with a
> literal `'` (producing `Error parsing parameter ... received: '''`).
> Therefore every policy document below is passed as a **file** from
> [deploy/iam/](../deploy/iam/) via `file://` (run the commands from the
> repository root so relative paths resolve), and all shorthand arguments
> (`--dns-config`, `--network-configuration`, …) use **double quotes**,
> which work in PowerShell, cmd, and bash alike.
>
> One more: run the ECR login pipeline (step 17a) from **cmd**, not
> PowerShell — PowerShell re-encodes piped output and corrupts the token,
> making `docker login` fail with `400 Bad Request`. In PowerShell, wrap
> it: `cmd /c "aws ecr get-login-password ... | docker login ..."`.

### 8. Create ECR repositories

```bash
aws ecr create-repository --repository-name ecommerce-store --region us-east-1
aws ecr create-repository --repository-name ecommerce-storefront --region us-east-1
```

The workflow expects exactly these names.

### 9. Networking

The default VPC works for a first deploy. You need:

- **Two or more subnets** in different AZs (note their IDs).
- **Security groups** (create in this order; each references the previous):

```bash
# ALB: accepts traffic from the internet
aws ec2 create-security-group --group-name ecommerce-alb-sg \
  --description "ALB ingress" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <ALB_SG> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <ALB_SG> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Storefront tasks: only the ALB may reach port 3000
aws ec2 create-security-group --group-name ecommerce-storefront-sg \
  --description "storefront tasks" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <STOREFRONT_SG> \
  --protocol tcp --port 3000 --source-group <ALB_SG>

# Backend tasks: only the storefront may reach port 5000
aws ec2 create-security-group --group-name ecommerce-store-sg \
  --description "store tasks" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <STORE_SG> \
  --protocol tcp --port 5000 --source-group <STOREFRONT_SG>

# Postgres: only the backend
aws ec2 create-security-group --group-name ecommerce-db-sg \
  --description "rds" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <DB_SG> \
  --protocol tcp --port 5432 --source-group <STORE_SG>

# Redis: only the backend
aws ec2 create-security-group --group-name ecommerce-redis-sg \
  --description "redis" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <REDIS_SG> \
  --protocol tcp --port 6379 --source-group <STORE_SG>
```

### 10. RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier ecommerce-db \
  --engine postgres --engine-version 16 \
  --db-instance-class db.t4g.micro \
  --allocated-storage 20 \
  --master-username store --master-user-password '<CHOOSE_A_PASSWORD>' \
  --db-name store \
  --vpc-security-group-ids <DB_SG> \
  --no-publicly-accessible
```

Wait for it to become `available`, note the endpoint
(`aws rds describe-db-instances --db-instance-identifier ecommerce-db
--query 'DBInstances[0].Endpoint.Address'`), and build your connection
string:
`postgresql://store:<PASSWORD>@<RDS_ENDPOINT>:5432/store`

### 11. ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id ecommerce-redis \
  --engine redis --cache-node-type cache.t4g.micro \
  --num-cache-nodes 1 \
  --security-group-ids <REDIS_SG>
```

Note the endpoint and put it in the store task definition's `REDIS_URL`
(`redis://<ENDPOINT>:6379`). If Redis is ever unreachable the app keeps
working with caching disabled, so this can even be added later.

### 12. Secrets Manager

Create the four secrets referenced by the task definition (plain string
values, not JSON):

```bash
aws secretsmanager create-secret --name ecommerce/database-url \
  --secret-string 'postgresql://store:<PASSWORD>@<RDS_ENDPOINT>:5432/store'
aws secretsmanager create-secret --name ecommerce/jwt-secret \
  --secret-string '<LONG_RANDOM_STRING>'
aws secretsmanager create-secret --name ecommerce/stripe-secret-key \
  --secret-string 'sk_test_...'          # or sk_live_...
aws secretsmanager create-secret --name ecommerce/stripe-webhook-secret \
  --secret-string 'whsec_placeholder'    # updated in step 19
```

### 13. IAM roles

**a) Task execution role** (`ecommerceTaskExecutionRole`) — lets ECS pull
images, write logs, and read the secrets:

```bash
aws iam create-role --role-name ecommerceTaskExecutionRole \
  --assume-role-policy-document file://deploy/iam/ecs-tasks-trust-policy.json

aws iam attach-role-policy --role-name ecommerceTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam put-role-policy --role-name ecommerceTaskExecutionRole \
  --policy-name ReadEcommerceSecrets \
  --policy-document file://deploy/iam/task-execution-secrets-policy.json
```

**b) GitHub OIDC deploy role** — lets the workflow deploy without stored
AWS keys. First add GitHub as an identity provider (once per account):

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

Then the role. First edit
[deploy/iam/github-oidc-trust-policy.json](../deploy/iam/github-oidc-trust-policy.json)
and replace `<AWS_ACCOUNT_ID>` and `<GITHUB_ORG>/<REPO>` (e.g.
`dotado5/E-Commerce-Store`), then:

```bash
aws iam create-role --role-name ecommerceGithubDeployRole \
  --assume-role-policy-document file://deploy/iam/github-oidc-trust-policy.json
```

Attach permissions (ECR push, ECS deploy, pass the execution role):

```bash
aws iam put-role-policy --role-name ecommerceGithubDeployRole \
  --policy-name DeployEcommerce \
  --policy-document file://deploy/iam/github-deploy-policy.json
```

### 14. ECS cluster + Cloud Map namespace

```bash
aws ecs create-cluster --cluster-name ecommerce

# Private DNS namespace for backend service discovery
aws servicediscovery create-private-dns-namespace \
  --name ecommerce.local --vpc <VPC_ID>
```

When the namespace is ready, create a discovery service for the backend
(get the namespace ID from `aws servicediscovery list-namespaces`):

```bash
aws servicediscovery create-service --name store \
  --namespace-id <NAMESPACE_ID> \
  --dns-config "NamespaceId=<NAMESPACE_ID>,DnsRecords=[{Type=A,TTL=10}]" \
  --health-check-custom-config FailureThreshold=1
```

Note the returned service ARN — the backend ECS service registers with it,
which is what makes `store.ecommerce.local` resolve (already set as the
storefront's `API_URL`).

### 15. Application Load Balancer

```bash
aws elbv2 create-load-balancer --name ecommerce-alb \
  --subnets <SUBNET_A> <SUBNET_B> --security-groups <ALB_SG>

aws elbv2 create-target-group --name ecommerce-storefront-tg \
  --protocol HTTP --port 3000 --vpc-id <VPC_ID> \
  --target-type ip --health-check-path /

aws elbv2 create-listener --load-balancer-arn <ALB_ARN> \
  --protocol HTTP --port 80 \
  --default-actions "Type=forward,TargetGroupArn=<TG_ARN>"
```

For HTTPS (recommended before going live): request a certificate in ACM
for your domain, add a 443 listener with it, and point your DNS at the ALB.

### 16. Fill the task definition placeholders

Edit both files in [deploy/ecs/](../deploy/ecs/) and replace:

- `<AWS_ACCOUNT_ID>` and `<AWS_REGION>` — your account/region.
- `<ELASTICACHE_ENDPOINT>` — from step 11.
- `<STRIPE_PUBLISHABLE_KEY>` — your `pk_test_`/`pk_live_` key (not secret).
- `<IMAGE>` — your ECR URI with the `latest` tag, e.g.
  `<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/ecommerce-store:latest`
  (and `.../ecommerce-storefront:latest` in the other file). A registration
  fails on the raw `<IMAGE>` placeholder; CI overwrites this value with a
  SHA-tagged image on every deploy, so it only matters for the first
  manual registration in step 17.
- In `taskdef-storefront.json`, `API_URL` already matches the Cloud Map
  name from step 14; change it only if you used different names.

Commit and push the filled-in files.

### 17. First deploy

**a) Push the images once by hand** — the services can't start (and the
`latest` tag doesn't exist) until something is in ECR. From the repo root:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker build --target production -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-store:latest ./store
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-store:latest

docker build --target production -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-storefront:latest ./storefront
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-storefront:latest
```

**b) Register the task definitions and create the two services**
(afterwards, CI handles every update):

```bash
aws ecs register-task-definition --cli-input-json file://deploy/ecs/taskdef-store.json
aws ecs register-task-definition --cli-input-json file://deploy/ecs/taskdef-storefront.json

# Backend: private, registered with Cloud Map
aws ecs create-service --cluster ecommerce --service-name ecommerce-store \
  --task-definition ecommerce-store --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>,<SUBNET_B>],securityGroups=[<STORE_SG>],assignPublicIp=ENABLED}" \
  --service-registries "registryArn=<CLOUDMAP_SERVICE_ARN>"

# Storefront: behind the ALB
aws ecs create-service --cluster ecommerce --service-name ecommerce-storefront \
  --task-definition ecommerce-storefront --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>,<SUBNET_B>],securityGroups=[<STOREFRONT_SG>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<TG_ARN>,containerName=storefront,containerPort=3000"
```

> `assignPublicIp=ENABLED` is the simple default-VPC way to give tasks
> outbound internet (image pulls, Stripe API). In a hardened setup use
> private subnets + a NAT gateway instead.

Note: the services will fail to start until images exist in ECR — push to
`main` (or run the workflow manually) once step 18 is done, or build/push
one image by hand first.

The backend applies database migrations automatically on first start.

### 18. GitHub repository configuration

In the repo → Settings:

- **Secrets → Actions**: `AWS_DEPLOY_ROLE_ARN` = ARN of
  `ecommerceGithubDeployRole` from step 13b.
- **Variables → Actions**: `AWS_REGION` (e.g. `us-east-1`) and
  `ECS_CLUSTER` (`ecommerce`).

Then push to `main` or trigger **Actions → Deploy to ECS → Run workflow**.

### 19. Stripe webhook

In the Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://<your-domain>/api/payments/webhook`
  (the storefront proxies it to the backend — no separate backend domain
  needed)
- Events: `payment_intent.succeeded`, `payment_intent.processing`,
  `payment_intent.payment_failed`, `payment_intent.canceled`
- Copy the signing secret (`whsec_...`) into Secrets Manager:

```bash
aws secretsmanager put-secret-value --secret-id ecommerce/stripe-webhook-secret \
  --secret-string 'whsec_...'
```

Then force a new deployment so tasks pick it up:
`aws ecs update-service --cluster ecommerce --service ecommerce-store --force-new-deployment`

---

## Part 3 — Optional / later

### Real emails
Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` to the
store task definition (put credentials in Secrets Manager like the others).
Until then, confirmation emails are logged to CloudWatch.

### Seeding demo data
Run the seed as a one-off task with the same task definition:

```bash
aws ecs run-task --cluster ecommerce --launch-type FARGATE \
  --task-definition ecommerce-store \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>],securityGroups=[<STORE_SG>],assignPublicIp=ENABLED}" \
  --overrides file://deploy/ecs/overrides-seed.json
```

(Note: seeding needs dev dependencies; if the production image lacks
`ts-node`, run the seed locally against the RDS endpoint instead — it's a
one-time action.)

### Scaling out the backend
Before setting `desired-count > 1` on `ecommerce-store`:

1. Set `SKIP_MIGRATIONS=true` in `taskdef-store.json` (so parallel tasks
   don't race migrations) and redeploy.
2. Apply future migrations as a one-off task:

```bash
aws ecs run-task --cluster ecommerce --launch-type FARGATE \
  --task-definition ecommerce-store \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>],securityGroups=[<STORE_SG>],assignPublicIp=ENABLED}" \
  --overrides file://deploy/ecs/overrides-migrate.json
```

### Cost note
The always-on baseline here (2 Fargate tasks at 0.5 vCPU/1 GB, db.t4g.micro,
cache.t4g.micro, one ALB) lands in the rough ballpark of **$70–90/month**
in us-east-1. Stop the ECS services (`desired-count 0`) when not in use to
cut most of it.

---

## Local development (unchanged)

```bash
docker compose up --watch      # full stack with live reload
# or: docker compose up -d postgres redis, then npm run start:dev / next dev
```

Local env lives in `store/.env` (see [store/.env.example](../store/.env.example)).
**All Stripe keys — including the publishable key (`STRIPE_PUBLISHABLE_KEY`) —
now go in `store/.env`**, not the storefront; the frontend fetches the
publishable key from `GET /payments/config` at runtime.
