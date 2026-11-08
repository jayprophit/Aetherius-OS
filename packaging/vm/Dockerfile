# Aetherius OS VM/appliance image.
#
# Build from the repository root:
#   docker build -f packaging/vm/Dockerfile -t aetherius-os:0.1.0 .
#
# The image serves the same built web shell that Cloudflare Pages serves.
# It does not embed credentials and it does not expose a native shell.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
LABEL org.opencontainers.image.title="Aetherius OS" \
      org.opencontainers.image.description="Aetherius OS web shell appliance" \
      org.opencontainers.image.licenses="SEE LICENSING.md"
COPY --from=build /app/dist /usr/share/nginx/html
COPY packaging/vm/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
