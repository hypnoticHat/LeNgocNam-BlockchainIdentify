import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import UploadFile from './components/UploadFile';
import VerifyProof from './components/VerifyProof';
import './styles/App.css';
import { Buffer } from 'buffer';

// Polyfill global Buffer
window.Buffer = Buffer;


const App = () => {
    return (
        <Router>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/upload" element={<UploadFile />} />
                    <Route path="/verify" element={<VerifyProof />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
