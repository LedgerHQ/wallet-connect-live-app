import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import BigNumber from "bignumber.js";
import { networks, payments, Psbt } from "bitcoinjs-lib";
import { vi } from "vitest";
import { handleBIP122Request } from "./BIP122";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

const BTC_CHAIN_ID = "bip122:000000000019d6689c085ae165831e93";

// Build a P2WPKH script from a raw hash160 as Uint8Array.
// bitcoinjs-lib v7 requires Uint8Array (not Buffer subclass) for payment script fields.
const testHash160 = new Uint8Array(20).fill(0xab);
const testScript = new Uint8Array([0x00, 0x14, ...testHash160]); // OP_0 PUSH20 <hash160>
const { address: testAddress } = payments.p2wpkh({
  output: testScript,
  network: networks.bitcoin,
});

function buildTestPsbt(): string {
  const psbt = new Psbt({ network: networks.bitcoin });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x01),
    index: 0,
    witnessUtxo: { script: testScript, value: 100_000n },
  });
  psbt.addOutput({ address: testAddress!, value: 50_000n });
  return psbt.toBase64();
}

const testPsbt = buildTestPsbt();

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "bitcoin-account-id",
    name: "Bitcoin Account",
    address: testAddress!,
    currency: "bitcoin",
    blockHeight: 0,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    lastSyncDate: new Date(),
    ...overrides,
  };
}

function makeClient(
  signPsbtImpl: () => Promise<{ psbtSigned: string; txHash?: string }>,
  getAddressesImpl?: (accountId: string) => Promise<{ address: string }[]>,
): WalletAPIClient {
  const defaultGetAddresses = (accountId: string) => {
    const account = [makeAccount()].find((a) => a.id === accountId);
    return Promise.resolve(account ? [{ address: account.address }] : []);
  };
  return {
    bitcoin: {
      signPsbt: vi.fn(signPsbtImpl),
      getAddresses: vi.fn(getAddressesImpl ?? defaultGetAddresses),
    },
  } as unknown as WalletAPIClient;
}

const walletkit = {} as IWalletKit;
const topic = "topic";
const requestId = 0;

describe("handleBIP122Request — BIP122_SIGN_PSBT", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects with unsupportedMethods when wallet capabilities lack PSBT support", async () => {
    const rejectSpy = vi.spyOn(utils, "rejectRequest");

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: testAddress!, psbt: testPsbt },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount()],
        client: makeClient(() => Promise.resolve({ psbtSigned: "irrelevant" })),
        walletkit,
        walletCapabilities: [],
      },
    );

    expect(rejectSpy).toHaveBeenCalledWith(
      walletkit,
      topic,
      requestId,
      utils.Errors.unsupportedMethods,
      5101,
    );
    expect(vi.spyOn(utils, "acceptRequest")).not.toHaveBeenCalled();
  });

  it("rejects with txDeclined when no account matches the address and chain", async () => {
    const rejectSpy = vi.spyOn(utils, "rejectRequest");

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: testAddress!, psbt: testPsbt },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [],
        client: makeClient(() => Promise.resolve({ psbtSigned: "irrelevant" })),
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(rejectSpy).toHaveBeenCalledWith(
      walletkit,
      topic,
      requestId,
      utils.Errors.txDeclined,
    );
  });

  it("re-throws when the PSBT string cannot be decoded", async () => {
    await expect(
      handleBIP122Request(
        {
          method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
          params: { account: testAddress!, psbt: "not-a-valid-psbt" },
        },
        topic,
        requestId,
        BTC_CHAIN_ID,
        {
          accounts: [makeAccount()],
          client: makeClient(() => Promise.resolve({ psbtSigned: "irrelevant" })),
          walletkit,
          walletCapabilities: ["bitcoin.signPsbt"],
        },
      ),
    ).rejects.toThrow(/Invalid PSBT format/);
  });

  it("rejects with txDeclined when PSBT inputs don't belong to the account", async () => {
    const rejectSpy = vi.spyOn(utils, "rejectRequest");
    // Use an account address that is valid bech32 but different from testAddress
    // (which is derived from testHash160 and embedded in the PSBT inputs)
    const wrongAddress = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: wrongAddress, psbt: testPsbt },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount({ address: wrongAddress })],
        client: makeClient(
          () => Promise.resolve({ psbtSigned: "irrelevant" }),
          () => Promise.resolve([{ address: wrongAddress }]),
        ),
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(rejectSpy).toHaveBeenCalledWith(
      walletkit,
      topic,
      requestId,
      utils.Errors.txDeclined,
    );
  });

  it("rejects with txDeclined when a signInput index is out of bounds", async () => {
    const rejectSpy = vi.spyOn(utils, "rejectRequest");

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: {
          account: testAddress!,
          psbt: testPsbt,
          signInputs: [{ address: testAddress!, index: 99 }],
        },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount()],
        client: makeClient(() => Promise.resolve({ psbtSigned: "irrelevant" })),
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(rejectSpy).toHaveBeenCalledWith(
      walletkit,
      topic,
      requestId,
      utils.Errors.txDeclined,
    );
  });

  it("accepts with the signed PSBT and no txid when broadcast is omitted", async () => {
    const acceptSpy = vi.spyOn(utils, "acceptRequest");
    const client = makeClient(() =>
      Promise.resolve({ psbtSigned: "signed-base64" }),
    );

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: testAddress!, psbt: testPsbt },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount()],
        client,
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(acceptSpy).toHaveBeenCalledWith(walletkit, topic, requestId, {
      psbt: "signed-base64",
    });
  });

  it("accepts with the signed PSBT and txid when broadcast is true", async () => {
    const acceptSpy = vi.spyOn(utils, "acceptRequest");
    const client = makeClient(() =>
      Promise.resolve({ psbtSigned: "signed-base64", txHash: "abc123" }),
    );

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: testAddress!, psbt: testPsbt, broadcast: true },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount()],
        client,
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(acceptSpy).toHaveBeenCalledWith(walletkit, topic, requestId, {
      psbt: "signed-base64",
      txid: "abc123",
    });
  });

  it("rejects with txDeclined when the user cancels during signing", async () => {
    const rejectSpy = vi.spyOn(utils, "rejectRequest");
    const client = makeClient(() =>
      Promise.reject(new Error("User cancelled")),
    );

    await handleBIP122Request(
      {
        method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
        params: { account: testAddress!, psbt: testPsbt },
      },
      topic,
      requestId,
      BTC_CHAIN_ID,
      {
        accounts: [makeAccount()],
        client,
        walletkit,
        walletCapabilities: ["bitcoin.signPsbt"],
      },
    );

    expect(rejectSpy).toHaveBeenCalledWith(
      walletkit,
      topic,
      requestId,
      utils.Errors.txDeclined,
    );
  });

  it("re-throws non-cancellation errors from the signing call", async () => {
    const client = makeClient(() =>
      Promise.reject(new Error("Network failure")),
    );

    await expect(
      handleBIP122Request(
        {
          method: BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT,
          params: { account: testAddress!, psbt: testPsbt },
        },
        topic,
        requestId,
        BTC_CHAIN_ID,
        {
          accounts: [makeAccount()],
          client,
          walletkit,
          walletCapabilities: ["bitcoin.signPsbt"],
        },
      ),
    ).rejects.toThrow("Network failure");
  });
});
