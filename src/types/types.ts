import { EthTransaction } from "@/utils/converters";

export type NetworkConfig = {
  chainId: number;
  currency: string;
};

export type InputMode = "scan" | "text";

export type Family = {
  methods: string[];
  chains: string[];
  events: string[];
  required?: boolean;
};
export type Families = Record<string, Family>;
export type Relay = {
  protocol: string;
};
export type Proposer = {
  publicKey: string;
  metadata: {
    description: string;
    url: string;
    icons: string[];
    name: string;
  };
};
export type Proposal = {
  id: number;
  params: {
    id: number;
    pairingTopic: string;
    expiry: number;
    requiredNamespaces: Families;
    optionalNamespaces: Families;
    relays: Relay[];
    proposer: Proposer;
  };
};

export type PendingFlow = {
  id: number;
  topic: string;
  accountId: string;
  message?: string;
  isHex?: boolean;
  ethTx?: EthTransaction;
  // Boolean set to true if the tx had some data before storing it in the localStorage
  // We can then check if we still have some data once we retrieve it from the storage
  // and only trigger the signAndBroadcast transaction flow if the data is still there
  txHadSomeData?: boolean;
  send?: boolean;
};
export enum TabsIndexes {
  Connect = 0,
  Sessions = 1,
}
