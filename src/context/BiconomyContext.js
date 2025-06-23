import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSmartAccountClient, BiconomySmartAccountV2 } from '@biconomy/account';
import { createBundler } from '@biconomy/bundler';
import { createPaymaster } from '@biconomy/paymaster';
import { useWeb3 } from './Web3Context';

const BiconomyContext = createContext();

// Biconomy configuration for different networks
const BICONOMY_CONFIG = {
  1: { // Ethereum
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/1/YOUR_API_KEY',
    paymasterUrl: 'https://paymaster.biconomy.io/api/v1/1/YOUR_API_KEY'
  },
  137: { // Polygon
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/137/YOUR_API_KEY',
    paymasterUrl: 'https://paymaster.biconomy.io/api/v1/137/YOUR_API_KEY'
  },
  56: { // BSC
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/56/YOUR_API_KEY',
    paymasterUrl: 'https://paymaster.biconomy.io/api/v1/56/YOUR_API_KEY'
  },
  42161: { // Arbitrum
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/42161/YOUR_API_KEY',
    paymasterUrl: 'https://paymaster.biconomy.io/api/v1/42161/YOUR_API_KEY'
  },
  10: { // Optimism
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/10/YOUR_API_KEY',
    paymasterUrl: 'https://paymaster.biconomy.io/api/v1/10/YOUR_API_KEY'
  }
};

