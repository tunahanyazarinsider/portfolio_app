import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppContent from './AppContent';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="App">
          <AppContent />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
