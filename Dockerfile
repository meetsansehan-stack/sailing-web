FROM node:23-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11.0.8

COPY . .

RUN pnpm install --frozen-lockfile

RUN ./node_modules/.bin/prisma generate --schema=packages/db/prisma/schema.prisma

EXPOSE 3001

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
