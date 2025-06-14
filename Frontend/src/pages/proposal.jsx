import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import $ from 'jquery'; 
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { marketplaceAddress } from "../config";
import {Web3} from 'web3';
import { notification } from 'antd';
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { TomoEVMKitProvider, useConnectModal, useAccountModal } from '@tomo-inc/tomo-evm-kit';
import { parseEther } from 'viem';
import Tg from "../components/toggle";
const ethers = require("ethers");

// Initialize Web3 with the correct provider
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));
const provider = new ethers.providers.Web3Provider(window.ethereum);
let contractPublic = null;

var datacontractinstance = null;

async function getContract(userAddress) {
  try {
    contractPublic = new web3.eth.Contract(ABI.abi, marketplaceAddress);
    console.log("Contract initialized:", contractPublic);
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
    return true;
  } catch (contractError) {
    console.error("Error initializing contract:", contractError);
    return false;
  }
}

var DealId = null;

async function runProposal(event) {
  try {
    var filWalletAddress = localStorage.getItem("filWalletAddress");
    await getContract(filWalletAddress);
    if(contractPublic != undefined) {
      var option_execution = $('#option_execution').val()
      var password = $('#passwordShowPVExecution').val();
      if(option_execution == '') {
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Option is required");
        return;
      }
      if(password == '') {
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Password is invalid");
        return;
      }
      var clubId = localStorage.getItem("clubId");
      var proposalId = localStorage.getItem("proposalId");
      
      const my_wallet = await web3.eth.accounts.wallet.load(password);
      if(my_wallet !== undefined) {
        $('.errorExecution').css("display","none");
        $('.successExecution').css("display","block");
        $('.successExecution').text("Running...");
        
        try {
          const ans = await contractPublic.methods.isVotingOn(clubId,proposalId).call();
          if(ans) {
            toast.error("Voting is still ON");
            $('.successExecution').css("display","none");
            $('.errorExecution').css("display","block");
            $('.errorExecution').text("Voting is still ON");
            return;
          }
          
          if(option_execution == 'execute') {
            const query = await contractPublic.methods.executeProposal(clubId,proposalId);
            const encodedABI = query.encodeABI();
            
            try {
              const abi = ABI.abi;
              const iface = new ethers.utils.Interface(abi);
              const encodedData = iface.encodeFunctionData("executeProposal", [clubId,proposalId]);
              const GAS_MANAGER_POLICY_ID = "479c3127-fb07-4cc6-abce-d73a447d2c01";
              
              const signer = provider.getSigner();
              console.log("singer",signer);
              const tx = {
                to: marketplaceAddress,
                data: encodedData,
              };
              const txResponse = await signer.sendTransaction(tx);
              const txReceipt = await txResponse.wait();
              
              notification.success({
                message: 'Transaction Successful',
                description: (
                  <div>
                    Transaction Hash: <a href={`https://aeneid.storyscan.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a>
                  </div>
                )
              });
              
              console.log(txReceipt.transactionHash);
            } catch(transactionError) {
              console.log(transactionError);
            }
          } else if(option_execution == 'close') {
            const query = contractPublic.methods.closeProposal(clubId,proposalId);
            const encodedABI = query.encodeABI();
            const ans = await contractPublic.methods.isVotingOn(clubId,proposalId).call();
            
            if(ans) {
              toast.error("Voting is still ON");
              $('.successExecution').css("display","none");
              $('.errorExecution').css("display","block");
              $('.errorExecution').text("Voting is still ON");
              return;
            }
            
            try {
              const abi = ABI.abi;
              const iface = new ethers.utils.Interface(abi);
              const encodedData = iface.encodeFunctionData("closeProposal", [clubId,proposalId]);
              const GAS_MANAGER_POLICY_ID = "479c3127-fb07-4cc6-abce-d73a447d2c01";
              
              const signer = provider.getSigner();
              console.log("singer",signer);
              const tx = {
                to: marketplaceAddress,
                data: encodedData,
              };
              const txResponse = await signer.sendTransaction(tx);
              const txReceipt = await txResponse.wait();
              
              notification.success({
                message: 'Transaction Successful',
                description: (
                  <div>
                    Transaction Hash: <a href={`https://aeneid.storyscan.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a>
                  </div>
                )
              });
              
              console.log(txReceipt.transactionHash);
            } catch(transactionError) {
              console.log(transactionError);
            }
          }
        } catch(executionError) {
          console.log(executionError);
          $('.successExecution').css("display","none");
          $('.errorExecution').css("display","block");
          $('.errorExecution').text("Error executing/closing the proposal");
          return;
        }
        
        $('#option_execution').val('');
        $('#passwordShowPVExecution').val('');
        $('.errorExecution').css("display","none");
        $('.successExecution').css("display","block");
        $('.successExecution').text("The execution was successful ");
      } else {
        toast.error("Invalid password");
        $('.valid-feedback').css('display','none');
        $('.invalid-feedback').css('display','block');
        $('.invalid-feedback').text('The password is invalid');
      }
    }
  } catch(walletError) {
    $('.valid-feedback').css('display','none');
    $('.invalid-feedback').css('display','block');
    $('.invalid-feedback').text('The password is invalid');
  }
}

async function verify(){
  const clubId =  localStorage.getItem("clubId");
  var proposalId = localStorage.getItem("proposalId");
  var clubs = await contractPublic.methods.getProposalsByClub(clubId).call();
  console.log(clubs)
  const cid = clubs[proposalId-1].Cid;

  toast.success(`Proposal CID: ${cid}`, {
    position: "top-right",
    autoClose: 18000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
}

function ProposalContent() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposalData, setProposalData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState('');
  const [votingError, setVotingError] = useState('');
  const [proposalStatus, setProposalStatus] = useState(null);
  const [clubBalance, setClubBalance] = useState('0');

  useEffect(() => {
    let mounted = true;
    console.log("Proposal component mounted. Wallet status:", { address, isConnected });

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
        const contractInitialized = await getContract(address);
        
        if (!contractInitialized) {
          throw new Error("Failed to initialize contract");
        }

        if (contractPublic) {
          // Fetch club data
          const club = await contractPublic.methods.getClubById(clubId).call();
          console.log("Club data fetched:", club);

          if (!club) {
            throw new Error("Club not found");
          }

          // Fetch proposal data
          const proposal = await contractPublic.methods.getProposalById(clubId, proposalId).call();
          console.log("Raw proposal data:", proposal);

          if (!proposal) {
            throw new Error("Proposal not found");
          }

          // Convert vote counts to numbers
          const votesFor = Number(proposal.votesFor);
          const votesAgainst = Number(proposal.votesAgainst);
          console.log("Votes For:", votesFor, "Votes Against:", votesAgainst);

          // Check if voting is still active
          const isVotingOn = await contractPublic.methods.isVotingOn(clubId, proposalId).call();
          console.log("Is voting on:", isVotingOn);

          if (mounted) {
            setClubData(club);
            setProposalData({
              ...proposal,
              votesFor: votesFor,
              votesAgainst: votesAgainst
            });
            setProposalStatus({
              status: proposal.status,
              isVotingOn: isVotingOn
            });
          }
        }
      } catch (fetchError) {
        console.error("Error in fetchData:", fetchError);
        if (mounted) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : "Failed to fetch proposal data";
          setError(errorMessage);
          toast.error(errorMessage);
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
      console.log("Proposal component unmounting");
    };
  }, [address, isConnected]);

  // Add new useEffect for real-time balance updates
  useEffect(() => {
    let mounted = true;

    async function fetchClubBalance() {
      try {
        const clubId = localStorage.getItem("clubId");
        if (!clubId || !contractPublic) return;

        // Fetch club data directly from contract
        const club = await contractPublic.methods.getClubById(clubId).call();
        if (mounted && club) {
          const balanceInEther = web3.utils.fromWei(club.pool.toString(), 'ether');
          setClubBalance(balanceInEther);
          console.log('Updated club balance:', balanceInEther);
        }
      } catch (error) {
        console.error('Error fetching club balance:', error);
      }
    }

    // Initial fetch
    fetchClubBalance();

    // Set up polling interval (every 10 seconds)
    const intervalId = setInterval(fetchClubBalance, 10000);

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [contractPublic]);

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

  // Helper function to get status text
  const getStatusText = () => {
    if (!proposalStatus) return 'Loading...';
    
    // If voting is still on, show Pending regardless of status
    if (proposalStatus.isVotingOn) return 'Pending';
    
    // Otherwise show the actual status from contract
    return proposalStatus.status || 'Unknown';
  };

  async function voteOnProposal() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      if (!selectedVote) {
        setVotingError("Please select your vote");
        return;
      }

      setIsVoting(true);
      setVotingError('');

      const clubId = localStorage.getItem("clubId");
      const proposalId = localStorage.getItem("proposalId");
      const optionBool = selectedVote === '1';

      // Validate and format the address
      if (!web3.utils.isAddress(address)) {
        setVotingError("Invalid wallet address");
        setIsVoting(false);
        toast.error("Invalid wallet address");
        return;
      }

      const formattedAddress = web3.utils.toChecksumAddress(address);

      // Check if voting is still active
      const isVotingOn = await contractPublic.methods.isVotingOn(clubId, proposalId).call();
      if (!isVotingOn) {
        setVotingError("Voting period has ended");
        setIsVoting(false);
        return;
      }

      // Check if user has already voted
      const hasVoted = await contractPublic.methods.hasVoted(formattedAddress, proposalId, clubId).call();
      if (hasVoted) {
        setVotingError("You have already voted on this proposal");
        setIsVoting(false);
        toast.error("You have already voted on this proposal");
        return;
      }

      // Prepare the transaction
      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("voteOnProposal", [
        Number(clubId),
        Number(proposalId),
        optionBool
      ]);

      // Get gas price
      const gasPrice = await publicClient.getGasPrice();
      
      // Prepare the transaction
      const tx = {
        from: formattedAddress,
        to: marketplaceAddress,
        data: encodedData,
        chainId: chainId,
        gasPrice: gasPrice,
        value: parseEther('0'),
      };

      toast.info('Submitting vote...', {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      // Send the transaction
      const hash = await walletClient.sendTransaction(tx);
      console.log('Transaction hash:', hash);
      
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      notification.success({
        message: 'Vote Submitted Successfully',
        description: (
          <div>
            Transaction Hash: <a href={`https://aeneid.storyscan.io/tx/${receipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{receipt.transactionHash}</a>
          </div>
        )
      });

      // Reset form and refresh data
      setSelectedVote('');
      setIsVoting(false);
      window.location.reload();

    } catch (error) {
      console.error('Voting error:', error);
      setVotingError(error.message || 'Error submitting vote');
      setIsVoting(false);
      toast.error(error.message || 'Error submitting vote');
    }
  }

  async function runProposal() {
    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      const option_execution = $('#option_execution').val();
      if (!option_execution) {
        toast.error("Please select an action");
        return;
      }

      const clubId = localStorage.getItem("clubId");
      const proposalId = localStorage.getItem("proposalId");

      // Check if voting is still active
      const isVotingOn = await contractPublic.methods.isVotingOn(clubId, proposalId).call();
      if (isVotingOn) {
        toast.error("Voting period has not ended yet");
        return;
      }

      // If executing, check club balance
      if (option_execution === 'execute') {
        const club = await contractPublic.methods.getClubById(clubId).call();
        const proposal = await contractPublic.methods.getProposalById(clubId, proposalId).call();
        
        console.log('Club Balance:', web3.utils.fromWei(club.pool.toString(), 'ether'));
        console.log('Proposal Amount:', web3.utils.fromWei(proposal.amount.toString(), 'ether'));

        // Convert to numbers for comparison
        const clubBalance = Number(club.pool);
        const proposalAmount = Number(proposal.amount);
        const votesFor = Number(proposal.votesFor);
        const votesAgainst = Number(proposal.votesAgainst);

        if (clubBalance < proposalAmount) {
          toast.error("Club balance is insufficient to execute this proposal");
          $('.errorExecution').css("display", "block");
          $('.errorExecution').text("Club balance is insufficient to execute this proposal");
          return;
        }

        // Check if proposal has been approved
        if (votesFor <= votesAgainst) {
          toast.error("Proposal has not been approved by majority vote");
          $('.errorExecution').css("display", "block");
          $('.errorExecution').text("Proposal has not been approved by majority vote");
          return;
        }
      }

      // Prepare the transaction
      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const methodName = option_execution === 'execute' ? 'executeProposal' : 'closeProposal';
      const encodedData = iface.encodeFunctionData(methodName, [clubId, proposalId]);

      // Get gas price
      const gasPrice = await publicClient.getGasPrice();
      
      // Prepare the transaction
      const tx = {
        account: web3.utils.toChecksumAddress(address),
        to: marketplaceAddress,
        data: encodedData,
        chainId: chainId,
        gasPrice: gasPrice,
        value: parseEther('0'),
      };

      toast.info(`${option_execution === 'execute' ? 'Executing' : 'Closing'} proposal...`, {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

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

      // Reset form and refresh data
      $('#option_execution').val('');
      $('.errorExecution').css("display", "none");
      $('.successExecution').css("display", "block");
      $('.successExecution').text("Action completed successfully");
      window.location.reload();

    } catch (error) {
      console.error('Transaction error:', error);
      $('.successExecution').css("display", "none");
      $('.errorExecution').css("display", "block");
      $('.errorExecution').text(error.message || 'Error processing transaction');
      toast.error(error.message || 'Error processing transaction');
    }
  }

  function Logout() {
    web3.eth.accounts.wallet.clear();
    localStorage.clear();
    navigate('/login');
  }

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        <h3>Please connect your wallet to view proposal details</h3>
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

  if (error) {
    return (
      <div className="text-center p-4">
        <h3>Error loading proposal</h3>
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div id="page-top">
      <div id="wrapper">
        {/* Sidebar */}
        <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
          {/* Sidebar - Brand */}
          <a className="sidebar-brand d-flex align-items-center justify-content-center" href="/">
            <div className="sidebar-brand-icon rotate-n-15">
              <i className="fas fa-laugh-wink" />
            </div>
            <div className="sidebar-brand-text mx-3">ClubDao</div>
          </a>
          <hr className="sidebar-divider my-0" />
          <li className="nav-item active">
            <a className="nav-link" href="/">
              <i className="fas fa-fw fa-tachometer-alt" />
              <span>Dashboard</span>
            </a>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/joinclub">
              <i className="fas fa-fw fa-users" />
              <span>Available clubs</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/createclub">
              <i className="fas fa-fw fa-plus-circle" />
              <span>Create club</span>
            </Link>
          </li>
          <hr className="sidebar-divider d-none d-md-block" />
          <div className="text-center d-none d-md-inline">
            <button onClick={Tg} className="rounded-circle border-0" id="sidebarToggle" />
          </div>
        </ul>

        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column">
          {/* Main Content */}
          <div id="content">
            <div className="container-fluid">
              {/* Page Heading */}
              <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">
                  {clubData?.name || 'Loading...'}
                </h1>
              </div>

              {/* Stats Cards */}
              <div className="row">
                <div className="col-xl-4 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Club Balance (IP)
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {clubBalance} IP
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-wallet fa-2x text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-md-6 mb-4">
                  <div className="card border-left-success shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                            Proposals
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {clubData?.proposalsCount || '0'}
                          </div>
                          <Link to="/createproposal" className="btn btn-success btn-sm mt-2">
                            Create New
                          </Link>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-file-alt fa-2x text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4 col-md-6 mb-4">
                  <div className="card border-left-info shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                            Members
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {clubData?.memberCount || '0'}
                          </div>
                          <Link to="/club" className="btn btn-info btn-sm mt-2">
                            View All
                          </Link>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-users fa-2x text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposal Details */}
              <div className="row">
                <div className="col-xl-8 col-lg-7">
                  <div className="card shadow mb-4">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Proposal Details</h6>
                    </div>
                    <div className="card-body">
                      {/* Add Proposal ID Display */}
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="bg-success text-white p-5 rounded text-center" style={{ 
                            fontSize: '1.5rem',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            border: '4px solid #28a745'
                          }}>
                            <div className="font-weight-bold mb-3" style={{ fontSize: '2rem' }}>Proposal ID</div>
                            <div style={{ 
                              fontSize: '4rem', 
                              fontWeight: 'bold',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                            }}>
                              {proposalData?.id ? Number(proposalData.id) : 'Loading...'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-12">
                          <div className="form-group">
                            <label className="font-weight-bold">Description:</label>
                            <p className="form-control-static">
                              {proposalData?.description || 'Loading...'}
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Creator:</label>
                            <p className="form-control-static">
                              {proposalData?.creator || 'Loading...'}
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Destination:</label>
                            <p className="form-control-static">
                              {proposalData?.destination || 'Loading...'}
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Amount (IP):</label>
                            <p className="form-control-static">
                              {proposalData?.amount ? web3.utils.fromWei(proposalData.amount.toString(), 'ether') : '0'} IP
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Voting Period:</label>
                            <p className="form-control-static">
                              Starts: <span id="proposedAt">
                                {proposalData?.proposedAt ? formatTimestamp(proposalData.proposedAt) : 'Not available'}
                              </span><br />
                              Ends: <span id="proposalExpireAt">
                                {proposalData?.proposalExpireAt ? formatTimestamp(proposalData.proposalExpireAt) : 'Not available'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Column */}
                <div className="col-xl-4 col-lg-5">
                  {/* Status and Votes Card */}
                  <div className="card shadow mb-4">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Proposal Status</h6>
                    </div>
                    <div className="card-body">
                      <div className="form-group">
                        <label className="font-weight-bold">Status:</label>
                        <p className="form-control-static">
                          <span className={`badge ${
                            getStatusText() === 'Pending' ? 'bg-warning' :
                            getStatusText() === 'Executed' ? 'bg-success' :
                            getStatusText() === 'Closed' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {getStatusText()}
                          </span>
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="font-weight-bold">Votes:</label>
                        <p className="form-control-static">
                          Accept: <span className="text-success">{proposalData?.votesFor?.toString() || '0'}</span><br />
                          Reject: <span className="text-danger">{proposalData?.votesAgainst?.toString() || '0'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Voting Section - Only show if status is Pending */}
                  {getStatusText() === 'Pending' && (
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">Vote on Proposal</h6>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label className="font-weight-bold">Your Vote:</label>
                          <div className="d-flex gap-2">
                            <button 
                              className={`btn btn-lg flex-grow-1 ${selectedVote === '1' ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => setSelectedVote('1')}
                              disabled={isVoting}
                            >
                              <i className="fas fa-check-circle me-2"></i>
                              Accept
                            </button>
                            <button 
                              className={`btn btn-lg flex-grow-1 ${selectedVote === '0' ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => setSelectedVote('0')}
                              disabled={isVoting}
                            >
                              <i className="fas fa-times-circle me-2"></i>
                              Reject
                            </button>
                          </div>
                        </div>
                        {votingError && (
                          <div className="alert alert-danger mt-2">
                            {votingError}
                          </div>
                        )}
                        <button 
                          onClick={voteOnProposal} 
                          className="btn btn-primary btn-block mt-3"
                          disabled={isVoting || !selectedVote}
                        >
                          {isVoting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Submitting Vote...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-vote-yea me-2"></i>
                              Submit Vote
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Creator Options - Only show if status is Pending */}
                  {getStatusText() === 'Pending' && proposalData?.creator && proposalData.creator.toLowerCase() === address?.toLowerCase() && (
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">Creator Options</h6>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label className="font-weight-bold">Select Action:</label>
                          <select id="option_execution" className="form-control">
                            <option value="">Select an action</option>
                            <option value="execute">Execute proposal</option>
                            <option value="close">Close proposal</option>
                          </select>
                        </div>
                        <div className="alert alert-info mt-3">
                          <i className="fas fa-info-circle me-2"></i>
                          Note: You can only execute or close the proposal after the voting period ends.
                        </div>
                        <button 
                          onClick={runProposal} 
                          className="btn btn-primary btn-block mt-3"
                          disabled={proposalStatus?.isVotingOn}
                        >
                          {proposalStatus?.isVotingOn ? (
                            <>
                              <i className="fas fa-clock me-2"></i>
                              Voting Still Active
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check-circle me-2"></i>
                              Confirm Action
                            </>
                          )}
                        </button>
                        {proposalStatus?.isVotingOn && (
                          <div className="alert alert-warning mt-3">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Voting is still active. You can execute or close the proposal after the voting period ends.
                          </div>
                        )}
                        <div className="successExecution alert alert-success mt-3" style={{ display: "none" }} />
                        <div className="errorExecution alert alert-danger mt-3" style={{ display: "none" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="sticky-footer bg-white"></footer>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <a className="scroll-to-top rounded" href="#page-top">
        <i className="fas fa-angle-up" />
      </a>

      {/* Modals */}
      <div className="modal fade" id="seeAccountModal" tabIndex={-1} role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Account</h5>
              <button className="close" type="button" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <p className="font-weight-bold">Address:</p>
              <div className="current_account" />
              <p className="current_account_text" style={{ fontSize: "x-small" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="logoutModal" tabIndex={-1} role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
              <button className="close" type="button" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              Select "Logout" below if you are ready to end your current session.
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>
              <button className="btn btn-primary" onClick={Logout}>Logout</button>
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
    </div>
  );
}

// Wrap the component with TomoEVMKitProvider
function Proposal() {
  return (
    <TomoEVMKitProvider>
      <ProposalContent />
    </TomoEVMKitProvider>
  );
}

export default Proposal;
