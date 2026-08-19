import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ReceivingBridge from './ReceivingBridge';
import './styles.css';
import './audit.css';
import './module-grid.css';
import './validity.css';
import './receiving.css';
import './receiving-bridge.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ReceivingBridge />
  </React.StrictMode>,
);
