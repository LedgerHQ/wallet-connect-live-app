FROM jfrog.ledgerlabs.net/ossproxy-oci-proxy-dockerio/node:24-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_WALLETCONNECT_PROJECT_ID
ARG VITE_APP_VERSION
ARG VITE_PUBLIC_SEGMENT_API_KEY_MOBILE
ARG VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP
ARG VITE_APPLICATION_DISABLED
ARG VITE_PUBLIC_SENTRY_DSN
ENV VITE_WALLETCONNECT_PROJECT_ID=$VITE_WALLETCONNECT_PROJECT_ID \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_PUBLIC_SEGMENT_API_KEY_MOBILE=$VITE_PUBLIC_SEGMENT_API_KEY_MOBILE \
    VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP=$VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP \
    VITE_APPLICATION_DISABLED=$VITE_APPLICATION_DISABLED \
    VITE_PUBLIC_SENTRY_DSN=$VITE_PUBLIC_SENTRY_DSN

RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -s /run/secrets/sentry_auth_token ]; then \
      SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
      export SENTRY_AUTH_TOKEN; \
    fi; \
    pnpm build

FROM jfrog.ledgerlabs.net/ossproxy-oci-proxy-dockerio/nginxinc/nginx-unprivileged:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080
