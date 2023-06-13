# Wallet Connect Live App

This is a web application that uses [Next.js](https://nextjs.org/)
and is intended to be integrated within ledger products, enabling users to seamlessly connect to dapps supporting the walletconnect wallet adapter.

## Hosting

This live app is currently hosted at https://wc.apps.ledger.com

## Inputs

Behavior of the live app can be influenced by navigating to it with the following query parameters:

- `initialAccountId`: Defines the account selected by default.
- `uri`: Defines the WalletConnect URI the live app will attempt to connect to at startup.

## Params

This live app need parameters to be defined in the manifest file

```json
"params": {
      "networks": [
        {
          "currency": "ethereum", // currency id
          "chainId": 1 // evm network chain id
        }
      ]
    }
```

## Architecture

- Pages 📝 (All the main screens)
- Components 💄 (UI libray with part of screens and reusable components)
- Hooks 🎣 (All the reusable logic)
- Storage 🛒 (All the stored (persistent or not) data to manage the running of the app )
- Data 📈 (All the types for each chain and some payloads)

## Store Management

Use of [Zustand](https://github.com/pmndrs/zustand) and `persist` middleware to have a persistent store via the `localStorage`

## Add new Chain support

Look at => `// TO UPDATE WHEN SUPPORTING NEW CHAIN` in code base

1 - Update `localManifest.json` by adding new entry in network

```json
{
	"currency": "arbitrum",
	"chainId": 42161
}
```

2 - Update `EIP155Data` or other file if not in this family. If this is a new family, create new file and apply same logic as `EIP155Data`.

3 - Update `useProposal` hook

Modify somes methods :

- `getNamespace`

## Getting Started

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
	"id": "ledger-wallet-connect-v2",
	"name": "Wallet Connect v2",
	"url": "http://localhost:3000/",
	"params": {
		"networks": [
			{
				"currency": "ethereum",
				"chainId": 1
			},
			{
				"currency": "bsc",
				"chainId": 56
			},
			{
				"currency": "polygon",
				"chainId": 137
			}
		]
	},
	"homepageUrl": "https://walletconnect.com/",
	"icon": "https://forum.zeroqode.com/uploads/default/original/2X/e/e363c6521db27335d44c1134d230b8992792dde4.png",
	"platform": "all",
	"apiVersion": "^2.0.0",
	"manifestVersion": "1",
	"branch": "stable",
	"categories": ["bridge", "defi"],
	"currencies": ["ethereum", "polygon", "bsc"],
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
