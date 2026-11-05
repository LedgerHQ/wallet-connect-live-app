import { describe, expect, it } from "vitest";
import vercelConfig from "../../../vercel.json";
import {
  ALLOWED_FRAME_ANCESTORS,
  getAllowedTopOrigin,
  isAllowedFrameAncestor,
} from "../ledgerEnterprise";

describe("isAllowedFrameAncestor", () => {
  it("should accept exact hosts", () => {
    expect(isAllowedFrameAncestor("https://vault.komainu.com")).toBe(true);
    expect(isAllowedFrameAncestor("https://vault-main.ledger-test.com")).toBe(
      true,
    );
    expect(
      isAllowedFrameAncestor(
        "https://web.enterprise.testwldaily69.aws.prd.ldg-tech.com",
      ),
    ).toBe(true);
  });

  it("should accept subdomains of wildcard entries at any depth", () => {
    expect(isAllowedFrameAncestor("https://app.enterprise.ledger.com")).toBe(
      true,
    );
    expect(isAllowedFrameAncestor("https://a.b.enterprise.ledger.com")).toBe(
      true,
    );
    expect(
      isAllowedFrameAncestor("https://foo.minivault.demo.ledger-test.com"),
    ).toBe(true);
  });

  it("should reject the bare domain of a wildcard entry", () => {
    expect(isAllowedFrameAncestor("https://enterprise.ledger.com")).toBe(false);
    expect(isAllowedFrameAncestor("https://minivault.ledger-sbx.com")).toBe(
      false,
    );
  });

  it("should reject subdomains of exact hosts", () => {
    expect(isAllowedFrameAncestor("https://evil.vault.komainu.com")).toBe(
      false,
    );
  });

  it("should reject lookalike hosts", () => {
    expect(isAllowedFrameAncestor("https://evilenterprise.ledger.com")).toBe(
      false,
    );
    expect(
      isAllowedFrameAncestor("https://enterprise.ledger.com.evil.com"),
    ).toBe(false);
    expect(
      isAllowedFrameAncestor("https://app.enterprise.ledger.com.evil.com"),
    ).toBe(false);
    expect(isAllowedFrameAncestor("https://vault.komainu.com.evil.com")).toBe(
      false,
    );
    expect(isAllowedFrameAncestor("https://evilvault.komainu.com")).toBe(false);
  });

  it("should reject non https origins", () => {
    expect(isAllowedFrameAncestor("http://app.enterprise.ledger.com")).toBe(
      false,
    );
    expect(isAllowedFrameAncestor("wss://vault.komainu.com")).toBe(false);
  });

  it("should reject explicit ports", () => {
    expect(isAllowedFrameAncestor("https://vault.komainu.com:8443")).toBe(
      false,
    );
    expect(isAllowedFrameAncestor("https://vault.komainu.com:443")).toBe(false);
  });

  it("should reject invalid strings", () => {
    expect(isAllowedFrameAncestor("")).toBe(false);
    expect(isAllowedFrameAncestor("null")).toBe(false);
    expect(isAllowedFrameAncestor("vault.komainu.com")).toBe(false);
    expect(isAllowedFrameAncestor("https://vault.komainu.com/path")).toBe(
      false,
    );
    expect(isAllowedFrameAncestor("https://user@vault.komainu.com")).toBe(
      false,
    );
  });
});

describe("getAllowedTopOrigin", () => {
  function fakeWindow({
    ancestorOrigins,
    referrer = "",
    nested = false,
  }: {
    ancestorOrigins?: string[];
    referrer?: string;
    nested?: boolean;
  }) {
    const top = {};
    return {
      location: { ancestorOrigins },
      document: { referrer },
      top,
      parent: nested ? {} : top,
    } as unknown as Window;
  }

  it("should return the top origin when every ancestor is allowed", () => {
    expect(
      getAllowedTopOrigin(
        fakeWindow({
          ancestorOrigins: [
            "https://web.vault-main.ledger-test.com",
            "https://app.enterprise.ledger.com",
          ],
        }),
      ),
    ).toBe("https://app.enterprise.ledger.com");
  });

  it("should reject when one ancestor is not allowed", () => {
    expect(
      getAllowedTopOrigin(
        fakeWindow({
          ancestorOrigins: [
            "https://evil.com",
            "https://app.enterprise.ledger.com",
          ],
        }),
      ),
    ).toBeUndefined();
    expect(
      getAllowedTopOrigin(
        fakeWindow({
          ancestorOrigins: [
            "https://app.enterprise.ledger.com",
            "https://evil.com",
          ],
        }),
      ),
    ).toBeUndefined();
  });

  it("should reject an empty ancestorOrigins", () => {
    expect(
      getAllowedTopOrigin(fakeWindow({ ancestorOrigins: [] })),
    ).toBeUndefined();
  });

  it("should not fall back to the referrer when ancestorOrigins is available", () => {
    expect(
      getAllowedTopOrigin(
        fakeWindow({
          ancestorOrigins: ["https://evil.com"],
          referrer: "https://app.enterprise.ledger.com/",
        }),
      ),
    ).toBeUndefined();
  });

  it("should use the referrer origin without ancestorOrigins (Firefox)", () => {
    expect(
      getAllowedTopOrigin(
        fakeWindow({ referrer: "https://app.enterprise.ledger.com/some/path" }),
      ),
    ).toBe("https://app.enterprise.ledger.com");
  });

  it("should reject a disallowed or missing referrer (Firefox)", () => {
    expect(
      getAllowedTopOrigin(fakeWindow({ referrer: "https://evil.com/" })),
    ).toBeUndefined();
    expect(getAllowedTopOrigin(fakeWindow({}))).toBeUndefined();
  });

  it("should reject a nested frame without ancestorOrigins (Firefox)", () => {
    expect(
      getAllowedTopOrigin(
        fakeWindow({
          referrer: "https://app.enterprise.ledger.com/",
          nested: true,
        }),
      ),
    ).toBeUndefined();
  });
});

describe("vercel.json frame-ancestors", () => {
  it("should match the allowed frame ancestors", () => {
    const csp = vercelConfig.headers
      .flatMap(({ headers }) => headers)
      .find(({ key }) => key === "Content-Security-Policy")?.value;
    const directive = csp
      ?.split(";")
      .map((part) => part.trim().split(/\s+/))
      .find(([name]) => name === "frame-ancestors");

    expect(directive?.slice(1)).toEqual([
      "'self'",
      ...ALLOWED_FRAME_ANCESTORS.map((entry) => `https://${entry}`),
    ]);
  });
});
