# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
EXPOSE 8080
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS production
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
