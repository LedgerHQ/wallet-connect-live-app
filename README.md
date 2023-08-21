# WalletConnect Live App

This is a web application that uses [Next.js](https://nextjs.org/)
and is intended to be integrated within ledger products, enabling users to seamlessly connect to dapps supporting the walletconnect wallet adapter.

## Hosting

This live app is currently hosted at https://wc.apps.ledger.com

## Inputs

Behavior of the live app can be influenced by navigating to it with the following query parameters:

- `uri`: Defines the WalletConnect URI the live app will attempt to connect to at startup.
- `mode`: Used to define the initial mode: `scan` to scan a QR Code or `text` to fill the field with a uri.

## Architecture

- Pages 📝 (All the main screens)
- Components 💄 (UI libray with part of screens and reusable components)
- Hooks 🎣 (All the reusable logic)
- Storage 🛒 (All the stored (persistent or not) data to manage the running of the app )
- Data 📈 (All the types for each chain and some payloads)
- Shared 🖖 (All the useful functions shared throughout the app)

## Store Management

Use of [Zustand](https://github.com/pmndrs/zustand) and `persist` middleware to have a persistent store via the `localStorage`

## Support new Chain/Network

1 - Update `localManifest.json` by adding new entry in currencies:

Check name with Wallet Api Tool

```json
"currencies": [
	"ethereum",
	"polygon",
	"arbitrum",
],
```

2 - Update `@/data/config.ts` by adding in `EIP155_CHAINS` as a `<key,value>` format the new chain with this specific skeleton :
`key` is the currency name (Same as point 1)

```ts
"string": {
	chainId: number
	namespace: string
	ticker: string
	displayName: string
  color: string
}
```

Example to add ethereum

```ts
ethereum: {
	chainId: 1,
	namespace: 'eip155:1',
	ticker: 'ETH',
	displayName: 'Ethereum',
  color: "#0ebdcd",
},
```

## Getting Started

### Environment

First, create an `.env.local` file locally at the root of the repository. You can duplicate `.env.example` and name the new copy `.env.local`.

You will need to replace the value of the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` variable with a working WalletConnect project id. You can find one in the environment variables of the wallet-connect-live-app project in [Vercel](https://vercel.com/ledgerhq/wallet-connect-live-app/settings/environment-variables).

### Proto

**⚠️ Important**: In order to use install the right version of the tools you will need to install the [`proto`](https://moonrepo.dev/proto) toolchain manager.
Please follow the instructions on the [**proto**](https://moonrepo.dev/docs/proto/install) website to install it.

Once you have installed `proto`, please run the following command:

```bash
# Will download and install the supported versions of nodejs, npm and pnpm.
# Run it from the root or a subfolder of the repository.
proto use
```

First, you should install dependencies

```bash
yarn
```

Secondly, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

## Manifest

All Live apps are defined with a manifest. Here is one that can be used for local development:

```json
{
 "id": "ledger-wallet-connect",
 "name": "WalletConnect",
 "url": "http://localhost:3000/",
 "params": {},
 "homepageUrl": "https://walletconnect.com/",
 "icon": "https://forum.zeroqode.com/uploads/default/original/2X/e/e363c6521db27335d44c1134d230b8992792dde4.png",
 "platform": "all",
 "apiVersion": "^2.0.0",
 "manifestVersion": "1",
 "branch": "stable",
 "categories": ["bridge", "defi"],
 "currencies": [
  "ethereum",
  "polygon",
  "bsc",
  "optimism",
  "arbitrum",
  "avalanche_c_chain",
  "ethereum_goerli",
  "optimism_goerli"
 ],
 "content": {
  "shortDescription": {
   "en": "WalletConnect is an open source protocol for connecting decentralised applications to mobile wallets with QR code scanning or deep linking. V2 introduces new features, including the ability to connect to multiple dapps in parallel with multiple accounts. It's important to note that not all dapps currently support V2"
  },
  "description": {
   "en": "WalletConnect is an open source protocol for connecting decentralised applications to mobile wallets with QR code scanning or deep linking. V2 introduces new features, including the ability to connect to multiple dapps in parallel with multiple accounts. It's important to note that not all dapps currently support V2"
  }
 },
 "permissions": [
  "account.list",
  "account.request",
  "message.sign",
  "transaction.sign",
  "transaction.signAndBroadcast",
  "wallet.userId",
  "wallet.info"
 ],
 "domains": ["http://*", "https://*"]
}
```

### Testing Strategy & Prerequisites

We use [`Jest`](https://jestjs.io/) and
[`React Testing Library`](https://testing-library.com/docs/react-testing-library/intro/)

#### Launch tests

The live-app contains unit tests and integration tests.
To run the unit tests :

```bash
yarn test:unit
```

To run integration tests :

```bash
yarn test:integration
```

To run the tests and obtain coverage, simply run

```bash
yarn test:coverage
```

#### Naming convention

To create a simple unit test, use the `*.test.ts(x)` pattern.
To create an integration test, use the `*.integration.test.ts` pattern.

#### Rules

- **Storage Folder**

  Each new file must have its own test file. As the management of the store is important to the correct running of the app, it's necessary to test the different states of the store after manipulation.

- **Utilities files** (helper,util,generic,etc)

  The functions written in these files need to be tested as much as possible, as they can be used in several files.

- **Screens**

  When a new screen is added, a unit test can be added to check that it is displayed correctly. Specifically if there is conditional display

## 🚨 Shutdown WalletConnect LiveApp Process 🚨

You can follow [this procress](https://docs.google.com/document/d/179QyFKLyTYlwJ1yKStZkbKPTlgHUuQkCx5JPsdAcHZc/edit#heading=h.jrc5acxc22wf)

## More Resources

- WalletConnect [Github](https://github.com/walletconnect/walletconnect-monorepo/)
- WalletConnect [Doc](https://docs.walletconnect.com/2.0)
