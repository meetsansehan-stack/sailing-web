FROM node:23-slim

WORKDIR /app

RUN npm install -g pnpm@11.0.8

COPY . .

RUN pnpm install --filter @parenting-newsletter/api... --frozen-lockfile

RUN pnpm --filter @parenting-newsletter/db exec prisma generate

EXPOSE 3001

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
