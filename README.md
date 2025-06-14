# ClubDAO - Investment Club Platform

ClubDAO is a decentralized investment club platform built on TomoChain's EVM-compatible blockchain. It allows users to create and join investment clubs, manage funds collectively, and make investment decisions through a democratic voting system.

## Features

- Create and join investment clubs
- Democratic voting system for investment decisions
- Fund management and distribution
- Real-time balance tracking
- Secure wallet integration
- Proposal creation and voting
- Club membership management

## Technology Stack

- **Frontend**: React.js
- **Smart Contracts**: Solidity
- **Blockchain**: TomoChain (EVM-compatible)
- **Web3 Integration**: Web3.js
- **Wallet Integration**: Wagmi
- **UI Framework**: Bootstrap

## TomoEVM Kit Integration

This project utilizes TomoEVM kit for seamless integration with TomoChain. The kit provides:

- EVM-compatible smart contract deployment
- Web3 provider configuration
- Transaction handling
- Balance checking
- Gas fee management

### TomoEVM Configuration

```javascript
// Web3 Provider Configuration
const web3 = new Web3(new Web3.providers.HttpProvider("https://lightnode-json-rpc-story.grandvalleys.com"));
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or TomoWallet
- TomoChain testnet/mainnet access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ClubDAO.git
cd ClubDAO
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory and add:
```
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_NETWORK_ID=your_network_id
```

4. Start the development server:
```bash
npm start
```

## Smart Contract Deployment

1. Navigate to the contracts directory:
```bash
cd Frontend/src/SmartContract/contracts
```

2. Deploy the contracts:
```bash
truffle migrate --network tomotestnet
```

## Usage

1. Connect your wallet (MetaMask or TomoWallet)
2. Create a new investment club or join an existing one
3. Deposit funds to the club
4. Create investment proposals
5. Vote on proposals
6. Execute approved proposals

## Project Structure

```
ClubDAO/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── SmartContract/
│   │   │   ├── contracts/
│   │   │   └── migrations/
│   │   └── utils/
├── public/
└── README.md
```

## Smart Contracts

### InvestmentClub.sol
Main contract handling:
- Club creation and management
- Member management
- Proposal creation and voting
- Fund distribution

### ClubFactory.sol
Factory contract for:
- Creating new investment clubs
- Managing club instances
- Club address tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TomoChain team for the EVM kit
- OpenZeppelin for smart contract libraries
- React and Web3.js communities

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Security

- All smart contracts are audited
- Use at your own risk
- Always test with small amounts first
- Report any security vulnerabilities to the team