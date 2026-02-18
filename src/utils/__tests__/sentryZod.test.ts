import * as Sentry from "@sentry/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { reportZodError } from "../sentryZod";

const mockSetContext = vi.fn();
const mockSetTag = vi.fn();
const mockSetFingerprint = vi.fn();

vi.mock("@sentry/react", () => ({
  withScope: vi.fn(
    (
      callback: (scope: {
        setContext: typeof mockSetContext;
        setTag: typeof mockSetTag;
        setFingerprint: typeof mockSetFingerprint;
      }) => void,
    ) => {
      callback({
        setContext: mockSetContext,
        setTag: mockSetTag,
        setFingerprint: mockSetFingerprint,
      });
    },
  ),
  captureException: vi.fn(),
}));

describe("sentryZod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createZodErrorWithUnrecognizedKeys(): z.ZodError {
    const schema = z.tuple([
      z.strictObject({
        from: z.string(),
        chainId: z.string(),
      }),
    ]);
    const result = schema.safeParse([
      {
        from: "0x123",
        chainId: 123,
        gasLimit: "0x5208",
      },
    ]);
    if (result.success) throw new Error("Expected parse to fail");
    return result.error;
  }

  function createZodErrorInvalidTypeOnly(): z.ZodError {
    const schema = z.object({ foo: z.string() });
    const result = schema.safeParse({ foo: 42 });
    if (result.success) throw new Error("Expected parse to fail");
    return result.error;
  }

  function createMockWalletKit(
    metadata: { name?: string; url?: string } | null,
  ) {
    return {
      engine: {
        signClient: {
          session: {
            get: vi.fn(() => (metadata ? { peer: { metadata } } : undefined)),
          },
        },
      },
    } as unknown as Parameters<typeof reportZodError>[0]["walletKit"];
  }

  it("calls Sentry.withScope and sets dapp, request, and zod_validation context", () => {
    const error = createZodErrorWithUnrecognizedKeys();
    const walletKit = createMockWalletKit({
      name: "Test Dapp",
      url: "https://example.com",
    });

    reportZodError({
      error,
      topic: "topic-abc",
      request: { method: "eth_sendTransaction" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(Sentry.withScope).toHaveBeenCalledTimes(1);
    expect(mockSetContext).toHaveBeenCalledWith("dapp", {
      topic: "topic-abc",
      name: "Test Dapp",
      url: "https://example.com",
    });
    expect(mockSetContext).toHaveBeenCalledWith("request", {
      method: "eth_sendTransaction",
      chainId: "eip155:1",
    });
    expect(mockSetContext).toHaveBeenCalledWith(
      "zod_validation",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ issues: expect.any(Array) }),
    );
    const zodContextCall = mockSetContext.mock.calls.find(
      (c: unknown[]) => c[0] === "zod_validation",
    ) as [string, { issues: { code: string; keys?: string[] }[] }] | undefined;
    const issues = zodContextCall?.[1].issues ?? [];
    expect(issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
    const unrecognizedIssue = issues.find(
      (i) => i.code === "unrecognized_keys",
    );
    expect(unrecognizedIssue?.keys).toContain("gasLimit");
  });

  it("sets tags: request_method, dapp_name, has_unrecognized_keys", () => {
    const error = createZodErrorWithUnrecognizedKeys();
    const walletKit = createMockWalletKit({
      name: "My Dapp",
      url: "https://dapp.io",
    });

    reportZodError({
      error,
      topic: "t1",
      request: { method: "eth_sendTransaction" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(mockSetTag).toHaveBeenCalledWith(
      "request_method",
      "eth_sendTransaction",
    );
    expect(mockSetTag).toHaveBeenCalledWith("chain_id", "eip155:1");
    expect(mockSetTag).toHaveBeenCalledWith("dapp_name", "My Dapp");
    expect(mockSetTag).toHaveBeenCalledWith("has_unrecognized_keys", "true");
  });

  it("sets fingerprint with method, dapp name, and unrecognized_keys", () => {
    const error = createZodErrorWithUnrecognizedKeys();
    const walletKit = createMockWalletKit({
      name: "Dapp",
      url: "https://x.com",
    });

    reportZodError({
      error,
      topic: "t2",
      request: { method: "personal_sign" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(mockSetFingerprint).toHaveBeenCalledWith([
      "personal_sign",
      "Dapp",
      "unrecognized_keys",
    ]);
  });

  it("uses topic when dapp metadata is missing", () => {
    const error = createZodErrorInvalidTypeOnly();
    const walletKit = createMockWalletKit(null);

    reportZodError({
      error,
      topic: "fallback-topic-123",
      request: { method: "eth_sign" },
      chainId: "eip155:137",
      walletKit,
    });

    expect(mockSetContext).toHaveBeenCalledWith("dapp", {
      topic: "fallback-topic-123",
      name: undefined,
      url: undefined,
    });
    expect(mockSetTag).toHaveBeenCalledWith("dapp_name", "fallback-topic-123");
    expect(mockSetFingerprint).toHaveBeenCalledWith([
      "eth_sign",
      "fallback-topic-123",
      "other",
    ]);
  });

  it("sets has_unrecognized_keys to false and fingerprint 'other' when no unrecognized keys", () => {
    const error = createZodErrorInvalidTypeOnly();
    const walletKit = createMockWalletKit({ name: "App" });

    reportZodError({
      error,
      topic: "t3",
      request: { method: "eth_sign" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(mockSetTag).toHaveBeenCalledWith("has_unrecognized_keys", "false");
    expect(mockSetFingerprint).toHaveBeenCalledWith([
      "eth_sign",
      "App",
      "other",
    ]);
  });

  it("calls captureException with the same error", () => {
    const error = createZodErrorWithUnrecognizedKeys();
    const walletKit = createMockWalletKit({ name: "D" });

    reportZodError({
      error,
      topic: "t5",
      request: { method: "eth_sendTransaction" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("sets chain_id tag", () => {
    const error = createZodErrorInvalidTypeOnly();
    const walletKit = createMockWalletKit({ name: "App" });

    reportZodError({
      error,
      topic: "t6",
      request: { method: "eth_sign" },
      chainId: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      walletKit,
    });

    expect(mockSetTag).toHaveBeenCalledWith(
      "chain_id",
      "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    );
  });

  it("caps issues at 20", () => {
    const fields: Record<string, z.ZodString> = {};
    for (let i = 0; i < 25; i++) {
      fields[`field_${i}`] = z.string().min(1);
    }
    const schema = z.object(fields);
    const result = schema.safeParse(
      Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => [`field_${i}`, ""]),
      ),
    );
    if (result.success) throw new Error("Expected parse to fail");

    const walletKit = createMockWalletKit({ name: "ManyIssues" });
    reportZodError({
      error: result.error,
      topic: "t7",
      request: { method: "eth_sendTransaction" },
      chainId: "eip155:1",
      walletKit,
    });

    const zodContextCall = mockSetContext.mock.calls.find(
      (c: unknown[]) => c[0] === "zod_validation",
    ) as [string, { issues: unknown[] }] | undefined;
    const issues = zodContextCall?.[1].issues ?? [];
    expect(issues.length).toBe(20);
  });

  it("gracefully handles walletKit.session.get() throwing", () => {
    const error = createZodErrorInvalidTypeOnly();
    const walletKit = {
      engine: {
        signClient: {
          session: {
            get: vi.fn(() => {
              throw new Error("session not found");
            }),
          },
        },
      },
    } as unknown as Parameters<typeof reportZodError>[0]["walletKit"];

    reportZodError({
      error,
      topic: "crash-topic",
      request: { method: "eth_sign" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(mockSetContext).toHaveBeenCalledWith("dapp", {
      topic: "crash-topic",
      name: undefined,
      url: undefined,
    });
    expect(mockSetTag).toHaveBeenCalledWith("dapp_name", "crash-topic");
  });

  it("falls back to url when name is missing", () => {
    const error = createZodErrorInvalidTypeOnly();
    const walletKit = createMockWalletKit({ url: "https://dapp.io" });

    reportZodError({
      error,
      topic: "t8",
      request: { method: "eth_sign" },
      chainId: "eip155:1",
      walletKit,
    });

    expect(mockSetTag).toHaveBeenCalledWith("dapp_name", "https://dapp.io");
    expect(mockSetFingerprint).toHaveBeenCalledWith([
      "eth_sign",
      "https://dapp.io",
      "other",
    ]);
  });
});
