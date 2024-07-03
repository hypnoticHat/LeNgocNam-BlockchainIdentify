import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ handleOpenSearch }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleSearchClick = () => {
        if (location.pathname === '/') {
            handleOpenSearch();
        } else {
            navigate('/');
        }
    };

    return (
        <nav className="navbar">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/upload">Upload File</Link></li>
                <li><Link to="/verify">Verify</Link></li>
                <li><button onClick={handleSearchClick}>Search</button></li>
            </ul>
        </nav>
    );
};

export default Navbar;
