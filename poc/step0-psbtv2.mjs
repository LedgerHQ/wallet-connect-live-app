// POC step 0: does the live app's PSBT decoder (bitcoinjs-lib Psbt.fromBase64, src/utils/psbt.ts)
// accept a PSBTv2, and does it keep a proprietary output field?
import { Psbt, payments, networks } from "bitcoinjs-lib";

const hex = s => Uint8Array.from(Buffer.from(s, "hex"));
const HASHI_KEY = hex("fc05686173686900"); // 0xFC, len 5, "hashi", subtype 0
const SUI_RECIPIENT = hex("11".repeat(32));

// Account input: P2WPKH of the secp256k1 generator, on testnet. Not spendable, never broadcast.
const pubkey = hex("0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798");
const accountScript = payments.p2wpkh({ pubkey, network: networks.testnet }).output;
const depositScript = hex("5120" + "22".repeat(32)); // P2TR stand-in for the deposit address
const prevTxid = "33".repeat(32);

function buildV0(withField) {
  const psbt = new Psbt({ network: networks.testnet });
  psbt.addInput({ hash: prevTxid, index: 0, witnessUtxo: { script: accountScript, value: 100000n } });
  psbt.addOutput({ script: depositScript, value: 50000n });
  psbt.addOutput({ script: accountScript, value: 49000n });
  if (withField) psbt.addUnknownKeyValToOutput(0, { key: HASHI_KEY, value: SUI_RECIPIENT });
  return psbt.toBase64();
}

// Minimal BIP-370 serializer: same tx as buildV0, written as PSBTv2.
function varint(n) { return n < 0xfd ? Buffer.from([n]) : Buffer.from([0xfd, n & 0xff, n >> 8]); }
function kv(key, value) { return Buffer.concat([varint(key.length), Buffer.from(key), varint(value.length), Buffer.from(value)]); }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }
function u64(n) { const b = Buffer.alloc(8); b.writeBigUInt64LE(n); return b; }
function buildV2(withField) {
  const parts = [Buffer.from("70736274ff", "hex")];
  parts.push(kv([0x02], u32(2)), kv([0x03], u32(0)), kv([0x04], varint(1)), kv([0x05], varint(2)), kv([0xfb], u32(2)), Buffer.from([0]));
  const witnessUtxo = Buffer.concat([u64(100000n), varint(accountScript.length), Buffer.from(accountScript)]);
  parts.push(kv([0x01], witnessUtxo), kv([0x0e], Buffer.from(prevTxid, "hex").reverse()), kv([0x0f], u32(0)), kv([0x10], u32(0xfffffffd)), Buffer.from([0]));
  parts.push(kv([0x03], u64(50000n)), kv([0x04], depositScript));
  if (withField) parts.push(kv(HASHI_KEY, SUI_RECIPIENT));
  parts.push(Buffer.from([0]));
  parts.push(kv([0x03], u64(49000n)), kv([0x04], accountScript), Buffer.from([0]));
  return Buffer.concat(parts).toString("base64");
}

function tryDecode(label, b64) {
  try {
    const psbt = Psbt.fromBase64(b64); // what decodePsbt does
    const unknown = psbt.data.outputs[0].unknownKeyVals ?? [];
    const kept = unknown.some(u => Buffer.from(u.key).equals(Buffer.from(HASHI_KEY)) && Buffer.from(u.value).equals(Buffer.from(SUI_RECIPIENT)));
    const roundTrip = psbt.toBase64() === b64;
    console.log(`${label}: decoded, inputs=${psbt.inputCount}, hashi field kept=${kept}, re-serialized identical=${roundTrip}`);
  } catch (e) {
    console.log(`${label}: REJECTED — ${e.message}`);
  }
}

tryDecode("v0 without field", buildV0(false));
tryDecode("v0 with field   ", buildV0(true));
tryDecode("v2 without field", buildV2(false));
tryDecode("v2 with field   ", buildV2(true));
