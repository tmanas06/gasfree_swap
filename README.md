# GasFree DeFi Wallet

A production-ready DeFi wallet with gasless swaps, multi-chain support, decentralized storage (IPFS/Arweave), and more.

## Features
- Gasless swaps via Biconomy
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Optimism, zkSync, SKALE)
- 1inch DEX aggregation
- IPFS and Arweave storage
- Modern React frontend
- Smart contract with AMM functionality

## Getting Started

1. Clone the repo
2. Install dependencies: `npm install`
3. Configure `.env` from `.env.example`
4. Run frontend: `npm start`
5. Deploy contracts: `npm run deploy`

## Directory Structure
See `PROJECT_STRUCTURE.md` for a full breakdown.

## Security
- Uses OpenZeppelin contracts
- Follows best practices for smart contract and frontend security

## env file looks like below
``` bash
# API Keys
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key
REACT_APP_MORALIS_API_KEY=your_moralis_api_key
REACT_APP_COINBASE_API_KEY=your_coinbase_api_key

# Biconomy Configuration
REACT_APP_BICONOMY_API_KEY_ETHEREUM=your_biconomy_ethereum_key
REACT_APP_BICONOMY_API_KEY_POLYGON=your_biconomy_polygon_key
REACT_APP_BICONOMY_API_KEY_BSC=your_biconomy_bsc_key
REACT_APP_BICONOMY_API_KEY_ARBITRUM=your_biconomy_arbitrum_key

# IPFS Configuration
REACT_APP_IPFS_PROJECT_ID=your_ipfs_project_id
REACT_APP_IPFS_PROJECT_SECRET=your_ipfs_project_secret
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key

# Arweave Configuration
REACT_APP_ARWEAVE_GATEWAY=https://arweave.net

# 1inch API
REACT_APP_ONEINCH_API_KEY=your_1inch_api_key

# WalletConnect
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Development
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# Smart Contract Addresses (will be populated after deployment)
REACT_APP_GASFREE_SWAP_ETHEREUM=
REACT_APP_GASFREE_SWAP_POLYGON=
REACT_APP_GASFREE_SWAP_BSC=
REACT_APP_GASFREE_SWAP_ARBITRUM=

# RPC URLs for deployment
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Private key for deployment (DO NOT COMMIT THIS)
PRIVATE_KEY=your_deployment_private_key

# Etherscan API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
```