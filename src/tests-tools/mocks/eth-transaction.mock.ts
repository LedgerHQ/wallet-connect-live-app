import { EthTransaction } from "@/helpers/converters"
const to = "0x98BD1afBf1775A1FA55Cbb34B42AC482aA15Ff6E"

const ethTx: EthTransaction = {
  value: "0x00300202020202",
  to,
  gasPrice: "0x00300202",
  gas: "0x0030020",
  data: "0x00FD33eeeeeeeeeeeeee2eEFDFFEE33eeeeeeeeeeee9903KDD",
}

export { to, ethTx }
