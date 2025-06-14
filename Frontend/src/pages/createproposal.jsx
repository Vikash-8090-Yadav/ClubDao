import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Tg from "../components/toggle";
import $ from 'jquery'; 
import { marketplaceAddress } from "../config";
import {Web3} from 'web3';
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { notification } from 'antd';

import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { TomoEVMKitProvider, useConnectModal, useAccountModal } from '@tomo-inc/tomo-evm-kit';
import GetClub from "../getclub";
const ethers = require("ethers")

// Initialize Web3 with the correct provider
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

function CreateProposalContent() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [Password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubData, setClubData] = useState(null);

  const fetchClubData = async () => {
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
        console.log("Raw club data fetched:", club);

        if (club) {
          setClubData(club);
          
          // Update UI elements with proper error handling
          try {
            // Update club name
            if (club.name) {
              $('.club_name').text(club.name);
              console.log("Club name updated:", club.name);
            }

            // Update club ID
            if (club.clubId) {
              $('#club_id').text(club.clubId);
              console.log("Club ID updated:", club.clubId);
            }

            // Update member count
            if (club.memberCount !== undefined) {
              const memberCount = club.memberCount.toString();
              $('.club_members').text(memberCount);
              console.log("Member count updated:", memberCount);
            }

            // Update proposal count
            if (club.proposalCount !== undefined) {
              const proposalCount = club.proposalCount.toString();
              $('.club_proposals').text(proposalCount);
              console.log("Proposal count updated:", proposalCount);
            }

            // Update balance
            if (club.pool !== undefined) {
              const poolBalanceWei = club.pool.toString();
              console.log("Raw pool balance (wei):", poolBalanceWei);
              const poolBalanceEther = web3.utils.fromWei(poolBalanceWei, 'ether');
              console.log("Converted pool balance (ether):", poolBalanceEther);
              $('.club_balance').text(poolBalanceEther);
            }

          } catch (uiError) {
            console.error("Error updating UI:", uiError);
            toast.error("Error updating UI: " + uiError.message);
          }
        } else {
          console.log("No club data received");
          toast.error("No club data found");
        }
      }
    } catch (error) {
      console.error("Error in fetchClubData:", error);
      toast.error("Error fetching club data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("CreateProposal component mounted. Wallet status:", { address, isConnected });

    if (mounted) {
      fetchClubData();
    }

    return () => {
      mounted = false;
      console.log("CreateProposal component unmounting");
    };
  }, [address, isConnected]);

  async function createProposal() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      if (!description || !destination || !amount || amount <= 0) {
        toast.error("Please fill in all required fields with valid values");
        return;
      }

      const clubId = localStorage.getItem("clubId");
      if (!clubId) {
        toast.error("No club selected");
        return;
      }

      toast.info('Proposal Creation initiated ...', {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      // Generate a random CID string
      const randomCid = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const proposalId = localStorage.getItem("proposalId");
      localStorage.setItem(proposalId-100, randomCid);

      // Convert amount to wei
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

      // Prepare the transaction
      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("createProposal", [
        clubId,
        amountInWei,
        destination,
        description,
        randomCid
      ]);

      // Get gas price
      const gasPrice = await publicClient.getGasPrice();
      
      // Prepare the transaction
      const tx = {
        account: address,
        to: marketplaceAddress,
        data: encodedData,
        chainId: chainId,
        gasPrice: gasPrice,
        value: parseEther('0'), // Add value if needed
      };

      console.log('Sending transaction:', tx);

      // Send the transaction
      const hash = await walletClient.sendTransaction(tx);
      console.log('Transaction hash:', hash);
      
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      notification.success({
        message: 'Transaction Successful',
        description: (
          <div>
            Transaction Hash: <a href={`https://aeneid.storyscan.io/tx/${receipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{receipt.transactionHash}</a>
          </div>
        )
      });

      // Clear form
      setDescription('');
      setTitle('');
      setAmount('');
      setDestination('');
      
      toast.success('Proposal Creation Successful ...', {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Transaction failed');
    }
  }

  function Logout(){
    web3.eth.accounts.wallet.clear();
    localStorage.clear();
    navigate('/login');
  
  }

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        <h3>Please connect your wallet to create a proposal</h3>
        <button 
          className="btn btn-primary mt-3"
          onClick={openConnectModal}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <>
      <div id="page-top">
        <div id="wrapper">
          {/* Sidebar */}
          <ul
            className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
            id="accordionSidebar"
          >
            {/* Sidebar - Brand */}
            <a
              className="sidebar-brand d-flex align-items-center justify-content-center"
              href="/"
            >
              <div className="sidebar-brand-icon rotate-n-15">
                <i className="fas fa-laugh-wink" />
              </div>
              <div className="sidebar-brand-text mx-3">CLUBDAO</div>
            </a>
            {/* Divider */}
            <hr className="sidebar-divider my-0" />
            {/* Nav Item - Dashboard */}
            <li className="nav-item active">
              <a className="nav-link" href="/">
                <i className="fas fa-fw fa-tachometer-alt" />
                <span>Dashboard</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/joinclub">
                <i className="fas fa-fw fa-file-image-o" />
                <span>Available clubs</span>
              </a>
            </li>
            <li className="nav-item">
            <Link  className="nav-link" to="/createclub">
                <i className="fas fa-fw fa-file-image-o" />
                <span>Create club</span>
              </Link>
            </li>
            {/* Divider */}
            <hr className="sidebar-divider d-none d-md-block" />
            {/* Sidebar Toggler (Sidebar) */}
            <div className="text-center d-none d-md-inline">
              <button  onClick={Tg} className="rounded-circle border-0" id="sidebarToggle" />
            </div>
          </ul>
          {/* End of Sidebar */}
          {/* Content Wrapper */}
          <div id="content-wrapper" className="d-flex flex-column">
            {/* Main Content */}
            <div id="content">
              {/* Topbar */}
              
              {/* End of Topbar */}
              {/* Begin Page Content */}
              <div className="container-fluid">
                {/* Page Heading */}
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                  <h1 className="h3 mb-0 text-gray-800">Create a new proposal</h1>
                </div>
                {/* Content Row */}
                <div className="row">
                  {/* Earnings (Monthly) Card Example */}
                  <div className="col-xl-2 col-md-6 mb-4">
                    <div className="card border-left-primary shadow h-100 py-2">
                      <div className="card-body">
                        <div className="row no-gutters align-items-center">
                          <div className="col mr-2">
                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                              Club Balance (IP)
                            </div>
                            <div className="h5 mb-0 font-weight-bold text-gray-800 club_balance">
                              -
                            </div>
                          </div>
                          <div className="col-auto">
                            <i className="fas fa-calendar fa-2x text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-success shadow h-100 py-2">
                      <div className="card-body">
                        <div className="row no-gutters align-items-center">
                          <div className="col mr-2">
                            <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                              Dashboard
                            </div>
                            <a className="btn btn-primary" href="/">
                              Go to Dashboard
                            </a>
                          </div>
                          <div className="col-auto">
                            <i className="fas fa-clipboard-list fa-2x text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-success shadow h-100 py-2">
                      <div className="card-body">
                        <div className="row no-gutters align-items-center">
                          <div className="col mr-2">
                            <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                              Proposals{" "}
                            </div>
                            <Link  className="btn btn-secondary" to="/club">
                            
                              See all proposals
                            </Link>
                          </div>
                          <div className="col-auto">
                            <i className="fas fa-clipboard-list fa-2x text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Content Row */}
                <div className="row">
                  {/* Area Chart */}
                  <div className="col-xl-12 col-lg-9">
                    <div className="card shadow mb-4">
                      {/* Card Header - Dropdown */}
                      <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                        <h6 className="m-0 font-weight-bold text-primary">
                          Create your own proposal
                        </h6>
                      </div>
                      {/* Card Body */}
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-12">
                          Title:{" "}
                            <input
                              type="text"
                              id="proposal_description"
                              className="form-control form-control-user"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Give a description for this proposal"
                            />{" "}
                            <br />
                            Description:{" "}
                            <input
                              type="text"
                              id="proposal_description"
                              className="form-control form-control-user"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Give a description for this proposal"
                            />{" "}
                            <br />
                            Destination address:{" "}
                            <input
                              type="text"
                              id="proposal_address"
                              className="form-control form-control-user"
                              value={destination}
onChange={(e) => setDestination(e.target.value)}
                              placeholder="Enter the sepolia destination address: 0x....."
                            />{" "}
                            <br />
                            Amount (in IP):{" "}
                            <input
                              type="number"
                              id="proposal_amount"
                              className="form-control form-control-user"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="Enter the amount"
                            />{" "}
                            
                            <br />
                            <br />
                            <input
                              type="button"
                              id="createProposalButton"
                              defaultValue="Create and Upload to LightHouse"
                              onClick={() => {
                                createProposal();
                              }}
                              className="btn btn-primary btn-block"
                            />
                            <span
                              className="loading_message_creating"
                              style={{ display: "none" }}
                            >
                              Creating the proposal...
                            </span>{" "}
                            <br />

                            
                            <p
                              className="valid-feedback"
                              id="successCreateProposal"
                              style={{ display: "none" }}
                            />
                            <p
                              className="invalid-feedback"
                              id="errorCreateProposal"
                              style={{ display: "none" }}
                            >
                              Error
                            </p>
                  
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Content Row */}
                <div className="row">
                  <div className="col-lg-6 mb-4"></div>
                </div>
              </div>
              {/* /.container-fluid */}
            </div>
            {/* End of Main Content */}
            {/* Footer */}
            <footer className="sticky-footer bg-white"></footer>
          </div>
          {/* End of Content Wrapper */}
        </div>
        {/* End of Page Wrapper */}
        {/* Scroll to Top Button*/}
        <a className="scroll-to-top rounded" href="#page-top">
          <i className="fas fa-angle-up" />
        </a>
        {/* Logout Modal*/}
        <div
          className="modal fade"
          id="seeAccountModal"
          tabIndex={-1}
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Account
                </h5>
                <button
                  className="close"
                  type="button"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body">
                Address: <br /> <div className="current_account" />
                <br />
                <span
                  style={{ fontSize: "x-small" }}
                  className="current_account_text"
                />
              </div>
              <div className="modal-footer"></div>
            </div>
          </div>
        </div>
        {/* Logout Modal*/}
        <div
          className="modal fade"
          id="logoutModal"
          tabIndex={-1}
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Ready to Leave?
                </h5>
                <button
                  className="close"
                  type="button"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body">
                Select "Logout" below if you are ready to end your current session in
                this browser.
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  type="button"
                  data-dismiss="modal"
                >
                  Cancel
                </button>
                <div className="btn btn-primary" onClick={Logout} id="btnLogout">
                  Logout
                </div>
              </div>
            </div>
          </div>
         
        </div>
      </div>

      {/* Toast Container */}
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
    </>
  );
}

// Wrap the component with TomoEVMKitProvider
function CreateProposal() {
  return (
    <TomoEVMKitProvider>
      <CreateProposalContent />
    </TomoEVMKitProvider>
  );
}

export default CreateProposal;