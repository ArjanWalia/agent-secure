import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSDK } from '@metamask/sdk-react';

// ---------------------------------------------------------------------------
// MetaMask integration for the "Try it out yourself!" section.
//
// Uses the MetaMask SDK (@metamask/sdk-react) so users can connect with the
// browser extension OR the MetaMask mobile app via QR / deep link.
//
// IMPORTANT: this app NEVER sees a private key. It only asks MetaMask to
// connect, switch network, and submit a transaction — MetaMask shows its own
// confirmation popup and signs everything itself. We just build the request.
// ---------------------------------------------------------------------------

export interface Network {
  id: string;
  label: string;
  coin: string;
  emoji: string;
  chainId: string; // hex
  // Params used if the chain isn't already in MetaMask.
  add?: {
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  };
}

export const NETWORKS: Network[] = [
  { id: 'eth', label: 'Ethereum', coin: 'ETH', emoji: '💎', chainId: '0x1' },
  {
    id: 'sepolia',
    label: 'Sepolia (testnet)',
    coin: 'SepoliaETH',
    emoji: '🧪',
    chainId: '0xaa36a7',
    add: {
      chainName: 'Sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
  },
  {
    id: 'polygon',
    label: 'Polygon',
    coin: 'POL',
    emoji: '🟣',
    chainId: '0x89',
    add: {
      chainName: 'Polygon',
      nativeCurrency: { name: 'Polygon', symbol: 'POL', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com'],
    },
  },
  {
    id: 'base',
    label: 'Base',
    coin: 'ETH',
    emoji: '🔵',
    chainId: '0x2105',
    add: {
      chainName: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    },
  },
];

// Parse a decimal amount string into a hex wei value (no float errors).
function toWeiHex(amount: string): string {
  const [whole = '0', frac = ''] = amount.trim().split('.');
  const fracPadded = (frac + '0'.repeat(18)).slice(0, 18);
  const wei = BigInt(whole || '0') * 10n ** 18n + BigInt(fracPadded || '0');
  return '0x' + wei.toString(16);
}

interface Web3Value {
  hasMetaMask: boolean;
  account: string | null;
  chainId: string | null;
  selected: Network | null;
  recipient: string;
  amount: string;
  txHash: string | null;
  busy: boolean;
  error: string | null;
  setRecipient: (v: string) => void;
  setAmount: (v: string) => void;
  connect: () => Promise<void>;
  selectNetwork: (n: Network) => Promise<void>;
  send: () => Promise<void>;
}

const Web3Context = createContext<Web3Value | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  // Connection state comes from the MetaMask SDK.
  const { sdk, ready, connecting, provider, account, chainId } = useSDK();

  // App-specific transfer state.
  const [selected, setSelected] = useState<Network | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!sdk) {
      setError('MetaMask SDK is not ready yet — try again in a moment.');
      return;
    }
    setError(null);
    try {
      // Opens the MetaMask modal: extension if installed, else a QR for mobile.
      await sdk.connect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    }
  }, [sdk]);

  const selectNetwork = useCallback(
    async (n: Network) => {
      setSelected(n);
      setError(null);
      if (!provider) return;
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: n.chainId }],
        });
      } catch (e) {
        // 4902 = chain not added yet → try to add it.
        const code = (e as { code?: number }).code;
        if (code === 4902 && n.add) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: n.chainId, ...n.add }],
            });
          } catch (e2) {
            setError(e2 instanceof Error ? e2.message : 'Could not add network');
          }
        } else {
          setError(e instanceof Error ? e.message : 'Could not switch network');
        }
      }
    },
    [provider],
  );

  const send = useCallback(async () => {
    if (!provider || !account) {
      setError('Connect your wallet first.');
      return;
    }
    if (!recipient || !amount) {
      setError('Enter a recipient address and amount.');
      return;
    }
    setBusy(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: recipient, value: toWeiHex(amount) }],
      })) as string;
      setTxHash(hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction rejected');
    } finally {
      setBusy(false);
    }
  }, [provider, account, recipient, amount]);

  const value = useMemo<Web3Value>(
    () => ({
      hasMetaMask: ready, // SDK ready → connecting is possible (extension or QR)
      account: account ?? null,
      chainId: chainId ?? null,
      selected,
      recipient,
      amount,
      txHash,
      busy: busy || connecting,
      error,
      setRecipient,
      setAmount,
      connect,
      selectNetwork,
      send,
    }),
    [ready, account, chainId, selected, recipient, amount, txHash, busy, connecting, error, connect, selectNetwork, send],
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
  return ctx;
}
