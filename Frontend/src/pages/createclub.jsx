import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Tg from '../components/toggle';
import { notification } from 'antd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { marketplaceAddress } from "../config";
import {Web3} from 'web3';
import $ from 'jquery'; 
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { TomoEVMKitProvider, useConnectModal, useAccountModal } from '@tomo-inc/tomo-evm-kit';
import { useAccount, useSignMessage, useSignTypedData, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseEther } from 'viem';
const ethers = require("ethers")
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));

const provider = new ethers.providers.Web3Provider(window.ethereum);

const owneraddress = localStorage.getItem("filWalletAddress");
let contractPublic = null;

function CreateClubContent() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { signMessage } = useSignMessage();
  const { signTypedData } = useSignTypedData();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [clubName, setClubName] = useState('');
  const [password, setPassword] = useState('');

  async function checkBalance() {
    try {
      if (!address) return;
      const balance = await publicClient.getBalance({ address });
      const balanceEther = ethers.utils.formatEther(balance);
      $('.view_balance_address').text(balanceEther);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function createClub() {
    toast.info('DAO Creation initiated ...', {
      position: "top-right",
      autoClose: 15000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

    try {
      if (!isConnected || !address || !walletClient) {
        await openConnectModal();
        return;
      }

      const clubName = $('#club_name').val();
      if(clubName == '') {
        $('#errorCreateClub').css("display","block");
        $('#errorCreateClub').text("Club name is invalid");
        return;
      }

      $('.loading_message_creating').css("display","block");
      
      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("createClub", [clubName, ""]);
      
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

      $('#club_name').val('');
      $('#errorCreateClub').css("display","none");
      $('.loading_message_creating').css("display","none");
      $('#successCreateClub').css("display","block");
      toast.success("Club created successfully with the name: " + clubName);
      $('#successCreateClub').text("Club created successfully with the name: " + clubName);
    } catch(e) {
      console.error('Transaction error:', e);
      $('.valid-feedback').css('display','none');
      $('.invalid-feedback').css('display','block');
      $('.loading_message_creating').css("display","none");
      $('.invalid-feedback').text(e.message || 'Transaction failed');
    }
  }

  const navigate = useNavigate();
  function Logout(){
    localStorage.clear();
    navigate('/login');
  }

  useEffect(() => {
    if(address) {
      checkBalance();
      $('.current_account_text').text(address);
    }
  }, [address]);

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
            <div className="sidebar-brand-text mx-3">CLUBDAO</div>
          </a>
          {/* Divider */}
          <hr className="sidebar-divider my-0" />
          {/* Nav Item - Dashboard */}
          <li className="nav-item active">
            <Link className="nav-link" to="/">
              <i className="fas fa-fw fa-tachometer-alt" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/joinclub">
              <i className="fas fa-fw fa-file-image-o" />
              <span>Available clubs</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/createclub">
              <i className="fas fa-fw fa-file-image-o" />
              <span>Create club</span>
            </Link>
          </li>
          {/* Divider */}
          <hr className="sidebar-divider d-none d-md-block" />
          {/* Sidebar Toggler (Sidebar) */}
          <div className="text-center d-none d-md-inline">
            <button onClick={Tg} className="rounded-circle border-0" id="sidebarToggle" />
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
                  Create a new investment club
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
                            Balance (IP)
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800 view_balance_address">
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
                          <Link className="btn btn-primary" to="/">
                            Go to Dashboard
                          </Link>
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
                            Clubs{" "}
                          </div>
                          <Link className="btn btn-secondary" to="/joinclub">
                            See available clubs
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
                        Create your own investment club
                      </h6>
                    </div>
                    {/* Card Body */}
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-12">
                          Club Name:{" "}
                          <input
                            type="text"
                            id="club_name"
                            className="form-control form-control-user"
                            placeholder="Give a name for this Investment Club"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                          />{" "}
                          <br />
                          Club Description:{" "}
                          <input
                            type="text"
                            id="club_description"
                            className="form-control form-control-user"
                            placeholder="Give a Description for this Investment Club"
                          />{" "}
                          <br />
                          <br />
                          <br />
                          <br />
                          <input
                            onClick={() => {
                              createClub();
                            }}
                            type="button"
                            id="createClubButton"
                            defaultValue="Create"
                            className="btn btn-primary btn-block"
                          />
                          <span
                            className="loading_message_creating"
                            style={{ display: "none" }}
                          >
                            Creating the club...
                          </span>
                          <p
                            className="valid-feedback"
                            id="successCreateClub"
                            style={{ display: "none" }}
                          />
                          <p
                            className="invalid-feedback"
                            id="errorCreateClub"
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
    </div>
  );
}

// Wrap the component with TomoEVMKitProvider
function CreateClub() {
  return (
    <TomoEVMKitProvider>
      <CreateClubContent />
    </TomoEVMKitProvider>
  );
}

export default CreateClub;