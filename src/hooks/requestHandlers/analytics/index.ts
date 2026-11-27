import { signRequestReporter } from "./signRequestReporter";
import type { SessionRequestAnalyticsReporter } from "./types";

export const sessionRequestReporters: readonly SessionRequestAnalyticsReporter[] =
  [signRequestReporter];
