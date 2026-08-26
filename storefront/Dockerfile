# Development stage: used by `docker compose up --watch` — runs `next dev`
# so files synced into the container hot-reload in the browser.
FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 1: Build the Next.js standalone server.
# API_URL is baked into the server at build time (used by the /api rewrite);
# NEXT_STRIPE_PK is baked into the client bundle.
FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL=http://store:5000
ARG NEXT_STRIPE_PK=""
ENV API_URL=$API_URL
ENV NEXT_STRIPE_PK=$NEXT_STRIPE_PK

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run the standalone server
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
