import type { Psbt } from "bitcoinjs-lib";

/**
 * Device apps derived from the Bitcoin app, chosen from the content of the PSBT.
 *
 * A Hashi deposit carries the Sui recipient in a proprietary output field. Only the derived app can
 * check the deposit address against that recipient; the Bitcoin app would sign it as a plain send.
 * The app name is fixed here per chain, never taken from the dApp.
 */

// Proprietary type 0xFC, identifier length 5, identifier "hashi", subtype 0x00.
const HASHI_DEPOSIT_KEY = new Uint8Array([
  0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x69, 0x00,
]);

const HASHI_DEPOSIT_APP_BY_CHAIN: Record<string, string> = {
  "bip122:000000000019d6689c085ae165831e93": "Hashi",
  "bip122:000000000933ea01ad0ee984209779ba": "Hashi Test",
};

export type DeviceAppSelection =
  | { kind: "default" }
  | { kind: "derived"; hwAppId: string }
  | { kind: "unsupported" };

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

export function hasHashiDepositField(psbt: Psbt): boolean {
  return psbt.data.outputs.some((output) =>
    (output.unknownKeyVals ?? []).some(({ key }) =>
      sameBytes(key, HASHI_DEPOSIT_KEY),
    ),
  );
}

/**
 * Which device app must sign this PSBT on this chain. A Hashi deposit on a chain with no derived
 * app is unsupported rather than sent to the Bitcoin app.
 */
export function selectDeviceApp(
  psbt: Psbt,
  chainId: string,
): DeviceAppSelection {
  if (!hasHashiDepositField(psbt)) return { kind: "default" };
  const hwAppId = HASHI_DEPOSIT_APP_BY_CHAIN[chainId];
  return hwAppId ? { kind: "derived", hwAppId } : { kind: "unsupported" };
}
