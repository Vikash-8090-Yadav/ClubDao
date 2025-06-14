import React, { useState, useEffect } from 'react';
import { marketplaceAddress } from './config';
import { Web3 } from 'web3';
import $ from 'jquery';
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json";
import { useAccount } from 'wagmi';

// Initialize Web3 with HTTP provider
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));

const GetProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address } = useAccount();

  const getContract = async () => {
    try {
      const contract = new web3.eth.Contract(ABI.abi, marketplaceAddress);
      if(address) {
        contract.defaultAccount = address;
      }
      return contract;
    } catch (error) {
      console.error("Error initializing contract:", error);
      throw error;
    }
  };

  const changeProposal = (proposalId) => {
    localStorage.setItem("proposalId", proposalId);
    window.location.href = "proposal";
  };

  useEffect(() => {
    const loadProposals = async () => {
      try {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        const contract = await getContract();
        
        const clubId = localStorage.getItem("clubId");
        if (!clubId) {
          throw new Error("Club ID not found");
        }

        console.log("Fetching proposals for club:", clubId);
        const clubs = await contract.methods.getProposalsByClub(clubId).call();
        console.log("Proposals fetched:", clubs);
        
        if (clubs && clubs.length > 0) {
          setProposals(clubs);
        } else {
          setProposals([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading proposals:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadProposals();
  }, [address]);

  if (loading) {
    return <div className="loading_message">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Error loading proposals: {error}</div>;
  }

  if (proposals.length === 0) {
    return <div className="alert alert-info">No proposals found for this club.</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Description</th>
          <th>Amount (IP)</th>
          <th>Proposal Status</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal) => (
          <tr key={proposal.id}>
            <td>
              <button 
                className="btn btn-success"
                onClick={() => changeProposal(proposal.id)}
              >
                {proposal.id}
              </button>
            </td>
            <td><b>{proposal.description}</b></td>
            <td><b>{web3.utils.fromWei(proposal.amount.toString(), 'ether')}</b></td>
            <td><b>{proposal.status}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GetProposals; 