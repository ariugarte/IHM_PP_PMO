FROM node:22.23.2-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2.11.7-alpine AS runtime
ENV XDG_DATA_HOME=/var/lib/caddy-data \
    XDG_CONFIG_HOME=/var/lib/caddy-config
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN cp /usr/bin/caddy /usr/bin/caddy-unprivileged \
    && rm /usr/bin/caddy \
    && mv /usr/bin/caddy-unprivileged /usr/bin/caddy \
    && mkdir -p /var/lib/caddy-data /var/lib/caddy-config \
    && chgrp -R 0 /srv /var/lib/caddy-data /var/lib/caddy-config \
    && chmod -R g=u /srv /var/lib/caddy-data /var/lib/caddy-config
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
