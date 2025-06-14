import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Web3 } from 'web3';
import { marketplaceAddress } from "./config";
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json";
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';

// Initialize Web3 with window.ethereum
const web3 = new Web3(window.ethereum);
let contractPublic = null;

function GetProposalById() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [proposalData, setProposalData] = useState(null);
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  async function getContract(userAddress) {
    try {
      contractPublic = new web3.eth.Contract(ABI.abi, marketplaceAddress);
      if (userAddress != null && userAddress != undefined) {
        contractPublic.defaultAccount = userAddress;
      }
      return contractPublic;
    } catch (error) {
      console.error("Error initializing contract:", error);
      throw error;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!isConnected || !address) {
        console.log("Wallet not connected or no address available");
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const clubId = localStorage.getItem("clubId");
        const proposalId = localStorage.getItem("proposalId");

        if (!clubId || !proposalId) {
          throw new Error("Club ID or Proposal ID not found");
        }

        console.log("Starting to fetch data for Club ID:", clubId, "Proposal ID:", proposalId);
        const contract = await getContract(address);

        if (!contract) {
          throw new Error("Failed to initialize contract");
        }

        // Fetch proposal data
        const proposal = await contract.methods.getProposalById(clubId, proposalId).call();
        console.log("Proposal data:", proposal);

        if (!proposal) {
          throw new Error("Proposal not found");
        }

        // Convert vote counts to numbers
        const votesFor = Number(proposal.votesFor);
        const votesAgainst = Number(proposal.votesAgainst);
        console.log("Votes For:", votesFor, "Votes Against:", votesAgainst);

        // Fetch club data
        const club = await contract.methods.getClubById(clubId).call();
        console.log("Club data:", club);

        if (!club) {
          throw new Error("Club not found");
        }

        if (mounted) {
          setProposalData({
            ...proposal,
            votesFor: votesFor,
            votesAgainst: votesAgainst
          });
          setClubData(club);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        if (mounted) {
          setError(error.message || "Failed to fetch proposal data");
          toast.error(error.message || "Failed to fetch proposal data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [address, isConnected]);

  if (loading) {
    return (
      <div className="loading_message">
        Loading proposal details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error_message">
        {error}
      </div>
    );
  }

  if (!proposalData || !clubData) {
    return (
      <div className="error_message">
        No proposal data available
      </div>
    );
  }

  const isCreator = proposalData.creator.toLowerCase() === address?.toLowerCase();
  const isPending = proposalData.status === "0";

  // Format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not available';
    try {
      // Convert BigNumber to string if needed
      const timestampStr = timestamp.toString();
      // Convert to number and multiply by 1000 for milliseconds
      const date = new Date(Number(timestampStr) * 1000);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="proposal-details">
      <div className="club-info">
        <h2>Club Information</h2>
        <p>Name: {clubData.name || 'Unknown Club'}</p>
        <p>Balance: {web3.utils.fromWei(clubData.balance.toString(), 'ether')} IP</p>
        <p>Proposals: {clubData.proposalsCount || '0'}</p>
        <p>Members: {clubData.memberCount || '0'}</p>
      </div>

      <div className="proposal-info">
        <h2>Proposal Details</h2>
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Proposal Details</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="bg-success text-white p-3 rounded" style={{ minHeight: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 className="mb-0">Proposal ID: {proposalData.Cid || 'No CID'}</h3>
                  </div>
                </div>
                <div className="col-12">
                  <p className="proposal_description">{proposalData.description || 'No description available'}</p>
                  <p id="proposal_creator">{proposalData.creator || 'Unknown'}</p>
                  <p id="proposal_destination">{proposalData.destination || 'Unknown'}</p>
                  <p id="proposal_amount">{web3.utils.fromWei(proposalData.amount.toString(), 'ether')} IP</p>
                  <p id="proposal_status">{proposalData.status === "0" ? "Pending" : proposalData.status === "1" ? "Executed" : "Closed"}</p>
                  <p id="votes_for" className="text-success">Accept: {proposalData.votesFor?.toString() || '0'}</p>
                  <p id="votes_against" className="text-danger">Reject: {proposalData.votesAgainst?.toString() || '0'}</p>
                </div>
              </div>
              <div className="form-group">
                <label className="font-weight-bold">Voting Period:</label>
                <p className="form-control-static">
                  Starts: <span id="proposedAt">
                    {proposalData.proposedAt ? formatTimestamp(proposalData.proposedAt) : 'Loading...'}
                  </span><br />
                  Ends: <span id="proposalExpireAt">
                    {proposalData.proposalExpireAt ? formatTimestamp(proposalData.proposalExpireAt) : 'Loading...'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {isPending && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Status: <span id="proposal_status">{proposalData.status === "0" ? "Pending" : proposalData.status === "1" ? "Executed" : "Closed"}</span>
            </h6>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="font-weight-bold">Votes:</label>
              <p>
                For: <span id="votes_for" className="text-success">{proposalData.votesFor || '0'}</span><br />
                Against: <span id="votes_against" className="text-danger">{proposalData.votesAgainst || '0'}</span>
              </p>
            </div>
            <div className="votes_available">
              <div className="form-group">
                <label className="font-weight-bold">Your Vote:</label>
                <select id="option_vote" className="form-control">
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
              <button onClick={() => navigate('/vote')} className="btn btn-success btn-block">
                Submit Vote
              </button>
              <div className="successVote valid-feedback" style={{ display: "none" }} />
              <div className="errorVote invalid-feedback" style={{ display: "none" }} />
            </div>
          </div>
        </div>
      )}

      {/* Creator Options */}
      {isPending && isCreator && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Creator Options</h6>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="font-weight-bold">Select Action:</label>
              <select id="option_execution" className="form-control">
                <option value="execute">Execute proposal</option>
                <option value="close">Close proposal</option>
              </select>
            </div>
            <button onClick={() => navigate('/execute-proposal')} className="btn btn-primary btn-block">
              Confirm Action
            </button>
            <div className="successExecution valid-feedback" style={{ display: "none" }} />
            <div className="errorExecution invalid-feedback" style={{ display: "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default GetProposalById; 