import type { Psbt } from "bitcoinjs-lib";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal BIP-370 writer: the same transaction as a v0 PSBT, serialized as v2
// ─────────────────────────────────────────────────────────────────────────────

function compactSize(n: number): number[] {
  if (n < 0xfd) return [n];
  return [0xfd, n & 0xff, n >> 8];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}
function u64(n: bigint): number[] {
  return Array.from({ length: 8 }, (_, i) =>
    Number((n >> BigInt(8 * i)) & 0xffn),
  );
}
function kv(key: ArrayLike<number>, value: ArrayLike<number>): number[] {
  return [
    ...compactSize(key.length),
    ...Array.from(key),
    ...compactSize(value.length),
    ...Array.from(value),
  ];
}

export type V2Options = {
  extraOutputKeys?: { key: Uint8Array; value: Uint8Array }[];
  dropOutputAmount?: boolean;
};

export function toV2(v0: Psbt, options: V2Options = {}): string {
  const bytes: number[] = [0x70, 0x73, 0x62, 0x74, 0xff];
  bytes.push(
    ...kv([0x02], u32(v0.version)),
    ...kv([0x03], u32(v0.locktime)),
    ...kv([0x04], compactSize(v0.inputCount)),
    ...kv([0x05], compactSize(v0.txOutputs.length)),
    ...kv([0xfb], u32(2)),
    0x00,
  );
  v0.txInputs.forEach((input, i) => {
    const data = v0.data.inputs[i];
    if (data.nonWitnessUtxo) bytes.push(...kv([0x00], data.nonWitnessUtxo));
    if (data.witnessUtxo) {
      const { value, script } = data.witnessUtxo;
      bytes.push(
        ...kv(
          [0x01],
          [...u64(value), ...compactSize(script.length), ...script],
        ),
      );
    }
    bytes.push(...kv([0x0e], input.hash), ...kv([0x0f], u32(input.index)));
    if (input.sequence !== undefined)
      bytes.push(...kv([0x10], u32(input.sequence)));
    bytes.push(0x00);
  });
  v0.txOutputs.forEach((output, i) => {
    if (!(options.dropOutputAmount && i === 0))
      bytes.push(...kv([0x03], u64(output.value)));
    bytes.push(...kv([0x04], output.script));
    for (const entry of v0.data.outputs[i].unknownKeyVals ?? [])
      bytes.push(...kv(entry.key, entry.value));
    if (i === 0)
      for (const entry of options.extraOutputKeys ?? [])
        bytes.push(...kv(entry.key, entry.value));
    bytes.push(0x00);
  });
  return btoa(String.fromCharCode(...bytes));
}
