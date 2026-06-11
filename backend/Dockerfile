# Builder stage: install dependencies and prepare app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm prune --production

# Final stage: smaller runtime image
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

ENV PORT=8000
EXPOSE 8000
CMD ["node", "server.js"]