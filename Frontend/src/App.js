import React from "react";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TomoEVMKitProvider } from '@tomo-inc/tomo-evm-kit';
import config from './config/tomoConfig';
import Layout from "./components/Layout";
import JoinClub from "./pages/joinclub";
import Base from "./components/base";
import CreateClub from "./pages/createclub";
import DotLoader from "react-spinners/HashLoader";
import CreateProposal from "./pages/createproposal";
import Club from "./pages/club";
import Proposal from "./pages/proposal";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Base />} />
              <Route path="/joinclub" element={<JoinClub />} />
              <Route path="/createclub" element={<CreateClub />} />
              <Route path="/club" element={<Club />} />
              <Route path="/createproposal" element={<CreateProposal />} />
              <Route path="/proposal" element={<Proposal />} />
            </Route>
          </Routes>
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// export const App = () => {
//   const [loading , setLoading] = useState()  
//   var isAuthenticated = localStorage.getItem('filWalletAddress');
//         if(isAuthenticated == null) {
//             location.href = 'login.html';
//         }
        
//   return (
//     <div >  

      
  
      
//         <Routes>
//         <Route element={<Layout />}>
//         <Route index element={<Register />} />
//         <Route path="/login" element={< Login/>} />
//           <Route path="/joinclub" element={<JoinClub />} /> {/* Assuming JoinClub is the correct component */}
//           <Route path="/createclub" element={<CreateClub />} />
//           <Route path="/club" element={<Club />} />
//           <Route path="/createproposal" element={<CreateProposal />} />
//           <Route path="/Proposal" element={<Proposal />} />
          

//           </Route>  
//         </Routes>
      

//     </div>
//   );
// };

