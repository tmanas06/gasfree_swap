import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useBiconomy } from '../context/BiconomyContext';
import { useOneInch } from '../hooks/useOneInch';
import { motion, AnimatePresence } from 'framer-motion';
import TokenSelector from './TokenSelector';
import GasEstimator from './GasEstimator';
import SlippageSettings from './SlippageSettings';

const SwapContainer = styled(motion.div)`
  max-width: 500px;
  margin: 20px auto;
  background: \${props => props.theme.cardBackground};
  border-radius: 20px;
  padding: 24px;
  box-shadow: \${props => props.theme.cardShadow};
  border: 1px solid \${props => props.theme.borderColor};
`;

const SwapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SwapTitle = styled.h2`
  color: \${props => props.theme.textPrimary};
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: \${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: \${props => props.theme.hoverBackground};
    color: \${props => props.theme.textPrimary};
  }
`;

const TokenInputGroup = styled.div`
  background: \${props => props.theme.inputBackground};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: \${props => props.theme.primary};
  }
`;

const TokenInputHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TokenLabel = styled.span`
  color: \${props => props.theme.textSecondary};
  font-size: 14px;
  font-weight: 500;
`;

const TokenBalance = styled.span`
  color: \${props => props.theme.textSecondary};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    color: \${props => props.theme.primary};
  }
`;

const TokenInputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const TokenInput = styled.input`
  background: none;
  border: none;
  color: \${props => props.theme.textPrimary};
  font-size: 24px;
  font-weight: 600;
  width: 100%;
  outline: none;

  &::placeholder {
    color: \${props => props.theme.textTertiary};
  }
`;

const SwapArrowContainer = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  margin: 8px 0;
`;

const SwapArrowButton = styled(motion.button)`
  background: \${props => props.theme.primary};
  border: none;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: scale(1.05);
  }
`;

const SwapButton = styled(motion.button)`
  width: 100%;
  background: \${props => {
    if (props.disabled) return props.theme.disabledBackground;
    if (props.gasless) return 'linear-gradient(135deg, #00D4AA 0%, #00A389 100%)';
    return props.theme.primary;
  }};
  color: white;
  border: none;
  border-radius: 16px;
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: \${props => props.disabled ? 'not-allowed' : 'pointer'};
  margin-top: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const GaslessIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 212, 170, 0.1);
  border: 1px solid rgba(0, 212, 170, 0.3);
  border-radius: 12px;
  padding: 8px 12px;
  margin-top: 12px;
`;

const GaslessIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00D4AA;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

const SwapDetails = styled.div`
  background: \${props => props.theme.detailsBackground};
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid \${props => props.theme.borderColor};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: \${props => props.theme.textSecondary};
  font-size: 14px;
`;

const DetailValue = styled.span`
  color: \${props => props.theme.textPrimary};
  font-size: 14px;
  font-weight: 500;
