import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';

// Pages
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';

// Components
import Header from './components/Header';

function App() {
  return (
    <div className="page-container">
      <Header />
      
      <main className="content-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
