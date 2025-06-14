import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { marketplaceAddress } from "../config";
import { TomoEVMKitProvider, useConnectModal, useAccountModal } from '@tomo-inc/tomo-evm-kit';
import { useAccount, useSignMessage, useSignTypedData, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import Web3 from 'web3';
import $, { error } from 'jquery'; 
import { useNavigate } from 'react-router-dom';
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { notification } from 'antd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GetClub from "../getclub";
import GetProposals from "../getProposals";
import WalletConnectModal from "../components/WalletConnectModal";
import axios from 'axios';
import Tg from "../components/toggle";
const ethers = require("ethers")

// Initialize Web3 with TomoEVMKit
const web3 = new Web3(window.ethereum);
var contractPublic = null;

var hash = null;
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

const provider = new ethers.providers.Web3Provider(window.ethereum);

function Club() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [password, setPassword] = useState('');
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClubData = async () => {
    try {
      const clubId = localStorage.getItem("clubId");
      if (!clubId) {
        setLoading(false);
        return;
      }

      const club = await publicClient.readContract({
        address: marketplaceAddress,
        abi: ABI.abi,
        functionName: 'getClubById',
        args: [clubId],
      });

      if (club) {
        setClubData(club);
        
        // Update UI with club data
        if (club.name) {
          $('.club_name').text(club.name);
        }

        if (club.clubId) {
          $('#club_id').text(club.clubId);
        }

        if (club.memberCount !== undefined) {
          const memberCount = club.memberCount.toString();
          $('.club_members').text(memberCount);
        }

        if (club.proposalCount !== undefined) {
          const proposalCount = club.proposalCount.toString();
          $('.club_proposals').text(proposalCount);
        }

        if (club.pool !== undefined) {
          const poolBalanceWei = club.pool.toString();
          const poolBalanceEther = web3.utils.fromWei(poolBalanceWei, 'ether');
          $('.club_balance').text(poolBalanceEther);
        }
      }
    } catch (error) {
      console.error("Error in fetchClubData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if user is authenticated via Google
        const isGoogleAuth = localStorage.getItem("authenticated") === "true";

        // If user is authenticated via Google, proceed without wallet check
        if (isGoogleAuth) {
          const ans = localStorage.getItem("clubverification");
          const pod = localStorage.getItem("podsi");
          if (ans === "a") {
            $('.clubveri').hide();
            $('.clwr').text('Verification Completed-' + pod);
          } else {
            $('.clubveri').show();
          }
          
          // Load club data and verify user
          await Promise.all([
            fetchClubData(),
            verifyUserInClub()
          ]);
          return;
        }

        // If not authenticated via Google, check wallet connection
        if (!isConnected) {
          return;
        }

        // Initialize contract with connected wallet address
        await getContract(address);

        // If both checks pass, proceed with normal flow
        const ans = localStorage.getItem("clubverification");
        const pod = localStorage.getItem("podsi");
        if (ans === "a") {
          $('.clubveri').hide();
          $('.clwr').text('Verification Completed-' + pod);
        } else {
          $('.clubveri').show();
        }
        
        // Load club data and verify user
        await Promise.all([
          fetchClubData(),
          verifyUserInClub()
        ]);

      } catch (error) {
        console.error("Connection check error:", error);
      }
    };

    checkConnection();
  }, [isConnected, address]);

  // Add a new useEffect to handle data refresh when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchClubData();
      verifyUserInClub();
    }
  }, [isConnected, address]);

  // Add a new useEffect to handle initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      const clubId = localStorage.getItem("clubId");
      if (clubId) {
        await fetchClubData();
        await verifyUserInClub();
      }
    };
    loadInitialData();
  }, []);

  async function verifyUserInClub() {
    try {
      const clubId = localStorage.getItem("clubId");
      if (!clubId) {
        return;
      }

      const user = await publicClient.readContract({
        address: marketplaceAddress,
        abi: ABI.abi,
        functionName: 'isMemberOfClub',
        args: [address, clubId],
      });

      // Hide all cards first
      $('.join_club').hide();
      $('.leave_club').hide();

      if (user) {
        // User is a member - show contribute and leave options
        $('.leave_club').show();
      } else {
        // User is not a member - show join option
        $('.join_club').show();
      }
    } catch (error) {
      console.error("Error verifying user in club:", error);
    }
  }

  async function contributeClub() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      const clubId = localStorage.getItem("clubId");
      const amountAE = $('#aeAmount').val();

      if(!amountAE || amountAE <= 0) {
        toast.error("Amount must be more than 0");
        return;
      }

      if(!clubId) {
        toast.error("Club ID not found");
        return;
      }

      await getContract(address);
      
      if(!contractPublic) {
        return;
      }

      const amountInWei = web3.utils.toWei(amountAE.toString(), 'ether');
      const gasPrice = await publicClient.getGasPrice();
      
      const tx = {
        to: marketplaceAddress,
        data: contractPublic.methods.contributeToClub(clubId).encodeABI(),
        value: amountInWei,
        gasLimit: 300000,
        maxFeePerGas: web3.utils.toWei((Number(gasPrice) * 2).toString(), 'wei'),
        maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'),
      };

      const hash = await walletClient.sendTransaction(tx);
      toast.info("Transaction sent! Waiting for confirmation...");
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success("Contribution successful!");
      $('#aeAmount').val('');
      fetchClubData();

    } catch(e) {
      console.error("Transaction error:", e);
      toast.error(e.message || "Error contributing to club");
    }
  }

  async function leaveClub() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      const clubId = localStorage.getItem("clubId");
      if(!clubId) {
        toast.error("Club ID not found");
        return;
      }

      await getContract(address);
      
      if(!contractPublic) {
        return;
      }

      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("leaveClub", [clubId]);
      
      const gasPrice = await publicClient.getGasPrice();
      
      const tx = {
        to: marketplaceAddress,
        data: encodedData,
        gasLimit: 300000,
        maxFeePerGas: web3.utils.toWei((Number(gasPrice) * 2).toString(), 'wei'),
        maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'),
      };

      const hash = await walletClient.sendTransaction(tx);
      toast.info("Transaction sent! Waiting for confirmation...");
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      toast.success("Successfully left club");
      verifyUserInClub();

    } catch(error) {
      console.error(error);
      toast.error(error.message || "Error leaving club");
    }
  }

  async function joinClub() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      const clubId = localStorage.getItem("clubId");
      if(!clubId) {
        toast.error("Club ID not found");
        return;
      }

      await getContract(address);
      
      if(!contractPublic) {
        return;
      }

      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("joinClub", [clubId]);
      
      const gasPrice = await publicClient.getGasPrice();
      
      const tx = {
        to: marketplaceAddress,
        data: encodedData,
        gasLimit: 300000,
        maxFeePerGas: web3.utils.toWei((Number(gasPrice) * 2).toString(), 'wei'),
        maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'),
      };

      const hash = await walletClient.sendTransaction(tx);
      toast.info("Transaction sent! Waiting for confirmation...");
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      toast.success("Successfully joined club");
      verifyUserInClub();

    } catch(error) {
      console.error('Error joining club:', error);
      toast.error(error.message || "Error joining club");
    }
  }

  function Logout(){
    web3.eth.accounts.wallet.clear();
    localStorage.clear();
    navigate('/login');
  
  }

  return (
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
          <Link  className="nav-link" to="/">
            <i className="fas fa-fw fa-tachometer-alt" />
            <span>Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link  className="nav-link" to="/joinclub">
            <i className="fas fa-fw fa-file-image-o" />
            <span>Available clubs</span>
            </Link>
          
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
                <h1 className="h3 mb-0 text-gray-800">
                  <span className="club_name" />
                </h1>
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
                <div className="col-xl-2 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Proposals
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800 club_proposals">
                            -
                          </div>
                          <Link  className="btn btn-secondary btn-sm mt-2" to="/createproposal">
                         
                            Create
                            </Link>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-calendar fa-2x text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-2 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Members
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800 club_members">
                            -
                          </div>
                          {/* <a href="members.html" class="btn btn-primary btn-sm mt-2">View</a> */}
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-calendar fa-2x text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="col-xl-2 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                           VERIFY YOUR DOCUMENTS (PODSI)
                          </div>
                         

                          <div className="h5 mb-0  font-weight-bold text-gray-800 ">
                            
                          <input
                          type="password"
                          id="verifdocs"
                          className="form-control form-control-user"
                          placeholder="Password"
                        />{" "}
                          <div  className="btn btn-secondary btn-sm mt-2" onClick={verify}>
                         
                            DOCS VERIFICATION
                            </div>
                            </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div> */}
                {/* <div className="col-xl-2 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                           VERIFY YOUR DOCUMENTS (PODSI)
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800 ">
                            
                          </div>
                          <div onClick={getdealId}>
                          
                          <div id="dealStatusLink" className="btn btn-secondary btn-sm mt-2">
      DAO DEAL STATUS
    </div>
    
                  
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
              {/* Content Row */}
              <div className="row">
                {/* Area Chart */}
                <div className="col-xl-8 col-lg-7">
                  <div className="card shadow mb-4">
                    {/* Card Header - Dropdown */}
                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <h6 className="m-0 font-weight-bold text-primary">
                        Proposals
                      </h6>
                    </div>
                    {/* Card Body */}
                    <div className="card-body">
                      <div className="row available_proposals">
                        {isConnected ? (
                          <GetProposals />
                        ) : (
                          <div className="col-12 text-center">
                            <p>Please connect your wallet to view proposals</p>
                            <button 
                              className="btn btn-primary"
                              onClick={openConnectModal}
                            >
                              Connect Wallet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Pie Chart */}
                <div className="col-xl-4 col-lg-5">
                  <div className="card shadow mb-4 join_club" style={{display: "none"}}>
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Join the club</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-group">
                        <button className="btn btn-primary" onClick={joinClub}>Join Club</button>
                      </div>
                    </div>
                  </div>

                  <div className="card shadow mb-4 leave_club" style={{display: "none"}}>
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Contribute to the club</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-group">
                        <input
                          type="number"
                          id="aeAmount"
                          className="form-control"
                          placeholder="Enter amount in IP"
                          min="0"
                          step="0.000000000000000001"
                        />
                      </div>
                      <button onClick={contributeClub} className="btn btn-success btn-block mt-3">
                        Contribute
                      </button>
                    </div>
                  </div>

                  <div className="card shadow mb-4 leave_club" style={{display: "none"}}>
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Leave the club</h6>
                    </div>
                    <div className="card-body">
                      <button onClick={leaveClub} className="btn btn-success">
                        Leave Club
                      </button>
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
          {/* End of Footer */}
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
    
    )
}

export default Club