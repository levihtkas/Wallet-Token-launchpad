import './App.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'


import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {WalletModalProvider,WalletDisconnectButton,WalletMultiButton} from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'



function App() {
  const clusterurl = clusterApiUrl(WalletAdapterNetwork.Devnet)
  
  return (
    <ConnectionProvider endpoint={clusterurl}>
      <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <div className='p-2 flex justify-center'>
        <WalletMultiButton/>
        <WalletDisconnectButton/>
        
        </div>
        </WalletModalProvider>
        <TokenLaunchpad></TokenLaunchpad>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
