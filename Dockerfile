# syntax=docker/dockerfile:1

# ---- build: compile the React app into dist/ ---------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime: the relay plus the built app, nothing else ---------------------
FROM node:22-alpine
WORKDIR /app

# HOST=0.0.0.0 is what makes the published port reachable from outside the
# container; the relay's own default is 127.0.0.1. PROVIDER=mock runs with no
# key, override it (and add the matching key) for real work.
# Set ACCESS_CODE when you run it, see DEPLOY.md.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8765 \
    PROVIDER=mock

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY --from=build /app/dist ./dist

# The archive and published releases live here. Created and handed to `node`
# before VOLUME, so a fresh named volume inherits that ownership and the
# unprivileged user can write to it.
RUN mkdir -p /app/.data && chown -R node:node /app/.data
VOLUME /app/.data

USER node
EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8765)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
