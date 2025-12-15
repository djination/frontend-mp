# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build static assets
FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Minimal runtime image
FROM node:20-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
