import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MetaMaskProvider } from '@metamask/sdk-react';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MetaMaskProvider
          sdkOptions={{
            dappMetadata: {
              name: 'CryptoLearn',
              url: typeof window !== 'undefined' ? window.location.href : '',
            },
          }}
        >
          <Web3Provider>
            <App />
          </Web3Provider>
        </MetaMaskProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
