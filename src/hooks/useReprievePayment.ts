'use client';

import { useState, useCallback } from 'react';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { 
  buildReprieveTransaction, 
  REPRIEVE_PRICE_USDC,
} from '@/lib/payments/usdc-payment';
import { getInjectedProvider } from './useAuth';

export type PaymentStatus = 'idle' | 'confirming' | 'pending' | 'verifying' | 'success' | 'error';

export interface UseReprievePaymentReturn {
  // State
  status: PaymentStatus;
  isPaying: boolean;
  error: string | null;
  txHash: string | null;
  
  // Actions
  payForReprieve: (runId: string) => Promise<boolean>;
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
  
  const payForReprieve = useCallback(async (runId: string): Promise<boolean> => {
    setStatus('confirming');
    setError(null);
    setTxHash(null);
    
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
