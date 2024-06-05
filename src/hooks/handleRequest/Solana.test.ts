import {
  SOLANA_REQUESTS,
  SOLANA_SIGNING_METHODS,
} from "@/data/methods/Solana.methods";
import { handleSolanaRequest } from "./Solana";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { PublicKey, SystemInstruction, VersionedTransaction } from "@solana/web3.js";
import { vi } from "vitest";
import * as Utils from "./utils";
import * as Handlers from "./solana/handlers/handlers";

vi.mock("./utils");

describe("Testing Solana request handler mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it.only("deserialize", () => {
    const a = VersionedTransaction.deserialize(
      Buffer.from(
        //"AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAGCkrkV4UJh4N18ffx6zRzwT37sQyvOmWyBjq5PPrLtldIVIrM2ldPsFip81Yrg0zeNcXRGQN5tiHP5j8zfz8ylQ2cxjP+2FtJwQKPpzZBjXrLNzJ3fY5FniA4g2bd9Vr1ig4Sb0bWtkekC4Ko3SFk1aSDxx+gdwly5kxW7/oppf4GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACsH4P9uc5VDeldVYzceVRhzPQ3SsaI7BOphAAiCnjaBgMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAtD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp4abFdwhYBhtAOe+t9LolD23cEo0GfBDr8vkxaV/dHyoGBgAFAhVxAQAGAAkDYUgBAAAAAAAEAgADDAIAAACQpCAAAAAAAAgFAwASCQQJk/F7ZPSErnb9CB0JAAMBCBAIBwgRDBELCgMBEhAOEQAJCQ8RDQIIBSPlF8uXeuOtKgEAAAAmZAABoIYBAAAAAADaNAAAAAAAAA8AAAkDAwAAAQkBDhfivpQKyFGlqj+naauwYTyqUwecDGRdm2sc4NgfWaIFg4aCfoAEGz8eCQ==",
        "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAJD0rkV4UJh4N18ffx6zRzwT37sQyvOmWyBjq5PPrLtldIVIrM2ldPsFip81Yrg0zeNcXRGQN5tiHP5j8zfz8ylQ2HtSP6dxsuedeudxnQz19yl9A+HVj18mb7AXpm915cB8kPtHsyvKRD5kG18GfE89zudv2AAqE9tL9IhOAOw9W09JXopPY5L9d+tnaIZjNyCJX8sUL3snd3L4/2yF45wKsOEm9G1rZHpAuCqN0hZNWkg8cfoHcJcuZMVu/6KaX+BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUmHRSqzFvA7sY12ocFofcKOe41qazwv48izGzkkBnXqCl+VE/0RAahO3+mTCz/o+xuFd+JNeAMdBcN6u8BPzfawfg/25zlUN6V1VjNx5VGHM9DdKxojsE6mEACIKeNoGAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAC0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6OdK2WzjZZ/TE1EAKEv3eARbhRCo805JjJIu7m/DBfhpBHnVW/IxwG7udMVuzmgVB/2xst6j9I5RArHNola8E48G3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqeUP1FONqxXuU+PpVrXUKXDOCX6w+kJhwCL7nMjqVcUKBgoABQLr0gIACgAJAxKsFwAAAAAABgIABQwCAAAAkKQgAAAAAAANBQUAHg4GCZPxe2T0hK52/Q0vDggABQIDAR4bDQ0LDRwYHBkUAgQeHxMcCA4OGhwWFxUNHRAMBxEPAwQSEhIIDgkpwSCbM0HWnIEGAgAAACZkAAE6AGQBAqCGAQAAAAAADDQAAAAAAAAPAAAOAwUAAAEJAhbx7FnCE40ksuuuv14pM6i4jtdWtEsGPK0+XdwvqvOLBL6/u8IFIh8gvAkoFugXyJFygRhU3/nII9yQHN8TBi2ACNGbb+4y1M2K7QfT0tHP0NTKAcw=",
        "base64",
      ),
    );
    a.message.compiledInstructions.forEach(instruction => {
      SystemInstruction.decodeInstructionType(instruction);
    })
    expect(a).toBeDefined();
  });

  it("should reject the request when no handler found for the Solana request method", async () => {
    vi.spyOn(Handlers, "getHandler").mockImplementationOnce(() => undefined);

    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: "hello from Wallet Connect",
        pubkey: PublicKey.unique().toString(),
      },
    };
    const accounts: Account[] = [];

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(Utils.acceptRequest).not.toHaveBeenCalled();

    expect(Utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(Utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      Utils.Errors.unsupportedMethods,
      5101,
    );
  });

  it("should call the correct handler when Solana request method is supported", async () => {
    const fakeHandler = vi.fn(
      (
        _request: SOLANA_REQUESTS,
        _topic: string,
        _id: number,
        _chainId: string,
        _accounts: Account[],
        _client: WalletAPIClient,
        _walletKit: IWalletKit,
      ) => {
        return Promise.resolve();
      },
    );
    vi.spyOn(Handlers, "getHandler").mockImplementationOnce(() => fakeHandler);

    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: "hello from Wallet Connect",
        pubkey: PublicKey.unique().toString(),
      },
    };
    const accounts: Account[] = [];

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(fakeHandler).toHaveBeenCalledTimes(1);
    expect(fakeHandler).toHaveBeenCalledWith(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(Utils.rejectRequest).not.toHaveBeenCalled();
  });
});
