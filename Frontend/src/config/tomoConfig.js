import { getDefaultConfig } from '@tomo-inc/tomo-evm-kit';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';
import { mainnet, polygon, optimism, arbitrum, base, storyAeneid } from 'wagmi/chains';

const config = getDefaultConfig({
  clientId: 'FWViQ7is0I5bjmTrzX0w2OpLa3tLdox6Z7Ow07ua8mlLUSBd7qnk2CBUmUFHMDDDDoJf70dt5G2Rb5GxOhL3rI1G', // Replace with your clientId from https://dashboard.tomo.inc/
  appName: 'ClubDao',
  projectId: 'd698da3404fd0db7fddbaf5bcf17d9b8', // Get this from WalletConnect Cloud
  chains: [mainnet, polygon, optimism, arbitrum, base, storyAeneid],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  ssr: true,
});

export default config; 