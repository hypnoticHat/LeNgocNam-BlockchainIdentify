import React, { useState } from 'react';
import Web3 from 'web3';
import DegreeStorageArtifact from '../contracts/DegreeStorage.json';
import '../styles/Search.css';
import Loading from './LoadImg';

const Search = ({ setDegree }) => {
    const [name, setName] = useState('');
    const [index, setIndex] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearchByName = async () => {
        setError('');
        setDegree(null);
        setLoading(true);
        try {
            const web3 = new Web3(window.ethereum);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = DegreeStorageArtifact.networks[networkId];
            if (!deployedNetwork) {
                throw new Error('Contract not deployed on the current network');
            }
            const contract = new web3.eth.Contract(DegreeStorageArtifact.abi, deployedNetwork.address);//conect to contract

            const result = await contract.methods.searchDegreesByName(name).call();
            if (result.length === 0) {
                setError('can not find degree information');
            } else {
                setDegree(result[result.length - 1]);  // Return the latest matching record
            }
        } catch (error) {
            console.error('Error searching degrees by name', error);
            setError('Error searching degrees by name');
        } finally {
            setLoading(false);
        }
    };

    //search by index in blockchain(use for testing mostly)
    const handleSearchByIndex = async () => {
        setError('');
        setDegree(null);
        setLoading(true);
        try {
            const web3 = new Web3(window.ethereum);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = DegreeStorageArtifact.networks[networkId];
            if (!deployedNetwork) {
                throw new Error('Contract not deployed on the current network');
            }
            const contract = new web3.eth.Contract(DegreeStorageArtifact.abi, deployedNetwork.address);

            const result = await contract.methods.getDegree(index).call();
            if (!result || (Array.isArray(result) && result.length === 0)) {
                setError('can not find degree information');
            } else {
                setDegree(result);
            }
        } catch (error) {
            console.error('Error searching degree by index', error);
            setError('Error searching degree by index');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-box">
            <h2>Search Degrees</h2>
            <div className="search-by-name">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                />
                <button onClick={handleSearchByName}>Search by Name</button>
            </div>
            <div className="search-by-index">
                <input
                    type="number"
                    value={index}
                    onChange={(e) => setIndex(e.target.value)}
                    placeholder="Enter index"
                />
                <button onClick={handleSearchByIndex}>Search by Index</button>
            </div>
            {loading && <Loading />}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Search;
