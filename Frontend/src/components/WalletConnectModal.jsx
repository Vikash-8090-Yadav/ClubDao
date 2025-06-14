import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WalletConnectModal.css';

const WalletConnectModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay">
      <div className="wallet-modal">
        <div className="wallet-modal-content">
          <div className="wallet-modal-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <h2>Wallet Connection Required</h2>
          <p>Please connect your MetaMask wallet to continue using ClubDAO</p>
          <div className="wallet-modal-buttons">
            <button className="wallet-modal-button connect" onClick={() => navigate('/login')}>
              Connect Wallet
            </button>
            <button className="wallet-modal-button cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
          <div className="wallet-modal-footer">
            <p className="wallet-modal-note">
              <i className="fas fa-info-circle"></i>
              Note: You need to have MetaMask installed in your browser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal; 