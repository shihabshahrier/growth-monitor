FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY src ./src

RUN npm run prisma:generate

EXPOSE 8080
CMD ["node", "src/index.js"]
