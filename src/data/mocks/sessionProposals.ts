export default {
  many: {
    id: 1715633947547625,
    pairingTopic:
      "b6f7fd86d634476e571b5b6ee9792d4220483eb7797e14d3b1b9baafe5f7fccd",
    expiryTimestamp: 1715634247,
    requiredNamespaces: {},
    optionalNamespaces: {
      eip155: {
        chains: [
          "eip155:1",
          "eip155:8453",
          "eip155:137",
          "eip155:10",
          "eip155:43114",
          "eip155:42161",
          "eip155:56",
          "eip155:11155111",
          "eip155:84532",
          "eip155:80001",
          "eip155:11155420",
          "eip155:421614",
        ],
        methods: [
          "eth_chainId",
          "eth_signTypedData",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_sendTransaction",
          "eth_signTypedData_v4",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
        ],
        events: [
          "chainChanged",
          "accountsChanged",
          "message",
          "disconnect",
          "connect",
        ],
        rpcMap: {
          "1": "https://eth-mainnet.g.alchemy.com/v2/bw196jc7__ncQce8l-n27L9LoWTLT5S-",
          "10": "https://opt-mainnet.g.alchemy.com/v2/Nq1-A87vX8deq3H-zMWwPdjbQS2wCBOi",
          "56": "https://bsc-dataseed1.binance.org",
          "137":
            "https://polygon-mainnet.g.alchemy.com/v2/ZBTMhxiptG_nvQFO2InPpj4fw6jaTQGa",
          "8453":
            "https://base-mainnet.g.alchemy.com/v2/jTatj4jSAZZI3RghkpYiL06GchVrTSwJ",
          "42161":
            "https://arb-mainnet.g.alchemy.com/v2/uq861nHJfZa05zkM9llonMTTQP11l0PJ",
          "43114": "https://api.avax.network/ext/bc/C/rpc",
          "80001":
            "https://polygon-mumbai.g.alchemy.com/v2/TcFHV1YnGTZ6OnN4QkYrJMl0ptcg65oE",
          "84532":
            "https://base-sepolia.g.alchemy.com/v2/T0erRNuLlKa-uvmeSF85cpR1brIII-3j",
          "421614": "https://sepolia-rollup.arbitrum.io/rpc",
          "11155111":
            "https://eth-sepolia.g.alchemy.com/v2/LH--1-HF_fROhqXeETMDJ1sWyN4Mx7_W",
          "11155420": "https://sepolia.optimism.io",
        },
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "b811bd41f52a0a0522953b9b09ad3dac5306f4d133379c4d75de3eafb3966e64",
      metadata: {
        description:
          "Web3 login for everyone. Simple onboarding flows for all your users and powerful developer tools to match.",
        url: "https://demo.dynamic.xyz",
        icons: [
          "https://demo.dynamic.xyz/favicon.ico",
          "https://demo.dynamic.xyz/apple-touch-icon.png",
          "https://demo.dynamic.xyz/favicon-32x32.png",
          "https://demo.dynamic.xyz/favicon-16x16.png",
        ],
        name: "Dynamic | Demo Environment",
      },
    },
  },
  required: {
    id: 1715804846589986,
    pairingTopic:
      "97a873822e39de495546088218ff06fc8bcbf0f4cae883803be071794baf1d59",
    expiryTimestamp: 1715805146,
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "personal_sign"],
        chains: ["eip155:1", "eip155:137"],
        events: ["chainChanged", "accountsChanged"],
      },
    },
    optionalNamespaces: {
      eip155: {
        methods: [
          "eth_signTransaction",
          "eth_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "wallet_getCapabilities",
          "wallet_sendCalls",
          "wallet_getCallsStatus",
        ],
        chains: [
          "eip155:1",
          "eip155:10",
          "eip155:137",
          "eip155:43114",

          "eip155:11155111",
          "eip155:84532",
          "eip155:80001",
          "eip155:11155420",
          "eip155:421614",
        ],
        events: [],
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "564f9d64a931901961d3349187e21b623daa5b1cbf98bb0f357ecf7bf6906538",
      metadata: {
        description: "React App for WalletConnect",
        url: "https://react-app.walletconnect.com",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
        name: "React App",
        verifyUrl: "https://verify.walletconnect.com",
      },
    },
  },
  noSupport: {
    id: 1715810178785219,
    pairingTopic:
      "082107553f4659c56163756117cc1b5a66af2ebff998535c6b1b80e06272f814",
    expiryTimestamp: 1715810478,
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "personal_sign"],
        chains: ["eip155:1", "eip155:100"],
        events: ["chainChanged", "accountsChanged"],
      },
    },
    optionalNamespaces: {
      eip155: {
        methods: [
          "eth_signTransaction",
          "eth_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "wallet_getCapabilities",
          "wallet_sendCalls",
          "wallet_getCallsStatus",
        ],
        chains: ["eip155:1", "eip155:100"],
        events: [],
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "07d8a33be1d557014dcbd760cfb7facc471edb55dcae41971fca1a6643520a78",
      metadata: {
        description: "React App for WalletConnect",
        url: "https://react-app.walletconnect.com",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
        name: "React App",
        verifyUrl: "https://verify.walletconnect.com",
      },
    },
  },
  requiredMissingOne: {
    id: 1715804846589986,
    pairingTopic:
      "97a873822e39de495546088218ff06fc8bcbf0f4cae883803be071794baf1d59",
    expiryTimestamp: 1715805146,
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "personal_sign"],
        // chains: [
        //   "eip155:1",
        //   "eip155:10",
        //   "eip155:137",
        //   "eip155:43114",
        //   "eip155:11155420",
        // ],
        // 10 = Optimism, 137 = Polygon, 1 = Ethereum
        // chains: ["eip155:1", "eip155:10"],
        chains: ["eip155:1", "eip155:137", "eip155:10"],
        events: ["chainChanged", "accountsChanged"],
      },
    },
    optionalNamespaces: {
      eip155: {
        methods: [
          "eth_signTransaction",
          "eth_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "wallet_getCapabilities",
          "wallet_sendCalls",
          "wallet_getCallsStatus",
        ],
        chains: [
          "eip155:1",
          "eip155:10",
          "eip155:137",
          "eip155:43114",

          "eip155:11155111",
          "eip155:84532",
          "eip155:80001",
          "eip155:11155420",
          "eip155:421614",
        ],
        events: [],
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "564f9d64a931901961d3349187e21b623daa5b1cbf98bb0f357ecf7bf6906538",
      metadata: {
        description: "React App for WalletConnect",
        url: "https://react-app.walletconnect.com",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
        name: "React App",
        verifyUrl: "https://verify.walletconnect.com",
      },
    },
  },
  requiredMissingMultiples: {
    id: 1715804846589986,
    pairingTopic:
      "97a873822e39de495546088218ff06fc8bcbf0f4cae883803be071794baf1d59",
    expiryTimestamp: 1715805146,
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "personal_sign"],
        chains: [
          "eip155:1",
          "eip155:10",
          "eip155:137",
          "eip155:43114",
          "eip155:11155420",
        ],
        // 10 = Optimism, 137 = Polygon, 1 = Ethereum
        events: ["chainChanged", "accountsChanged"],
      },
    },
    optionalNamespaces: {
      eip155: {
        methods: [
          "eth_signTransaction",
          "eth_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "wallet_getCapabilities",
          "wallet_sendCalls",
          "wallet_getCallsStatus",
        ],
        chains: [
          "eip155:1",
          "eip155:10",
          "eip155:137",
          "eip155:43114",

          "eip155:11155111",
          "eip155:84532",
          "eip155:80001",
          "eip155:11155420",
          "eip155:421614",
        ],
        events: [],
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "564f9d64a931901961d3349187e21b623daa5b1cbf98bb0f357ecf7bf6906538",
      metadata: {
        description: "React App for WalletConnect",
        url: "https://react-app.walletconnect.com",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
        name: "React App",
        verifyUrl: "https://verify.walletconnect.com",
      },
    },
  },
};
