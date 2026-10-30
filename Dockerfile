# M3 FLEX — portable Node 22 production container. No platform lock-in.
# Never copy .env, credentials or user workout storage into an image.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
# The default build never enables chargeable generative coach services.
ENV VITE_FLEX_PAID_AI_ENABLED=false
RUN node scripts/stage-pose-runtime.mjs && npm run build
RUN test -s .output/server/index.mjs && test -s .output/public/recovery-coach/index.html

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    FLEX_PAID_AI_ENABLED=false
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
# Conservative dependency copy until an independent bare-bundle smoke
# verifies Nitro's runtime dependency closure.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:"+process.env.PORT+"/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
CMD ["node", ".output/server/index.mjs"]
