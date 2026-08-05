FROM denoland/deno:2.8.2 AS base
WORKDIR /app

FROM base AS deps
COPY deno.json ./
COPY deno.lock ./
RUN deno ci --prod --skip-types

FROM deps AS runner
ENV NODE_ENV=production
COPY .env ./
COPY src ./src/
CMD ["deno", "task", "start"]
EXPOSE 3000
