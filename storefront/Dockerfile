# Development stage: used by `docker compose up --watch` — runs `next dev`
# so files synced into the container hot-reload in the browser.
FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 1: Build the Next.js standalone server. Nothing environment-
# specific is baked in: the /api proxy route reads API_URL at request
# time and the Stripe publishable key is served by the backend.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run the standalone server
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Next standalone binds to $HOSTNAME if set; ECS/Fargate sets it to the
# task hostname, which breaks localhost health checks. Pin the bind
# address so the server listens on all interfaces.
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
