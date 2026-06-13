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
// browser extension OR the MetaMask mobile app via QR / deep link. Supports
// sending the native coin (ETH/POL) AND the USDC token (ERC-20 transfer).
//
// IMPORTANT: this app NEVER sees a private key. It only asks MetaMask to
// connect, switch network, watch a token, and submit a transaction — MetaMask
// shows its own confirmation popup and signs everything itself.
// ---------------------------------------------------------------------------

interface AddParams {
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface Network {
  id: string;
  label: string;
  coin: string;
  emoji: string;
  chainId: string; // hex
  add?: AddParams; // used if the chain isn't already in MetaMask
  // Present for ERC-20 coins (e.g. USDC) — absent means the native coin.
  token?: { address: string; decimals: number };
}

// Chain definitions (so native + USDC variants can share them).
const SEPOLIA_ADD: AddParams = {
  chainName: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};
const POLYGON_ADD: AddParams = {
  chainName: 'Polygon',
  nativeCurrency: { name: 'Polygon', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};
const BASE_ADD: AddParams = {
  chainName: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const NETWORKS: Network[] = [
  // Native coins
  { id: 'eth', label: 'Ethereum', coin: 'ETH', emoji: '💎', chainId: '0x1' },
  { id: 'sepolia', label: 'Sepolia (testnet)', coin: 'SepoliaETH', emoji: '🧪', chainId: '0xaa36a7', add: SEPOLIA_ADD },
  { id: 'polygon', label: 'Polygon', coin: 'POL', emoji: '🟣', chainId: '0x89', add: POLYGON_ADD },
  { id: 'base', label: 'Base', coin: 'ETH', emoji: '🔵', chainId: '0x2105', add: BASE_ADD },
  // USDC (ERC-20, 6 decimals)
  { id: 'usdc-eth', label: 'USDC · Ethereum', coin: 'USDC', emoji: '💵', chainId: '0x1',
    token: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 } },
  { id: 'usdc-sepolia', label: 'USDC · Sepolia (testnet)', coin: 'USDC', emoji: '💵', chainId: '0xaa36a7', add: SEPOLIA_ADD,
    token: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 } },
  { id: 'usdc-polygon', label: 'USDC · Polygon', coin: 'USDC', emoji: '💵', chainId: '0x89', add: POLYGON_ADD,
    token: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 } },
  { id: 'usdc-base', label: 'USDC · Base', coin: 'USDC', emoji: '💵', chainId: '0x2105', add: BASE_ADD,
    token: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 } },
];

// Parse a decimal amount string into the token's smallest unit (no float errors).
function toUnits(amount: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = amount.trim().split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0');
}

// Build the eth_sendTransaction params for either a native or ERC-20 transfer.
function buildTxParams(net: Network, from: string, to: string, amount: string) {
  if (net.token) {
    // ERC-20 transfer(to, amount): selector a9059cbb + padded address + padded amount.
    const units = toUnits(amount, net.token.decimals);
    const data =
      '0xa9059cbb' +
      to.replace(/^0x/, '').toLowerCase().padStart(64, '0') +
      units.toString(16).padStart(64, '0');
    return { from, to: net.token.address, value: '0x0', data };
  }
  return { from, to, value: '0x' + toUnits(amount, 18).toString(16) };
}

type RequestFn = (args: { method: string; params?: unknown }) => Promise<unknown>;

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
  const { sdk, ready, connecting, provider, account, chainId } = useSDK();
  const request = provider?.request as RequestFn | undefined;

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
      await sdk.connect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    }
  }, [sdk]);

  const selectNetwork = useCallback(
    async (n: Network) => {
      setSelected(n);
      setError(null);
      if (!request) return;
      try {
        await request({ method: 'wallet_switchEthereumChain', params: [{ chainId: n.chainId }] });
      } catch (e) {
        const code = (e as { code?: number }).code;
        if (code === 4902 && n.add) {
          try {
            await request({ method: 'wallet_addEthereumChain', params: [{ chainId: n.chainId, ...n.add }] });
          } catch (e2) {
            setError(e2 instanceof Error ? e2.message : 'Could not add network');
          }
        } else {
          setError(e instanceof Error ? e.message : 'Could not switch network');
        }
      }
      // For a token coin, register it in the user's wallet so the balance shows.
      if (n.token) {
        try {
          await request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: { address: n.token.address, symbol: n.coin, decimals: n.token.decimals },
            },
          });
        } catch {
          // User may decline adding the asset — not fatal for sending.
        }
      }
    },
    [request],
  );

  const send = useCallback(async () => {
    if (!request || !account) {
      setError('Connect your wallet first.');
      return;
    }
    if (!selected) {
      setError('Choose a coin and chain first.');
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
      const tx = buildTxParams(selected, account, recipient, amount);
      const hash = (await request({ method: 'eth_sendTransaction', params: [tx] })) as string;
      setTxHash(hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction rejected');
    } finally {
      setBusy(false);
    }
  }, [request, account, selected, recipient, amount]);

  const value = useMemo<Web3Value>(
    () => ({
      hasMetaMask: ready,
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
