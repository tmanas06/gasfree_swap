import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { BiconomyProvider } from './context/BiconomyContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SwapInterface from './components/SwapInterface';
import BridgeInterface from './components/BridgeInterface';
import StorageInterface from './components/StorageInterface';
import Portfolio from './components/Portfolio';
import Settings from './components/Settings';
import { GlobalStyle } from './styles/GlobalStyles';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './styles/Theme';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Load user preferences
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing DeFi Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Web3Provider>
        <BiconomyProvider>
          <Router>
            <div className="App">
              <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/swap" element={<SwapInterface />} />
                  <Route path="/bridge" element={<BridgeInterface />} />
                  <Route path="/storage" element={<StorageInterface />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </Router>
        </BiconomyProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;