'use client';

import { useState, useCallback } from 'react';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { 
  buildReprieveTransaction, 
  REPRIEVE_PRICE_USDC,
} from '@/lib/payments/usdc-payment';
import { getInjectedProvider } from './useAuth';
import {
  trackReprieveInitiated,
  trackReprieveCompleted,
  trackReprieveFailed,
} from '@/lib/analytics';

export type PaymentStatus = 'idle' | 'confirming' | 'pending' | 'verifying' | 'success' | 'error';

export interface UseReprievePaymentReturn {
  // State
  status: PaymentStatus;
  isPaying: boolean;
  error: string | null;
  txHash: string | null;
  
  // Actions
  payForReprieve: (runId: string, streak: number) => Promise<boolean>;
  reset: () => void;
  
  // Info
  price: number;
  currency: string;
  chainName: string;
}

export function useReprievePayment(): UseReprievePaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);
  
  const payForReprieve = useCallback(async (runId: string, streak: number): Promise<boolean> => {
    setStatus('confirming');
    setError(null);
    setTxHash(null);
    
    // Track reprieve initiation
    trackReprieveInitiated(runId, streak);
    
    try {
      // Get the injected provider (Base smart account)
      const provider = getInjectedProvider();
      if (!provider) {
        throw new Error('No wallet connected');
      }
      
      // Create viem wallet client using the injected provider
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider),
      });
      
      // Get the account
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account found');
      }
      
      // Ensure we're on Base network (chain ID 8453)
      // Check current chain and switch if needed
      try {
        const currentChainId = await provider.request({ method: 'eth_chainId' }) as string;
        // Base mainnet chain ID: 8453 = 0x2105
        const baseChainId = `0x${base.id.toString(16)}`;
        
        if (currentChainId.toLowerCase() !== baseChainId.toLowerCase()) {
          console.log('[Reprieve] Switching to Base network...', { current: currentChainId, target: baseChainId });
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseChainId }],
          });
          // Wait a bit for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify switch succeeded
          const newChainId = await provider.request({ method: 'eth_chainId' }) as string;
          if (newChainId.toLowerCase() !== baseChainId.toLowerCase()) {
            throw new Error('Failed to switch to Base network');
          }
        }
      } catch (switchError: unknown) {
        // If switch fails, try to add Base network
        const error = switchError as { code?: number; message?: string };
        if (error?.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${base.id.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (addError) {
            console.error('[Reprieve] Failed to add Base network:', addError);
            throw new Error('Please switch to Base network manually. Current chain does not match Base.');
          }
        } else {
          console.error('[Reprieve] Failed to switch to Base network:', switchError);
          const errorMsg = error?.message || 'Unknown error';
          throw new Error(`Network switch failed: ${errorMsg}. Please switch to Base network manually.`);
        }
      }
      
      // Build the transaction
      const tx = buildReprieveTransaction();
      
      // Send the transaction
      setStatus('pending');
      const hash = await walletClient.sendTransaction({
        account,
        to: tx.to,
        data: tx.data,
        chain: base,
      });
      
      setTxHash(hash);
      setStatus('verifying');
      
      // Verify the transaction on our server
      const verifyResponse = await fetch('/api/reprieve/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          userAddress: account,
          runId,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Transaction verification failed');
      }
      
      setStatus('success');
      
      // Track successful reprieve payment
      trackReprieveCompleted(runId, streak, hash);
      
      return true;
      
    } catch (err) {
      console.error('Reprieve payment failed:', err);
      
      let errorMessage = 'Payment failed';
      if (err instanceof Error) {
        if (err.message.includes('rejected') || err.message.includes('denied')) {
          errorMessage = 'Transaction cancelled';
        } else if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = err.message.slice(0, 60); // Truncate long errors
        }
      }
      
      setError(errorMessage);
      setStatus('error');
      
      // Track failed reprieve payment
      trackReprieveFailed(runId, streak, errorMessage);
      
      return false;
    }
  }, []);
  
  return {
    status,
    isPaying: status !== 'idle' && status !== 'success' && status !== 'error',
    error,
    txHash,
    payForReprieve,
    reset,
    price: REPRIEVE_PRICE_USDC,
    currency: 'USDC',
    chainName: 'Base',
  };
}
