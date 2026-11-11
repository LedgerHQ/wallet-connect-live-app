import type { Psbt } from "bitcoinjs-lib";

/**
 * Device apps derived from the Bitcoin app, chosen from the content of the PSBT.
 *
 * A Hashi deposit carries the Sui recipient in a proprietary output field. Only the derived app can
 * check the deposit address against that recipient; the Bitcoin app would sign it as a plain send.
 * The app name is fixed here per chain, never taken from the dApp.
 */

// Proprietary type 0xFC, identifier length 5, identifier "hashi". The deposit field adds subtype
// 0x00, but any key with this prefix goes to the derived app, which refuses the ones it does not
// know; the Bitcoin app would ignore them and sign.
const HASHI_KEY_PREFIX = new Uint8Array([
  0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x69,
]);

const HASHI_DEPOSIT_APP_BY_CHAIN: Record<string, string> = {
  "bip122:000000000019d6689c085ae165831e93": "Hashi",
  "bip122:000000000933ea01ad0ee984209779ba": "Hashi Test",
};

export type DeviceAppSelection =
  | { kind: "default" }
  | { kind: "derived"; hwAppId: string }
  | { kind: "unsupported" };

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  return (
    bytes.length >= prefix.length &&
    prefix.every((byte, i) => byte === bytes[i])
  );
}

export function hasHashiDepositField(psbt: Psbt): boolean {
  return psbt.data.outputs.some((output) =>
    (output.unknownKeyVals ?? []).some(({ key }) =>
      startsWith(key, HASHI_KEY_PREFIX),
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
