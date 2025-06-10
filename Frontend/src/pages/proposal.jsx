import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import $, { error } from 'jquery'; 
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { marketplaceAddress } from "../config";
import {Web3} from 'web3';
import { notification } from 'antd';
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"


import axios from 'axios';
import getProposalById from '../getProposalById';
import GetClub from '../getclub';
import Tg from "../components/toggle";

const ethers = require("ethers")


const provider = new ethers.providers.Web3Provider(window.ethereum);
const DataDaoAddress  = "0x8138489b863a68f224307a5D0Fa630917d848e25"
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));

var contractPublic = null;

var datacontractinstance = null;


async function getContract(userAddress) {
    contractPublic = await new web3.eth.Contract(ABI.abi,marketplaceAddress);
    console.log(contractPublic)
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
  }

  var DealId = null;



async function runProposal(event) {
  
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
    try {
      const my_wallet = await web3.eth.accounts.wallet.load(password);
    
    if(my_wallet !== undefined)
    {
      

      $('.errorExecution').css("display","none");
      $('.successExecution').css("display","block");
      $('.successExecution').text("Running...");
      var clubId = localStorage.getItem("clubId");
      var proposalId = localStorage.getItem("proposalId");
      
        try {
          const ans  = await contractPublic.methods.isVotingOn(clubId,proposalId).call();

          if(ans){
            toast.error("Voting is still ON")
            $('.successExecution').css("display","none");
            $('.errorExecution').css("display","block");
            $('.errorExecution').text("Voting is still ON");
          }
          
          if(option_execution == 'execute') {
            const query = await contractPublic.methods.executeProposal(clubId,proposalId);
            const encodedABI = query.encodeABI();
            
            
            try{
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
            
                
              }catch(error){
                console.log(error)
              }

           
          } else {
            if(option_execution == 'close') {
              const query = contractPublic.methods.closeProposal(clubId,proposalId);
              const encodedABI = query.encodeABI();
              const ans  = await contractPublic.methods.isVotingOn(clubId,proposalId).call();

              if(ans){
                toast.error("Voting is still ON")
                $('.successExecution').css("display","none");
            $('.errorExecution').css("display","block");
            $('.errorExecution').text("Voting is still ON");
            return;

              }
              
            try{
               
                
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
              }catch(error){
                console.log(error)
              }
            }
          }
          
        } catch (error) {
          // alert(error)
         
          console.log(error)
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
        // alert(error)
        toast.error(error)
        $('.valid-feedback').css('display','none');
          $('.invalid-feedback').css('display','block');
          $('.invalid-feedback').text('The password is invalid');
      }
    }
    catch {
    
      $('.valid-feedback').css('display','none');
          $('.invalid-feedback').css('display','block');
          $('.invalid-feedback').text('The password is invalid');
    }
    
    
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

async function voteOnProposal() {




  var filWalletAddress = localStorage.getItem("filWalletAddress");
  await getContract(filWalletAddress);
  

  var clubId = localStorage.getItem("clubId");
  var proposalId = localStorage.getItem("proposalId");
 

  if(contractPublic != undefined) {
    var option_vote = $('#option_vote').val()
    var password = $('#passwordShowPVVote').val();
    if(option_vote == '') {
      $('#errorCreateProposal').css("display","block");
      $('#errorCreateProposal').text("Vote is required");
      return;
    }
    if(password == '') {
      $('#errorCreateProposal').css("display","block");
      $('#errorCreateProposal').text("Password is invalid");
      return;
    }
   
    const my_wallet = await web3.eth.accounts.wallet.load(password);
    if(my_wallet !== undefined)
    {
      $('.successVote').css("display","block");
      
      $('.successVote').text("Voting...");
      
      var optionBool = option_vote == '1' ? true : false;
      try {
        const ans  = await contractPublic.methods.isVotingOn(clubId,proposalId).call();

        console.log("ans",ans)
       
        if(!ans){
          $('.successVote').css("display","none");
          $('.errorVote').css("display","block");
          $('.errorVote').text("Voting time periods is over!");
          toast.error("Voting time periods is over!");
         
          return;
        }
        
        const query = contractPublic.methods.voteOnProposal(clubId,proposalId, optionBool);
        const encodedABI = query.encodeABI();


        

        const abi = ABI.abi;
              const iface = new ethers.utils.Interface(abi);
              const encodedData = iface.encodeFunctionData("voteOnProposal", [clubId,proposalId, optionBool]);
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
       
      } catch (error) {
        console.log(error.message);
        
      
        $('.successVote').css("display","none");
        $('.errorVote').css("display","block");
        $('.errorVote').text("You already voted on this proposal");
        return;
      }
      
      $('#option_vote').val('');
      $('#passwordShowPVVote').val('');
      $('#errorVote').css("display","none");
      $('#successVote').css("display","block");
      $('#successVote').text("Your vote was successful ");
      window.location.reload();
    } else {
      $('.valid-feedback').css('display','none');
        $('.invalid-feedback').css('display','block');
        $('.invalid-feedback').text('The password is invalid');
    }
    
  }
}


async function verifyUserInClub() {
  var clubId = localStorage.getItem("clubId");
  var filWalletAddress = localStorage.getItem("filWalletAddress");
  if(clubId != null) {
    await getContract(filWalletAddress);
    if(contractPublic != undefined) {
      var user = await contractPublic.methods.isMemberOfClub(filWalletAddress,clubId).call();
      if(user) {
        $('.join_club').css('display','none');
        $('.leave_club').css('display','block');
      } else {
        $('.join_club').css('display','block');
        $('.leave_club').css('display','none');
      }
    }
  }
}

function Proposal() {
  const navigate = useNavigate();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          GetClub(),
          verifyUserInClub(),
          getProposalById()
        ]);
      } catch (error) {
        console.error("Error initializing proposal data:", error);
      }
    };

    initializeData();
  }, []); 

  function Logout() {
    web3.eth.accounts.wallet.clear();
    localStorage.clear();
    navigate('/login');
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
            <div className="sidebar-brand-text mx-3">Mantle Club</div>
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
                  <span className="club_name" />
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
                          <div className="h5 mb-0 font-weight-bold text-gray-800 club_balance">-</div>
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
                          <div className="h5 mb-0 font-weight-bold text-gray-800 club_proposals">-</div>
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
                            All Proposals
                          </div>
                          <Link to="/club" className="btn btn-info btn-sm mt-2">
                            View All
                          </Link>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-list fa-2x text-gray-300" />
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
                      <div className="row">
                        <div className="col-md-12">
                          <div className="form-group">
                            <label className="font-weight-bold">Description:</label>
                            <p className="proposal_description form-control-static">Loading...</p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Creator:</label>
                            <p id="proposal_creator" className="form-control-static">Loading...</p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Destination:</label>
                            <p id="proposal_destination" className="form-control-static">Loading...</p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Amount (IP):</label>
                            <p id="proposal_amount" className="form-control-static">Loading...</p>
                          </div>
                          <div className="form-group">
                            <label className="font-weight-bold">Voting Period:</label>
                            <p className="form-control-static">
                              Starts: <span id="proposedAt">Loading...</span><br />
                              Ends: <span id="proposalExpireAt">Loading...</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting Section */}
                <div className="col-xl-4 col-lg-5">
                  <div className="card shadow mb-4 leave_club" style={{ display: "none" }}>
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">
                        Status: <span id="proposal_status" />
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="form-group">
                        <label className="font-weight-bold">Votes:</label>
                        <p>
                          For: <span id="votes_for" className="text-success">0</span><br />
                          Against: <span id="votes_against" className="text-danger">0</span>
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
                        <button onClick={voteOnProposal} className="btn btn-success btn-block">
                          Submit Vote
                        </button>
                        <div className="successVote valid-feedback" style={{ display: "none" }} />
                        <div className="errorVote invalid-feedback" style={{ display: "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* Creator Options */}
                  <div className="card shadow mb-4 creator_options" style={{ display: "none" }}>
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
                      <button onClick={runProposal} className="btn btn-primary btn-block">
                        Confirm Action
                      </button>
                      <div className="successExecution valid-feedback" style={{ display: "none" }} />
                      <div className="errorExecution invalid-feedback" style={{ display: "none" }} />
                    </div>
                  </div>
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
    </div>
  );
}

export default Proposal;
