import { AuthTypes } from "@walletconnect/types";

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

export type VerificationStatus = "UNKNOWN" | "VALID" | "INVALID" | "SCAM";

export type OneClickAuthPayload =
  AuthTypes.BaseEventArgs<AuthTypes.SessionAuthenticateRequestParams>;
