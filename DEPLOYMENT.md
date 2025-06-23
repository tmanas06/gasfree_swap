# Deployment Guide

## Prerequisites
- Node.js >= 16.x
- NPM >= 8.x
- Hardhat
- RPC URLs for all supported networks
- API keys for Etherscan, CoinMarketCap, Biconomy, 1inch, IPFS, Arweave

## Steps

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env` and fill in all required values.
3. **Compile contracts**
   ```bash
   npx hardhat compile
   ```
4. **Deploy contracts**
   ```bash
   npm run deploy
   ```
5. **Verify contracts** (optional)
   ```bash
   npx hardhat verify --network <network> <contract_address>
   ```
6. **Start frontend**
   ```bash
   npm start
   ```

## Notes
- Always test on testnets before deploying to mainnet.
- Store your private keys and API keys securely. 