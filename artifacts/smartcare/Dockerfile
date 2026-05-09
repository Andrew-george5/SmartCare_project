FROM node:22 AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./

RUN echo "shamefully-hoist=false" > .npmrc

COPY lib/ ./lib/
COPY scripts/ ./scripts/
COPY artifacts/smartcare/ ./artifacts/smartcare/

RUN pnpm install --no-frozen-lockfile 

ENV BASE_PATH=/
ENV PORT=80
ENV NODE_ENV=production
ENV REPL_ID=""

RUN pnpm --filter @workspace/smartcare run build

FROM nginx:alpine

COPY --from=builder /app/artifacts/smartcare/dist/public /usr/share/nginx/html
COPY artifacts/smartcare/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]