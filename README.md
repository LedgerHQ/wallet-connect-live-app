# Buy / Sell Live App

[![Deploy to Vercel](https://github.com/LedgerHQ/buy-sell-live-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/LedgerHQ/buy-sell-live-app/actions/workflows/deploy.yml)

This is a web application that uses [Next.js](https://nextjs.org/)
and is intended to be integrated within ledger live desktop application
for buying and selling crypto through our providers with fiat currency.

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

## Default State

The application takes in as query parameters for default state three main props which go as follow:

mode - mode which the application starts in (either buy or sell)
currency - cryptocurrency which the account selection screen should default to
account - address of the selected account which takes precedence over currency options
