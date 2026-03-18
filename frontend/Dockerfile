FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.28-alpine

# Patch residual Alpine CVEs
RUN apk upgrade --no-cache

# Remove default nginx config and hide version
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Run nginx as non-root
# nginx master process needs port 80 — use port 8080 instead so no root required
RUN adduser -D -H -u 1001 nginxuser \
    && chown -R nginxuser:nginxuser /usr/share/nginx/html \
    && chown -R nginxuser:nginxuser /var/cache/nginx \
    && chown -R nginxuser:nginxuser /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginxuser:nginxuser /var/run/nginx.pid

USER nginxuser

EXPOSE 8080