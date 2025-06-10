import React, { useState, useEffect } from 'react';
import { marketplaceAddress } from './config';
import { Web3 } from 'web3';
import $ from 'jquery';
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json";

// Initialize Web3 with window.ethereum for MetaMask
const web3 = new Web3(window.ethereum);

const GetProposals = () => {
  const [contractPublic, setContractPublic] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const getContract = async (userAddress) => {
    try {
      const contract = new web3.eth.Contract(ABI.abi, marketplaceAddress);
      if(userAddress != null && userAddress != undefined) {
        contract.defaultAccount = userAddress;
      }
      setContractPublic(contract);
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
        const walletAddress = localStorage.getItem("filWalletAddress");
        if (!walletAddress) {
          throw new Error("Wallet not connected");
        }

        const contract = await getContract(walletAddress);
        
        const clubId = localStorage.getItem("clubId");
        if (!clubId) {
          throw new Error("Club ID not found");
        }

        console.log("Fetching proposals for club:", clubId);
        const clubs = await contract.methods.getProposalsByClub(clubId).call();
        console.log("Proposals fetched:", clubs);
        
        if (clubs && clubs.length > 0) {
          const list = document.querySelector('.available_proposals');
          if (!list) {
            console.error("Could not find .available_proposals element");
            return;
          }

          // Clear existing content
          list.innerHTML = '';
          
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const tbody = document.createElement('tbody');

          const theadTr = document.createElement('tr');
          const headers = ['ID', 'Description', 'Amount ( IP )', 'Proposal Status'];
          
          headers.forEach(headerText => {
            const th = document.createElement('th');
            th.innerHTML = headerText;
            theadTr.appendChild(th);
          });

          thead.appendChild(theadTr);
          table.className = 'table';
          table.appendChild(thead);

          clubs.forEach((valor) => {
            const tbodyTr = document.createElement('tr');
            
            // ID column with link
            const idCell = document.createElement('td');
            const clubLink = document.createElement('a');
            clubLink.className = 'btn btn-success';
            clubLink.textContent = valor.id;
            clubLink.addEventListener('click', () => changeProposal(valor.id));
            idCell.appendChild(clubLink);
            tbodyTr.appendChild(idCell);

            // Description column
            const descCell = document.createElement('td');
            descCell.innerHTML = '<b>' + valor.description + '</b>';
            tbodyTr.appendChild(descCell);

            // Amount column
            const amountCell = document.createElement('td');
            amountCell.innerHTML = '<b>' + web3.utils.fromWei(valor.amount.toString(), 'ether') + '</b>';
            tbodyTr.appendChild(amountCell);

            // Status column
            const statusCell = document.createElement('td');
            statusCell.innerHTML = '<b>' + valor.status + '</b>';
            tbodyTr.appendChild(statusCell);

            tbody.appendChild(tbodyTr);
          });

          table.appendChild(tbody);
          list.appendChild(table);
        } else {
          const list = document.querySelector('.available_proposals');
          if (list) {
            list.innerHTML = '<div class="alert alert-info">No proposals found for this club.</div>';
          }
        }
        
        $('.loading_message').css('display', 'none');
      } catch (error) {
        console.error("Error loading proposals:", error);
        const list = document.querySelector('.available_proposals');
        if (list) {
          list.innerHTML = '<div class="alert alert-danger">Error loading proposals. Please try again.</div>';
        }
        
        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying proposal load (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          setTimeout(loadProposals, 5000); // Retry after 5 seconds
        }
      }
    };

    loadProposals();
  }, [retryCount]);

  return null;
};

export default GetProposals; 