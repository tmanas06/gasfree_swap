import { useState, useEffect } from 'react';
import Arweave from 'arweave';
import { useWeb3 } from '../context/Web3Context';

export const useArweave = () => {
  const [arweave, setArweave] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const { account } = useWeb3();

  useEffect(() => {
    const initArweave = async () => {
      try {
        // Initialize Arweave instance
        const arweaveInstance = Arweave.init({
          host: 'arweave.net',
          port: 443,
          protocol: 'https',
          timeout: 20000,
          logging: false,
        });

        setArweave(arweaveInstance);
        setIsConnected(true);
        console.log('Arweave client initialized');
      } catch (error) {
        console.error('Failed to initialize Arweave:', error);
        setIsConnected(false);
      }
    };

    initArweave();
  }, []);

  const generateWallet = async () => {
    if (!arweave) return null;

    try {
      const key = await arweave.wallets.generate();
      setWallet(key);

      const address = await arweave.wallets.jwkToAddress(key);
      const walletBalance = await arweave.wallets.getBalance(address);
      setBalance(arweave.ar.winstonToAr(walletBalance));

      return { key, address };
    } catch (error) {
      console.error('Failed to generate Arweave wallet:', error);
      return null;
    }
  };

  const uploadToArweave = async (file) => {
    if (!arweave || !wallet) {
      throw new Error('Arweave not initialized or no wallet');
    }

    try {
      // Read file as buffer
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Create transaction
      const transaction = await arweave.createTransaction({
        data: data
      }, wallet);

      // Add tags for metadata
      transaction.addTag('Content-Type', file.type);
      transaction.addTag('File-Name', file.name);
      transaction.addTag('App-Name', 'GasFree-DeFi-Wallet');
      transaction.addTag('Version', '1.0.0');
      transaction.addTag('Upload-Date', new Date().toISOString());

      // Sign and submit transaction
      await arweave.transactions.sign(transaction, wallet);
      const response = await arweave.transactions.post(transaction);

      if (response.status === 200) {
        const cost = arweave.ar.winstonToAr(transaction.reward);

        return {
          id: transaction.id,
          hash: transaction.id,
          url: `https://arweave.net/${transaction.id}`,
          cost: parseFloat(cost),
          size: data.length,
          status: 'pending' // Will be confirmed later
        };
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Arweave upload failed:', error);
      throw error;
    }
  };

  const uploadJSONToArweave = async (data) => {
    if (!arweave || !wallet) {
      throw new Error('Arweave not initialized or no wallet');
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString);

      const transaction = await arweave.createTransaction({
        data: buffer
      }, wallet);

      transaction.addTag('Content-Type', 'application/json');
      transaction.addTag('App-Name', 'GasFree-DeFi-Wallet');

      await arweave.transactions.sign(transaction, wallet);
      const response = await arweave.transactions.post(transaction);

      if (response.status === 200) {
        return {
          id: transaction.id,
          url: `https://arweave.net/${transaction.id}`,
          cost: parseFloat(arweave.ar.winstonToAr(transaction.reward))
        };
      } else {
        throw new Error(`JSON upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('JSON upload to Arweave failed:', error);
      throw error;
    }
  };

  const getFromArweave = async (transactionId) => {
    if (!arweave) {
      throw new Error('Arweave not initialized');
    }

    try {
      const response = await fetch(`https://arweave.net/${transactionId}`);
      if (response.ok) {
        return await response.blob();
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to retrieve from Arweave:', error);
      throw error;
    }
  };

  const getTransactionStatus = async (transactionId) => {
    if (!arweave) return null;

    try {
      const status = await arweave.transactions.getStatus(transactionId);
      return {
        status: status.status,
        confirmed: status.confirmed,
        blockHeight: status.block_height,
        blockIndepHash: status.block_indep_hash
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return null;
    }
  };

  const getArweaveBalance = async (address) => {
    if (!arweave) return '0';

    try {
      const winston = await arweave.wallets.getBalance(address);
      return arweave.ar.winstonToAr(winston);
    } catch (error) {
      console.error('Failed to get Arweave balance:', error);
      return '0';
    }
  };

  const calculateUploadCost = async (dataSize) => {
    if (!arweave) return 0;

    try {
      const price = await arweave.transactions.getPrice(dataSize);
      return parseFloat(arweave.ar.winstonToAr(price));
    } catch (error) {
      console.error('Failed to calculate upload cost:', error);
      return 0;
    }
  };

  return {
    arweave,
    isConnected,
    wallet,
    balance,
    generateWallet,
    uploadToArweave,
    uploadJSONToArweave,
    getFromArweave,
    getTransactionStatus,
    getArweaveBalance,
    calculateUploadCost
  };
};