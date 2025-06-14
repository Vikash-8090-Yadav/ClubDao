import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TomoEVMKitProvider } from '@tomo-inc/tomo-evm-kit';
import config from './config/tomoConfig';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>
          <BrowserRouter>
            {/* Your existing routes and components */}
          </BrowserRouter>
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App; 