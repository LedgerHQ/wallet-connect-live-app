import { Psbt } from "bitcoinjs-lib";

/**
 * PSBTv2 (BIP-370) support for request validation.
 *
 * bitcoinjs-lib only parses PSBTv0: it requires the global unsigned transaction, which BIP-370
 * removes, so every PSBTv2 fails to decode. This module rebuilds a PSBTv2 as a bitcoinjs-lib `Psbt`
 * carrying what the account checks read: per input the previous outpoint, sequence and UTXO, per
 * output the amount and script, and the proprietary (0xFC) output fields.
 *
 * The result is a validation view only. The PSBT forwarded to the wallet is always the original
 * string, so nothing dropped here is lost for signing.
 */

const PSBT_MAGIC = [0x70, 0x73, 0x62, 0x74, 0xff];

const PSBT_GLOBAL_TX_VERSION = 0x02;
const PSBT_GLOBAL_FALLBACK_LOCKTIME = 0x03;
const PSBT_GLOBAL_INPUT_COUNT = 0x04;
const PSBT_GLOBAL_OUTPUT_COUNT = 0x05;
const PSBT_GLOBAL_VERSION = 0xfb;

const PSBT_IN_NON_WITNESS_UTXO = 0x00;
const PSBT_IN_WITNESS_UTXO = 0x01;
const PSBT_IN_PREVIOUS_TXID = 0x0e;
const PSBT_IN_OUTPUT_INDEX = 0x0f;
const PSBT_IN_SEQUENCE = 0x10;

const PSBT_OUT_AMOUNT = 0x03;
const PSBT_OUT_SCRIPT = 0x04;

const PSBT_PROPRIETARY = 0xfc;

type KeyValue = { key: Uint8Array; value: Uint8Array };

class Reader {
  private offset = 0;

  constructor(private readonly data: Uint8Array) {}

  bytes(length: number): Uint8Array {
    return this.take(length);
  }

  private take(length: number): Uint8Array {
    if (this.offset + length > this.data.length) {
      throw new Error("Unexpected end of PSBT");
    }
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  compactSize(): number {
    const first = this.take(1)[0];
    if (first < 0xfd) return first;
    const width = first === 0xfd ? 2 : first === 0xfe ? 4 : 8;
    const raw = this.take(width);
    let value = 0;
    for (let i = width - 1; i >= 0; i--) value = value * 256 + raw[i];
    if (!Number.isSafeInteger(value)) throw new Error("Compact size too large");
    return value;
  }

  map(): KeyValue[] {
    const entries: KeyValue[] = [];
    for (;;) {
      const keyLength = this.compactSize();
      if (keyLength === 0) return entries;
      const key = this.take(keyLength);
      const value = this.take(this.compactSize());
      entries.push({ key, value });
    }
  }

  magic(): void {
    const head = this.take(PSBT_MAGIC.length);
    if (!PSBT_MAGIC.every((byte, i) => head[i] === byte)) {
      throw new Error("Missing PSBT magic bytes");
    }
  }

  atEnd(): boolean {
    return this.offset === this.data.length;
  }
}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function readUInt32LE(bytes: Uint8Array): number {
  if (bytes.length !== 4) throw new Error("Expected a 4-byte integer");
  return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
}

function readUInt64LE(bytes: Uint8Array): bigint {
  if (bytes.length !== 8) throw new Error("Expected an 8-byte integer");
  return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
}

function findValue(map: KeyValue[], keyType: number): Uint8Array | undefined {
  return map.find(({ key }) => key.length === 1 && key[0] === keyType)?.value;
}

function requireValue(
  map: KeyValue[],
  keyType: number,
  name: string,
): Uint8Array {
  const value = findValue(map, keyType);
  if (!value) throw new Error(`PSBTv2 is missing ${name}`);
  return value;
}

function compactSizeValue(bytes: Uint8Array): number {
  const reader = new Reader(bytes);
  const value = reader.compactSize();
  if (!reader.atEnd()) throw new Error("Malformed compact size value");
  return value;
}

/**
 * The PSBT version declared in the global map (`PSBT_GLOBAL_VERSION`), 0 when absent.
 * @throws {Error} If the bytes are not a PSBT
 */
export function getPsbtVersion(psbtBase64: string): number {
  const reader = new Reader(base64ToBytes(psbtBase64));
  reader.magic();
  const version = findValue(reader.map(), PSBT_GLOBAL_VERSION);
  return version ? readUInt32LE(version) : 0;
}

/**
 * Rebuild a PSBTv2 as a bitcoinjs-lib `Psbt` for validation (see module comment).
 * @throws {Error} If the PSBTv2 is malformed or lacks a field BIP-370 requires
 */
export function psbtV2ToValidationPsbt(psbtBase64: string): Psbt {
  const reader = new Reader(base64ToBytes(psbtBase64));
  reader.magic();
  const globals = reader.map();

  const inputCount = compactSizeValue(
    requireValue(globals, PSBT_GLOBAL_INPUT_COUNT, "the input count"),
  );
  const outputCount = compactSizeValue(
    requireValue(globals, PSBT_GLOBAL_OUTPUT_COUNT, "the output count"),
  );
  const inputs = Array.from({ length: inputCount }, () => reader.map());
  const outputs = Array.from({ length: outputCount }, () => reader.map());
  if (!reader.atEnd()) throw new Error("Trailing bytes after the PSBT maps");

  const psbt = new Psbt();
  psbt.setVersion(
    readUInt32LE(
      requireValue(globals, PSBT_GLOBAL_TX_VERSION, "the transaction version"),
    ),
  );
  const locktime = findValue(globals, PSBT_GLOBAL_FALLBACK_LOCKTIME);
  psbt.setLocktime(locktime ? readUInt32LE(locktime) : 0);

  inputs.forEach((map, i) => {
    const sequence = findValue(map, PSBT_IN_SEQUENCE);
    const witnessUtxo = findValue(map, PSBT_IN_WITNESS_UTXO);
    const nonWitnessUtxo = findValue(map, PSBT_IN_NON_WITNESS_UTXO);
    psbt.addInput({
      // PSBT_IN_PREVIOUS_TXID is in internal byte order, which bitcoinjs-lib expects for bytes.
      hash: requireValue(
        map,
        PSBT_IN_PREVIOUS_TXID,
        `the previous txid of input ${i}`,
      ),
      index: readUInt32LE(
        requireValue(
          map,
          PSBT_IN_OUTPUT_INDEX,
          `the output index of input ${i}`,
        ),
      ),
      sequence: sequence ? readUInt32LE(sequence) : 0xffffffff,
      ...(nonWitnessUtxo && { nonWitnessUtxo }),
    });
    if (witnessUtxo) {
      // Serialized TxOut: 8-byte amount, then a compact-size-prefixed script.
      const utxo = new Reader(witnessUtxo);
      const value = readUInt64LE(utxo.bytes(8));
      const script = utxo.bytes(utxo.compactSize());
      if (!utxo.atEnd())
        throw new Error(`Malformed witness UTXO on input ${i}`);
      psbt.updateInput(i, { witnessUtxo: { value, script } });
    }
  });

  outputs.forEach((map, i) => {
    psbt.addOutput({
      value: readUInt64LE(
        requireValue(map, PSBT_OUT_AMOUNT, `the amount of output ${i}`),
      ),
      script: requireValue(map, PSBT_OUT_SCRIPT, `the script of output ${i}`),
    });
    for (const entry of map) {
      if (entry.key[0] === PSBT_PROPRIETARY)
        psbt.addUnknownKeyValToOutput(i, entry);
    }
  });

  return psbt;
}
