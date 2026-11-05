// Hosts allowed to frame the app, `*.` entries match any subdomain but not the bare domain.
// Keep in sync with the `frame-ancestors` CSP in `vercel.json` (checked by a unit test)
export const ALLOWED_FRAME_ANCESTORS = [
  // Ledger Enterprise prod
  "*.enterprise.ledger.com",
  // Ledger Enterprise internal / test
  "web.vault-main.ledger-test.com",
  "vault-main.ledger-test.com",
  "web.vault-next.ledger-test.com",
  "vault-next.ledger-test.com",
  "web.vault-ppr.ledger-test.com",
  "vault-ppr.ledger-test.com",
  // White labels
  "custody.bit2me.com",
  "vault.b2broker.com",
  "vault.cryptogarage.co.jp",
  "vault.daucustody.com",
  "vault.komainu.com",
  "vault.tetratrust.com",
  "web.enterprise.testwldaily69.aws.prd.ldg-tech.com",
  // Sandboxes
  "*.minivault.ledger-sbx.com",
  "*.minivault.ledger-stg.com",
  "*.minivault.demo.ledger-test.com",
];

/**
 * Check if an origin (`https://host`, default port only) is allowed to frame the app
 */
export function isAllowedFrameAncestor(origin: string) {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  // Comparing to `url.origin` also rejects paths, credentials and a default port written out
  if (url.protocol !== "https:" || url.port !== "" || url.origin !== origin) {
    return false;
  }

  return ALLOWED_FRAME_ANCESTORS.some((entry) =>
    entry.startsWith("*.")
      ? url.hostname.endsWith(entry.slice(1))
      : url.hostname === entry,
  );
}

/**
 * Origin of the top window framing the app, if every ancestor is allowed.
 * Returns undefined when it can't be verified so callers fail closed
 */
export function getAllowedTopOrigin(win: Window) {
  // Not implemented by Firefox despite the DOM typings
  const ancestorOrigins = win.location.ancestorOrigins as
    | DOMStringList
    | undefined;

  if (ancestorOrigins) {
    const origins = Array.from(ancestorOrigins);
    // The top origin is the last entry
    const topOrigin = origins[origins.length - 1];
    return topOrigin && origins.every(isAllowedFrameAncestor)
      ? topOrigin
      : undefined;
  }

  // Fallback: the referrer is the parent origin, only trust it when the parent is the top
  if (win.parent !== win.top) {
    return undefined;
  }

  try {
    const origin = new URL(win.document.referrer).origin;
    return isAllowedFrameAncestor(origin) ? origin : undefined;
  } catch {
    return undefined;
  }
}
