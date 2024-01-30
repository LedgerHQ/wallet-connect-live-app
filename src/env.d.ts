/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom/vitest" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_PUBLIC_SENTRY_DSN: string;
  readonly VITE_APPLICATION_DISABLED: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP: string;
  readonly VITE_PUBLIC_SEGMENT_API_KEY_MOBILE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
