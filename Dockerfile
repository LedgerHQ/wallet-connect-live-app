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

# nginx-unprivileged runs as non-root (uid 101) and listens on 8080. Pinned by
# digest so rebuilds are reproducible. When bumping, take the digest of the
# multi-arch index for the tag below and update this comment with it.
# The image moved from nginxinc/ (no longer maintained, stuck at 1.31.7) to nginx/.
# Tag: nginx/nginx-unprivileged:1.31.10-alpine
FROM jfrog.ledgerlabs.net/ossproxy-oci-proxy-dockerio/nginx/nginx-unprivileged@sha256:86628f2c9eaa5e84e3b98d25e26563c4a4f9b0ead9cf5656da4731d86e0621de

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080
