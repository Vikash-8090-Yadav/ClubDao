import React, { useState, useEffect } from 'react';
import { marketplaceAddress } from './config';
import { Web3 } from 'web3';
import $ from 'jquery';
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json";

const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));

const GetProposals = () => {
  const [address, setAddress] = useState('');
  const [contractPublic, setContractPublic] = useState(null);

  const getContract = async (userAddress) => {
    try {
      const contract = await new web3.eth.Contract(ABI.abi, marketplaceAddress);
      if (userAddress != null && userAddress != undefined) {
        contract.defaultAccount = userAddress;
      }
      setContractPublic(contract);
    } catch (error) {
      console.error("Error creating contract instance:", error);
    }
  };

  const changeProposal = (proposalId) => {
    localStorage.setItem("proposalId", proposalId);
    window.location.href = "proposal";
  };

  useEffect(() => {
    const loadProposals = async () => {
      const walletAddress = localStorage.getItem("filWalletAddress");
      await getContract(walletAddress);
      
      if (contractPublic) {
        try {
          const clubId = localStorage.getItem("clubId");
          const clubs = await contractPublic.methods.getProposalsByClub(clubId).call();
          
          if (clubs.length > 0) {
            const list = document.querySelector('.available_proposals');
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const theadTr = document.createElement('tr');
            const balanceHeader = document.createElement('th');
            balanceHeader.innerHTML = 'ID';
            theadTr.appendChild(balanceHeader);
            
            const contractNameHeader = document.createElement('th');
            contractNameHeader.innerHTML = 'Description';
            theadTr.appendChild(contractNameHeader);
            
            const contractTickerHeader = document.createElement('th');
            contractTickerHeader.innerHTML = 'Amount ( IP )';
            theadTr.appendChild(contractTickerHeader);

            const usdHeader2 = document.createElement('th');
            usdHeader2.innerHTML = 'Proposal Status';
            theadTr.appendChild(usdHeader2);

            thead.appendChild(theadTr);
            table.className = 'table';
            table.appendChild(thead);

            clubs.forEach((valor) => {
              const tbodyTr = document.createElement('tr');
              const clubLink = document.createElement('a');
              clubLink.className = 'btn btn-success';
              clubLink.textContent = valor.id;
              clubLink.addEventListener('click', () => changeProposal(valor.id));
              tbodyTr.appendChild(clubLink);

              const contractTickerTd = document.createElement('td');
              contractTickerTd.innerHTML = '<b>' + valor.description + '</b>';
              tbodyTr.appendChild(contractTickerTd);

              const balanceTd = document.createElement('td');
              balanceTd.innerHTML = '<b>' + web3.utils.fromWei(valor.amount.toString(), 'ether') + '</b>';
              tbodyTr.appendChild(balanceTd);

              const balanceUSDTd2 = document.createElement('td');
              balanceUSDTd2.innerHTML = '<b>' + valor.status + '</b>';
              tbodyTr.appendChild(balanceUSDTd2);

              tbody.appendChild(tbodyTr);
            });

            table.appendChild(tbody);
            list.appendChild(table);
          }
          $('.loading_message').css('display', 'none');
        } catch (error) {
          console.error("Error fetching proposals:", error);
          $('.loading_message').text('Error loading proposals. Please try again.');
        }
      }
    };

    loadProposals();
  }, [contractPublic]);

  return null;
};

export default GetProposals; 