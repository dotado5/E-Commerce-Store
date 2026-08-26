# Development stage: used by `docker compose up --watch` — runs the Nest
# watcher so files synced into the container trigger a live reload.
FROM node:22-alpine AS development

WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 5000

# prisma generate runs again on restart so schema changes synced by
# compose watch (sync+restart) are picked up without a rebuild.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]

# Stage 1: Build NestJS application
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# Stage 2: Run compiled application
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Prisma schema + migrations are needed at runtime for generate/migrate deploy
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]