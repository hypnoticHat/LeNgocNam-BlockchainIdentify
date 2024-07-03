import React, { useState } from 'react';
import '../styles/Home.css';
import Search from './Search';
import Navbar from './Navbar';

const Home = () => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [degree, setDegree] = useState(null);

    const handleOpenSearch = () => {
        setSearchOpen(true);
    };

    const handleCloseSearch = () => {
        setSearchOpen(false);
    };

    return (
        <div className="home-container">
            {/* blur on open search */}
            <div className={`background ${searchOpen ? 'blur' : ''}`}></div>
            <Navbar handleOpenSearch={handleOpenSearch} />
            <div className={`search-container ${searchOpen ? 'show' : ''}`}>
                <button className="close-button" onClick={handleCloseSearch}>x</button>
                <Search setDegree={setDegree} />
                {degree && (
                    <div className="degree-info">
                        <h3>Degree Data:</h3>
                        <p>Name: {degree.name || degree[0]}</p>
                        <p>Issued Date: {degree.issuedDate || degree[1]}</p>
                    </div>
                )}
            </div>
            {degree && (
                <div className={`degree-result ${searchOpen ? 'move-in' : 'move-out'}`}>
                    {degree.picture ? (
                        <img src={`https://ipfs.io/ipfs/${degree.picture}`} alt="Degree" />
                    ) : (
                        <div className="no-picture">No picture available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
