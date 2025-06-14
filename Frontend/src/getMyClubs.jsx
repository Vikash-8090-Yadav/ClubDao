import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { marketplaceAddress } from "./config";
import {Web3} from 'web3';
import $ from 'jquery'; 
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { TomoEVMKitProvider, useConnectModal, useAccountModal } from '@tomo-inc/tomo-evm-kit';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ethers = require("ethers");

const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));
const provider = new ethers.providers.Web3Provider(window.ethereum);
let contractPublic = null;

async function getContract(userAddress) {
  try {
    contractPublic = new web3.eth.Contract(ABI.abi, marketplaceAddress);
    console.log("Contract initialized:", contractPublic);
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
    return true;
  } catch (error) {
    console.error("Error initializing contract:", error);
    return false;
  }
}

function GetMyClubsContent() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClubs() {
      try {
        if (!isConnected || !address) {
          console.log("Wallet not connected or no address available");
          setLoading(false);
          return;
        }

        console.log("Fetching clubs for address:", address);
        const contractInitialized = await getContract(address);
        
        if (!contractInitialized) {
          throw new Error("Failed to initialize contract");
        }

        if (contractPublic) {
          const fetchedClubs = await contractPublic.methods.getMyClubs().call();
          console.log("Raw fetched clubs:", fetchedClubs);
          
          if (fetchedClubs && fetchedClubs.length > 0) {
            const processedClubs = fetchedClubs
              .filter(club => club.clubId != 0)
              .map(club => {
                console.log("Processing club:", club);
                return {
                  clubId: club.clubId,
                  name: club.name,
                  memberCount: club.memberCount || '0',
                  proposalCount: club.proposalCount || '0'
                };
              });
            console.log("Processed clubs:", processedClubs);
            setClubs(processedClubs);
          } else {
            console.log("No clubs found for address:", address);
            setClubs([]);
          }
        }
      } catch (error) {
        console.error("Error fetching clubs:", error);
        toast.error("Error fetching clubs: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClubs();
  }, [address, isConnected]);

  function changeClub(clubId) {
    localStorage.setItem('clubId', clubId);
    window.location.href = '/club';
  }

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        <h3>Please connect your wallet to view your clubs</h3>
        <button 
          className="btn btn-primary mt-3"
          onClick={openConnectModal}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading_message">Loading...</div>;
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center p-4">
        <h3>No clubs found</h3>
        <p>You haven't joined any clubs yet.</p>
        <Link to="/joinclub" className="btn btn-primary mt-3">
          Join a Club
        </Link>
      </div>
    );
  }

  return (
    <div className="my_clubs">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Members</th>
            <th>Proposals</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => (
            <tr key={club.clubId}>
              <td>
                <button 
                  className="btn btn-success btn-sm"
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.375rem 0.75rem',
                    minWidth: '80px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #28a745'
                  }}
                  onClick={() => changeClub(club.clubId)}
                >
                  <span style={{ color: 'white' }}>
                    {String(club.clubId)}
                  </span>
                </button>
              </td>
              <td><b>{club.name}</b></td>
              <td><b>{String(club.memberCount)}</b></td>
              <td><b>{String(club.proposalCount)}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

// Wrap the component with TomoEVMKitProvider
function GetMyClubs() {
  return (
    <TomoEVMKitProvider>
      <GetMyClubsContent />
    </TomoEVMKitProvider>
  );
}

export default GetMyClubs;