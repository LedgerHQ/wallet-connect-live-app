import { EthTransaction } from "@/utils/converters";
const to = "0x98BD1afBf1775A1FA55Cbb34B42AC482aA15Ff6E";

const ethTx = {
  value: "0x00300202020202",
  to,
  from: "0x78BD1afBf1775A1FA55Cbb34B42AC482aA15Ff6D",
  gasPrice: "0x00300202",
  gas: "0x0030020",
  data: "0x00FD33eeeeeeeeeeeeee2eEFDFFEE33eeeeeeeeeeee9903KDD",
} as const satisfies EthTransaction;

export { ethTx, to };
