import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isLoading: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  const connectWallet = async (walletType = 'metaMask') => {
    try {
      let connector;
      switch (walletType) {
        case 'metaMask':
          connector = metaMaskWallet;
          break;
        case 'rainbow':
          connector = rainbowWallet;
          break;
        case 'walletConnect':
          connector = walletConnectWallet;
          break;
        default:
          connector = metaMaskWallet;
      }
      await connect({ connector });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  return {
    address,
    isConnected,
    chain,
    isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
  };
} 