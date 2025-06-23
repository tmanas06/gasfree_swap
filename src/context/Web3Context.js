import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3 from 'web3';

const Web3Context = createContext();

// Supported networks configuration
const SUPPORTED_NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    chainId: 1,
    symbol: 'ETH',
    gasPrice: 'high',
    color: '#627EEA'
  },
  56: {
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    symbol: 'BNB',
    gasPrice: 'low',
    color: '#F3BA2F'
  },
  137: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    chainId: 137,
    symbol: 'MATIC',
    gasPrice: 'lowest',
    color: '#8247E5'
  },
  42161: {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    symbol: 'ETH',
    gasPrice: 'low',
    color: '#28A0F0'
  },
  10: {
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    symbol: 'ETH',
    gasPrice: 'low',
    color: '#FF0420'
  },
  324: {
    name: 'zkSync Era',
    rpcUrl: 'https://mainnet.era.zksync.io',
    chainId: 324,
    symbol: 'ETH',
    gasPrice: 'lowest',
    color: '#4E529A'
  },
  1351057110: {
    name: 'SKALE Calypso',
    rpcUrl: 'https://mainnet.skalenodes.com/v1/honorable-steel-rasalhague',
    chainId: 1351057110,
    symbol: 'sFUEL',
    gasPrice: 'free',
    color: '#00D4AA'
  }
};

const initialState = {
  account: null,
  provider: null,
  web3: null,
  chainId: null,
  balance: '0',
  isConnected: false,
  isConnecting: false,
  error: null,
  networkData: null,
  gasPrice: null,
  blockNumber: null
};

function web3Reducer(state, action) {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, isConnecting: true, error: null };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        account: action.payload.account,
        provider: action.payload.provider,
        web3: action.payload.web3,
        chainId: action.payload.chainId,
        networkData: action.payload.networkData,
        isConnected: true,
        isConnecting: false,
        error: null
      };
    case 'CONNECT_ERROR':
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
        isConnected: false
      };
    case 'DISCONNECT':
      return { ...initialState };
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    case 'UPDATE_GAS_PRICE':
      return { ...state, gasPrice: action.payload };
    case 'UPDATE_BLOCK':
      return { ...state, blockNumber: action.payload };
    case 'SWITCH_NETWORK':
      return {
        ...state,
        chainId: action.payload.chainId,
        networkData: action.payload.networkData
      };
    default:
      return state;
  }
}

export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  // Connect to wallet
  const connectWallet = async (walletType = 'metamask') => {
    dispatch({ type: 'CONNECT_START' });
    
    try {
      let provider;
      
      if (walletType === 'metamask' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } else if (walletType === 'walletconnect') {
        // WalletConnect integration would go here
        throw new Error('WalletConnect not implemented yet');
      } else {
        throw new Error('No wallet detected');
      }

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const web3 = new Web3(provider.provider);
      
      const networkData = SUPPORTED_NETWORKS[chainId];
      if (!networkData) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: {
          account,
          provider,
          web3,
          chainId,
          networkData
        }
      });

      // Update balance
      updateBalance(account, provider);
      
      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            disconnect();
          } else {
            updateBalance(accounts[0], provider);
          }
        });

        window.ethereum.on('chainChanged', (chainId) => {
          window.location.reload();
        });
      }

    } catch (error) {
      dispatch({ type: 'CONNECT_ERROR', payload: error.message });
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    dispatch({ type: 'DISCONNECT' });
    localStorage.removeItem('wallet_connection');
  };

  // Switch network
  const switchNetwork = async (chainId) => {
    try {
      const networkData = SUPPORTED_NETWORKS[chainId];
      if (!networkData) {
        throw new Error('Unsupported network');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      dispatch({
        type: 'SWITCH_NETWORK',
        payload: { chainId, networkData }
      });

    } catch (error) {
      if (error.code === 4902) {
        // Network not added to wallet
        await addNetwork(chainId);
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  // Add network to wallet
  const addNetwork = async (chainId) => {
    const networkData = SUPPORTED_NETWORKS[chainId];
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: networkData.name,
          rpcUrls: [networkData.rpcUrl],
          nativeCurrency: {
            name: networkData.symbol,
            symbol: networkData.symbol,
            decimals: 18
          }
        }]
      });
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  // Update balance
  const updateBalance = async (account, provider) => {
    try {
      const balance = await provider.getBalance(account);
      const balanceFormatted = ethers.utils.formatEther(balance);
      dispatch({ type: 'UPDATE_BALANCE', payload: balanceFormatted });
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  // Get gas price
  const updateGasPrice = async () => {
    if (state.provider) {
      try {
        const gasPrice = await state.provider.getGasPrice();
        dispatch({ type: 'UPDATE_GAS_PRICE', payload: gasPrice });
      } catch (error) {
        console.error('Failed to get gas price:', error);
      }
    }
  };

  // Auto-connect on page load
  useEffect(() => {
    const lastWallet = localStorage.getItem('wallet_connection');
    if (lastWallet && window.ethereum) {
      connectWallet(lastWallet);
    }
  }, []);

  // Update gas price periodically
  useEffect(() => {
    if (state.isConnected) {
      updateGasPrice();
      const interval = setInterval(updateGasPrice, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isConnected, state.provider]);

  const value = {
    ...state,
    connectWallet,
    disconnect,
    switchNetwork,
    addNetwork,
    updateBalance,
    updateGasPrice,
    supportedNetworks: SUPPORTED_NETWORKS
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context;