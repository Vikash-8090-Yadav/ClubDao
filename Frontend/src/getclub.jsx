import React, { useEffect, useState } from 'react'
import { marketplaceAddress } from './config';
import {Web3} from 'web3';
import $ from 'jquery'; 
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { useAccount } from 'wagmi';

// Initialize Web3 with Tomo provider
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));
var contractPublic = null;

async function getContract(userAddress) {
    try {
        console.log("Initializing contract with address:", marketplaceAddress);
        contractPublic = new web3.eth.Contract(ABI.abi, marketplaceAddress);
        console.log("Contract initialized successfully");
        
        if(userAddress != null && userAddress != undefined) {
            console.log("Setting contract account to:", userAddress);
            contractPublic.defaultAccount = userAddress;
        }
        return true;
    } catch (error) {
        console.error("Error initializing contract:", error);
        return false;
    }
}

function GetClub() {
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clubData, setClubData] = useState(null);

    useEffect(() => {
        let mounted = true;
        console.log("GetClub component mounted. Wallet status:", { address, isConnected });

        async function fetchClubData() {
            if (!isConnected || !address) {
                console.log("Wallet not connected or no address available");
                setLoading(false);
                return;
            }

            const clubId = localStorage.getItem("clubId");
            if (!clubId) {
                console.log("No club ID found in localStorage");
                setLoading(false);
                return;
            }

            try {
                console.log("Starting to fetch club data for ID:", clubId);
                const contractInitialized = await getContract(address);
                
                if (!contractInitialized) {
                    throw new Error("Failed to initialize contract");
                }

                if (contractPublic) {
                    console.log("Calling getClubById method...");
                    const club = await contractPublic.methods.getClubById(clubId).call();
                    console.log("Club data fetched:", club);

                    if (club && mounted) {
                        setClubData(club);
                        // Update UI elements
                        $('.club_name').text(club.name || '');
                        $('#club_id').text(club.id || '');
                        $('.club_members').text(club.memberCount || '0');
                        $('.club_proposals').text(club.proposalCount || '0');
                        const poolBalanceWei = club.pool || '0';
                        const poolBalanceEther = web3.utils.fromWei(poolBalanceWei.toString(), 'ether');
                        $('.club_balance').text(poolBalanceEther);
                        console.log("UI updated with club data");
                    }
                }
            } catch (error) {
                console.error("Error in fetchClubData:", error);
                if (mounted) {
                    setError(error.message);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchClubData();
        return () => {
            mounted = false;
            console.log("GetClub component unmounting");
        };
    }, [address, isConnected]);

    if (!isConnected) {
        return (
            <div className="wallet-message">
                <h3>Please connect your wallet to view club details</h3>
                <p>Current wallet status: Not Connected</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-message">
                <h3>Loading club data...</h3>
                <p>Connected wallet: {address}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                <h3>Error loading club data</h3>
                <p>{error}</p>
                <p>Please try refreshing the page or reconnecting your wallet.</p>
            </div>
        );
    }

    if (!clubData) {
        return (
            <div className="no-club-message">
                <h3>No club data available</h3>
                <p>Please select a club from your dashboard.</p>
            </div>
        );
    }

    return null; // This component doesn't render anything directly as it updates the UI via jQuery
}

export default GetClub;