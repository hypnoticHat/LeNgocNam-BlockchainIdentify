import React from 'react';
import '../styles/LoadImg.css';
import loadGif from '../assets/load.gif'
const Loading = () => {
    //use for loading gif
    return (
        <div className="loading-container">
            <img src={loadGif} alt="Loading..." />
        </div>
    );
};

export default Loading;
