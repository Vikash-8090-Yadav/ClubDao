import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import $ from 'jquery'; 
import { marketplaceAddress } from "./config";
import {Web3} from 'web3';
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"

// Initialize Web3 with window.ethereum
const web3 = new Web3(window.ethereum);
var contractPublic = null;

var pieceCID = null;
var carsize = null;

async function getContract(userAddress) {
  try {
    contractPublic = new web3.eth.Contract(ABI.abi, marketplaceAddress);
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
    return contractPublic;
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
}

async function getProposalById() {
  try {
    const clubId = localStorage.getItem("clubId");
    const proposalId = localStorage.getItem("proposalId");
    const filWalletAddress = localStorage.getItem("filWalletAddress");

    if (!clubId || !proposalId || !filWalletAddress) {
      console.error("Missing required data:", { clubId, proposalId, filWalletAddress });
      return;
    }

    const contract = await getContract(filWalletAddress);
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    console.log("Fetching proposal:", { clubId, proposalId });
    const proposal = await contract.methods.getProposalById(clubId, proposalId).call();
    console.log("Proposal data:", proposal);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Update UI with proposal data
    $('.proposal_description').text(proposal.description || 'No description available');
    $('#proposal_creator').text(proposal.creator || 'Unknown');
    $('#proposal_destination').text(proposal.destination || 'Unknown');
    $('#proposal_amount').text(web3.utils.fromWei(proposal.amount.toString(), 'ether'));
    $('#proposal_status').text(proposal.status || 'Unknown');
    $('#votes_for').text(proposal.votesFor || '0');
    $('#votes_against').text(proposal.votesAgainst || '0');
    $('#CID').text(proposal.Cid || 'No CID');

    // Handle creator options visibility
    const isCreator = proposal.creator.toLowerCase() === filWalletAddress.toLowerCase();
    if (proposal.status === 'Pending' && isCreator) {
      $('.creator_options').css('display', 'block');
    } else {
      $('.creator_options').css('display', 'none');
    }

    // Handle voting availability
    if (proposal.status !== 'Pending') {
      $('.votes_available').css('display', 'none');
    }

    // Update timestamps
    if (proposal.proposalExpireAt) {
      $('#proposalExpireAt').text(new Date(Number(proposal.proposalExpireAt) * 1000).toLocaleString());
    }
    if (proposal.proposedAt) {
      $('#proposedAt').text(new Date(Number(proposal.proposedAt) * 1000).toLocaleString());
    }

    // Clear loading message
    $('.loading_message').css('display', 'none');

  } catch (error) {
    console.error("Error in getProposalById:", error);
    $('.loading_message').text('Error loading proposal details. Please try again.');
  }
}

export default getProposalById; 