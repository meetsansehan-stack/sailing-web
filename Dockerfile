FROM node:23-slim

WORKDIR /app

RUN npm install -g pnpm@11.0.8

COPY . .

RUN pnpm install --filter @parenting-newsletter/api... --frozen-lockfile

RUN ./node_modules/.bin/prisma generate --schema=packages/db/prisma/schema.prisma

EXPOSE 3001

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
