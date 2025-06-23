import { useState, useCallback } from 'react';
import axios from 'axios';

const ONEINCH_API_BASE = 'https://api.1inch.io/v5.0';

// Supported chains by 1inch
const SUPPORTED_CHAINS = {
  1: 'ethereum',
  56: 'bsc',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  43114: 'avalanche',
  100: 'gnosis',
  250: 'fantom'
};

export const useOneInch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get supported tokens for a chain
  const getSupportedTokens = useCallback(async (chainId) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/tokens`);
      return response.data.tokens;
    } catch (error) {
      console.error('Failed to get supported tokens:', error);
      throw error;
    }
  }, []);

  // Get swap quote
  const getSwapQuote = useCallback(async ({
    chainId,
    fromToken,
    toToken,
    amount,
    slippage = 1,
    from,
    protocols = '',
    fee = 0,
    gasLimit = 11500000,
    connectorTokens = '',
    complexityLevel = 2,
    mainRouteParts = 10,
    parts = 50,
    gasPrice = 'standard'
  }) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount,
        fromAddress: from,
        slippage: slippage,
        protocols: protocols,
        fee: fee,
        gasLimit: gasLimit,
        connectorTokens: connectorTokens,
        complexityLevel: complexityLevel,
        mainRouteParts: mainRouteParts,
        parts: parts,
        gasPrice: gasPrice
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 0) {
          delete params[key];
        }
      });

      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/quote`, {
        params: params
      });

      const quote = response.data;

      // Calculate price impact
      const priceImpact = ((parseFloat(amount) - parseFloat(quote.toTokenAmount)) / parseFloat(amount)) * 100;

      return {
        ...quote,
        priceImpact: Math.abs(priceImpact),
        route: quote.protocols || [],
        gasEstimate: quote.estimatedGas
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      console.error('1inch quote failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get swap transaction data
  const getSwapTransaction = useCallback(async ({
    chainId,
    fromToken,
    toToken,
    amount,
    slippage = 1,
    from,
    recipient,
    protocols = '',
    fee = 0,
    gasLimit = 11500000,
    burnChi = false,
    allowPartialFill = false,
    parts = 50,
    mainRouteParts = 10,
    connectorTokens = ''
  }) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount,
        fromAddress: from,
        slippage: slippage,
        protocols: protocols,
        destReceiver: recipient || from,
        fee: fee,
        gasLimit: gasLimit,
        burnChi: burnChi,
        allowPartialFill: allowPartialFill,
        parts: parts,
        mainRouteParts: mainRouteParts,
        connectorTokens: connectorTokens
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false || params[key] === 0) {
          delete params[key];
        }
      });

      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/swap`, {
        params: params
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      console.error('1inch swap transaction failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get spender address for approvals
  const getSpenderAddress = useCallback(async (chainId) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/approve/spender`);
      return response.data.address;
    } catch (error) {
      console.error('Failed to get spender address:', error);
      throw error;
    }
  }, []);

  // Get token allowance
  const getTokenAllowance = useCallback(async ({
    chainId,
    tokenAddress,
    walletAddress
  }) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      const spenderAddress = await getSpenderAddress(chainId);
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/approve/allowance`, {
        params: {
          tokenAddress: tokenAddress,
          walletAddress: walletAddress,
          spenderAddress: spenderAddress
        }
      });
      return response.data.allowance;
    } catch (error) {
      console.error('Failed to get token allowance:', error);
      throw error;
    }
  }, [getSpenderAddress]);

  // Get approval transaction data
  const getApproveTx = useCallback(async ({
    chainId,
    tokenAddress,
    amount
  }) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/approve/transaction`, {
        params: {
          tokenAddress: tokenAddress,
          amount: amount
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get approval transaction:', error);
      throw error;
    }
  }, []);

  // Get liquidity sources
  const getLiquiditySources = useCallback(async (chainId) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/liquidity-sources`);
      return response.data.protocols;
    } catch (error) {
      console.error('Failed to get liquidity sources:', error);
      throw error;
    }
  }, []);

  // Get token price
  const getTokenPrice = useCallback(async (chainId, tokenAddress) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Chain ${chainId} not supported by 1inch`);
    }

    try {
      // Use a small amount to get price (1 token unit)
      const response = await axios.get(`${ONEINCH_API_BASE}/${chainId}/quote`, {
        params: {
          fromTokenAddress: tokenAddress,
          toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
          amount: '1000000000000000000' // 1 token (assuming 18 decimals)
        }
      });
      return response.data.toTokenAmount;
    } catch (error) {
      console.error('Failed to get token price:', error);
      return '0';
    }
  }, []);

  // Execute swap (combines quote and transaction)
  const executeSwap = useCallback(async (swapParams) => {
    try {
      // First get the quote
      const quote = await getSwapQuote(swapParams);

      // Then get the transaction data
      const txData = await getSwapTransaction(swapParams);

      return {
        quote: quote,
        tx: txData.tx,
        toTokenAmount: quote.toTokenAmount,
        fromTokenAmount: quote.fromTokenAmount,
        protocols: quote.protocols,
        estimatedGas: quote.estimatedGas
      };
    } catch (error) {
      console.error('Execute swap failed:', error);
      throw error;
    }
  }, [getSwapQuote, getSwapTransaction]);

  return {
    isLoading,
    error,
    getSupportedTokens,
    getSwapQuote,
    getSwapTransaction,
    getSpenderAddress,
    getTokenAllowance,
    getApproveTx,
    getLiquiditySources,
    getTokenPrice,
    executeSwap,
    supportedChains: SUPPORTED_CHAINS
  };
};