`;

const SwapInterface = () => {
  const { account, chainId, isConnected, provider } = useWeb3();
  const { gaslessEnabled, executeTransaction, getGasEstimate, smartAccountAddress } = useBiconomy();
  const { getSwapQuote, executeSwap } = useOneInch();
  
  const [fromToken, setFromToken] = useState({
    symbol: 'ETH',
    address: ethers.constants.AddressZero,
    decimals: 18,
    balance: '0'
  });
  
  const [toToken, setToToken] = useState({
    symbol: 'USDC',
    address: '0xA0b86a33E6180d93c46B84c3C3E5dc5d6F0d3e6F',
    decimals: 6,
    balance: '0'
  });
  
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);

  // Get swap quote
  const fetchSwapQuote = useCallback(async () => {
    if (!fromAmount || !fromToken || !toToken || !chainId) return;

    try {
      setIsLoading(true);
      const quote = await getSwapQuote({
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: ethers.utils.parseUnits(fromAmount, fromToken.decimals).toString(),
        slippage: slippage,
        from: smartAccountAddress || account
      });

      if (quote) {
        setSwapQuote(quote);
        setToAmount(ethers.utils.formatUnits(quote.toTokenAmount, toToken.decimals));
        setPriceImpact(quote.priceImpact || 0);

        // Get gas estimate
        const gasEst = await getGasEstimate({
          to: quote.tx.to,
          data: quote.tx.data,
          value: quote.tx.value || '0'
        });
        setGasEstimate(gasEst);
      }
    } catch (error) {
      console.error('Failed to get swap quote:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fromAmount, fromToken, toToken, chainId, account, smartAccountAddress, slippage, getSwapQuote, getGasEstimate]);

  // Execute swap transaction
  const handleSwap = async () => {
    if (!swapQuote || !account) return;

    try {
      setIsLoading(true);
      
      const transactions = [{
        to: swapQuote.tx.to,
        data: swapQuote.tx.data,
        value: swapQuote.tx.value || '0'
      }];

      const result = await executeTransaction(transactions);
      
      if (result.hash) {
        console.log('Swap successful:', result.hash);
        // Reset form
        setFromAmount('');
        setToAmount('');
        setSwapQuote(null);
        setGasEstimate(null);
      }
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Flip tokens
  const flipTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  // Set max amount
  const setMaxAmount = () => {
    if (fromToken.balance) {
      const maxAmount = fromToken.symbol === 'ETH' 
        ? Math.max(0, parseFloat(fromToken.balance) - 0.01).toString() // Leave some ETH for gas
        : fromToken.balance;
      setFromAmount(maxAmount);
    }
  };

  // Update quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        fetchSwapQuote();
      } else {
        setToAmount('');
        setSwapQuote(null);
        setGasEstimate(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, slippage, fetchSwapQuote]);

  const canSwap = swapQuote && fromAmount && parseFloat(fromAmount) > 0 && isConnected;
  const isInsufficientBalance = fromAmount && fromToken.balance && 
    parseFloat(fromAmount) > parseFloat(fromToken.balance);

  return (
    <SwapContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <SwapHeader>
        <SwapTitle>Swap</SwapTitle>
        <SettingsButton onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </SettingsButton>
      </SwapHeader>

      <AnimatePresence>
        {showSettings && (
          <SlippageSettings 
            slippage={slippage} 
            onChange={setSlippage}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <TokenInputGroup>
        <TokenInputHeader>
          <TokenLabel>From</TokenLabel>
          <TokenBalance onClick={setMaxAmount}>
            Balance: {parseFloat(fromToken.balance).toFixed(4)}
          </TokenBalance>
        </TokenInputHeader>
        <TokenInputRow>
          <TokenInput
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
          />
          <TokenSelector 
            token={fromToken} 
            onSelect={setFromToken}
            otherToken={toToken}
          />
        </TokenInputRow>
      </TokenInputGroup>

      <SwapArrowContainer>
        <SwapArrowButton
          onClick={flipTokens}
          whileHover={{ rotate: 180 }}
          whileTap={{ scale: 0.9 }}
        >
          ↕️
        </SwapArrowButton>
      </SwapArrowContainer>

      <TokenInputGroup>
        <TokenInputHeader>
          <TokenLabel>To</TokenLabel>
          <TokenBalance>
            Balance: {parseFloat(toToken.balance).toFixed(4)}
          </TokenBalance>
        </TokenInputHeader>
        <TokenInputRow>
          <TokenInput
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
          />
          <TokenSelector 
            token={toToken} 
            onSelect={setToToken}
            otherToken={fromToken}
          />
        </TokenInputRow>
      </TokenInputGroup>

      {gaslessEnabled && (
        <GaslessIndicator>
          <GaslessIcon>✓</GaslessIcon>
          <span>Gasless mode enabled - No gas fees required!</span>
        </GaslessIndicator>
      )}

      {swapQuote && (
        <SwapDetails>
          <DetailRow>
            <DetailLabel>Rate</DetailLabel>
            <DetailValue>
            {fromAmount && parseFloat(fromAmount) > 0 ? (
              `1 ${fromToken.symbol} = ${(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} ${toToken.symbol}`
            ) : (
                  '--'
                )}
  
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Price Impact</DetailLabel>
            <DetailValue style={{ color: priceImpact > 2 ? '#ff6b6b' : '#51cf66' }}>
              {priceImpact.toFixed(2)}%
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Slippage Tolerance</DetailLabel>
            <DetailValue>{slippage}%</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Network Fee</DetailLabel>
            <DetailValue>
              {gasEstimate?.isGasless
              ? 'Free (Gasless)'
              : `${parseFloat(ethers.utils.formatEther(gasEstimate?.gasCost || '0')).toFixed(6)} ETH`}
            </DetailValue>
          </DetailRow>
        </SwapDetails>
      )}

      <SwapButton
        onClick={handleSwap}
        disabled={!canSwap || isInsufficientBalance || isLoading}
        gasless={gaslessEnabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          'Processing...'
        ) : isInsufficientBalance ? (
          'Insufficient Balance'
        ) : !isConnected ? (
          'Connect Wallet'
        ) : !swapQuote ? (
          'Enter Amount'
        ) : gaslessEnabled ? (
          '⚡ Gasless Swap'
        ) : (
          'Swap'
        )}
      </SwapButton>

      {gasEstimate && !gasEstimate.isGasless && (
        <GasEstimator estimate={gasEstimate} />
      )}
    </SwapContainer>
  );
};

export default SwapInterface;