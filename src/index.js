import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const API_URL = process.env.REACT_APP_API_URL;
// KEEP BACKEND ALIVE — GoDaddy won't let us disable idle

setInterval(() => {
  fetch(`${API_URL}/api/ping`)
    .then(r => console.log('Keep-alive:', r.status))
    .catch(() => {});
}, 4 * 60 * 1000);

fetch(`${API_URL}/api/ping`)
  .then(r => r.json())
  .then(data => console.log(data));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