export const BiconomyProvider = ({ children }) => {
  const { provider, account, chainId, isConnected } = useWeb3();
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gaslessEnabled, setGaslessEnabled] = useState(true);
  const [paymasterBalance, setPaymasterBalance] = useState('0');
  const [bundler, setBundler] = useState(null);
  const [paymaster, setPaymaster] = useState(null);

  // Initialize Biconomy Smart Account
  const initializeBiconomy = async () => {
    if (!provider || !account || !chainId || !isConnected) {
      return;
    }

    const config = BICONOMY_CONFIG[chainId];
    if (!config) {
      console.log('Biconomy not supported on this network');
      return;
    }

    setIsInitializing(true);

    try {
      // Create bundler instance
      const bundlerInstance = await createBundler({
        bundlerUrl: config.bundlerUrl,
        chainId: chainId,
      });

      // Create paymaster instance
      const paymasterInstance = await createPaymaster({
        paymasterUrl: config.paymasterUrl,
        strictMode: false,
      });

      // Create smart account
      const smartAccountInstance = await createSmartAccountClient({
        signer: provider.getSigner(),
        chainId: chainId,
        bundler: bundlerInstance,
        paymaster: paymasterInstance,
        entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint v0.6
      });

      const smartAccountAddr = await smartAccountInstance.getAccountAddress();

      setSmartAccount(smartAccountInstance);
      setSmartAccountAddress(smartAccountAddr);
      setBundler(bundlerInstance);
      setPaymaster(paymasterInstance);
      setIsInitialized(true);

      // Get paymaster balance
      await updatePaymasterBalance(paymasterInstance);

      console.log('Biconomy Smart Account initialized:', smartAccountAddr);

    } catch (error) {
      console.error('Failed to initialize Biconomy:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Update paymaster balance
  const updatePaymasterBalance = async (paymasterInstance) => {
    try {
      // This would typically call a paymaster API to get balance
      // For now, we'll simulate it
      setPaymasterBalance('10.0'); // Simulated balance
    } catch (error) {
      console.error('Failed to get paymaster balance:', error);
    }
  };

  // Execute gasless transaction
  const executeGaslessTransaction = async (transactions) => {
    if (!smartAccount || !gaslessEnabled) {
      throw new Error('Gasless transactions not available');
    }

    try {
      // Build user operation
      const userOp = await smartAccount.buildUserOp(transactions);

      // Get paymaster data
      const paymasterServiceData = {
        mode: "SPONSORED", // or "ERC20" for token payments
        calculateGasLimits: true,
        expiryDuration: 300, // 5 minutes
      };

      const paymasterAndDataResponse = await paymaster.getPaymasterAndData(
        userOp,
        paymasterServiceData
      );

      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
      userOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
      userOp.verificationGasLimit = paymasterAndDataResponse.verificationGasLimit;
      userOp.preVerificationGas = paymasterAndDataResponse.preVerificationGas;

      // Submit transaction
      const userOpResponse = await smartAccount.sendUserOp(userOp);

      // Wait for transaction
      const receipt = await userOpResponse.wait();

      return {
        hash: receipt.receipt.transactionHash,
        receipt: receipt.receipt,
        gasUsed: receipt.receipt.gasUsed,
        gasSaved: true
      };

    } catch (error) {
      console.error('Gasless transaction failed:', error);
      throw error;
    }
  };

  // Execute regular transaction (fallback)
  const executeRegularTransaction = async (transaction) => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();

      return {
        hash: receipt.transactionHash,
        receipt: receipt,
        gasUsed: receipt.gasUsed,
        gasSaved: false
      };

    } catch (error) {
      console.error('Regular transaction failed:', error);
      throw error;
    }
  };

  // Smart transaction executor (tries gasless first, falls back to regular)
  const executeTransaction = async (transactions, forceRegular = false) => {
    if (!forceRegular && gaslessEnabled && smartAccount) {
      try {
        return await executeGaslessTransaction(transactions);
      } catch (error) {
        console.warn('Gasless transaction failed, falling back to regular:', error);
        // Fall back to regular transaction
        if (transactions.length === 1) {
          return await executeRegularTransaction(transactions[0]);
        } else {
          throw new Error('Multiple transactions not supported in regular mode');
        }
      }
    } else {
      if (transactions.length === 1) {
        return await executeRegularTransaction(transactions[0]);
      } else {
        throw new Error('Multiple transactions require gasless mode');
      }
    }
  };

  // Get gas estimates
  const getGasEstimate = async (transaction) => {
    try {
      if (gaslessEnabled && smartAccount) {
        // For gasless, gas cost is 0 for user
        return {
          gasLimit: '0',
          gasPrice: '0',
          gasCost: '0',
          gasCostUSD: '0',
          isGasless: true
        };
      } else if (provider) {
        const gasLimit = await provider.estimateGas(transaction);
        const gasPrice = await provider.getGasPrice();
        const gasCost = gasLimit.mul(gasPrice);

        return {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          gasCost: gasCost.toString(),
          gasCostUSD: '0', // Would need price oracle
          isGasless: false
        };
      }
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return null;
    }
  };

  // Toggle gasless mode
  const toggleGaslessMode = () => {
    setGaslessEnabled(!gaslessEnabled);
  };

  // Initialize when dependencies are ready
  useEffect(() => {
    if (isConnected && !isInitialized && !isInitializing) {
      initializeBiconomy();
    }
  }, [isConnected, account, chainId, provider]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setSmartAccount(null);
      setSmartAccountAddress(null);
      setIsInitialized(false);
      setBundler(null);
      setPaymaster(null);
    }
  }, [isConnected]);

  const value = {
    smartAccount,
    smartAccountAddress,
    isInitializing,
    isInitialized,
    gaslessEnabled,
    paymasterBalance,
    bundler,
    paymaster,
    executeTransaction,
    executeGaslessTransaction,
    executeRegularTransaction,
    getGasEstimate,
    toggleGaslessMode,
    initializeBiconomy,
    updatePaymasterBalance
  };

  return (
    <BiconomyContext.Provider value={value}>
      {children}
    </BiconomyContext.Provider>
  );
};

export const useBiconomy = () => {
  const context = useContext(BiconomyContext);
  if (!context) {
    throw new Error('useBiconomy must be used within a BiconomyProvider');
  }
  return context;
};

export default BiconomyContext;