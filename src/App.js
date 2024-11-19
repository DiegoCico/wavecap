import React from 'react';
import './App.css';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import TestServer from './components/ServerTest';
import AuthPage from './pages/Auth';
import Homepage from './pages/Homepage';
import Ticker from './components/Ticker'; // Import the chatbot component

function App() {
  const location = useLocation(); // Get the current route location

  // Check if the current route is the AuthPage
  const isAuthPage = location.pathname === '/';

  return (
    <div className="App">
      {/* Render Ticker if not on the AuthPage */}
      {!isAuthPage && <Ticker />}

      <Routes>
        <Route path="server-test" element={<TestServer />} />
        <Route path="/wavecap" element={<AuthPage />} />
        <Route path="/home/:uid" element={<Homepage />} />
      </Routes>
    </div>
  );
}

export default App;
