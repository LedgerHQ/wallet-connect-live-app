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

## Store Management

Use of [Zustand](https://github.com/pmndrs/zustand) and `persist` middleware to have a persistent store via the `localStorage`

## Getting Started

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
	"name": "Wallet Connect",
	"url": "http://localhost:3000",
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
	"icon": "https://cdn.live.ledger.com/icons/platform/wallet_connect.png",
	"platform": "all",
	"apiVersion": "^1.0.0",
	"manifestVersion": "1",
	"branch": "experimental",
	"categories": ["defi"],
	"currencies": ["ethereum", "polygon", "bsc"],
	"content": {
		"shortDescription": {
			"en": "WalletConnect is an open source protocol for connecting decentralised applications to mobile wallets with QR code scanning or deep linking."
		},
		"description": {
			"en": "WalletConnect is an open source protocol for connecting decentralised applications to mobile wallets with QR code scanning or deep linking."
		}
	},
	"permissions": [],
	"domains": ["http://*"]
}
```
