import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer'; // Import Buffer from buffer library
import keccak256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';
import Web3 from 'web3';
import DegreeStorageArtifact from '../contracts/DegreeStorage.json';
import '../styles/VerifyProof.css';
import Navbar from './Navbar';
import Loading from './LoadImg'; 

function VerifyProof() {
    const [leafHash, setLeafHash] = useState('');
    const [proof, setProof] = useState('');
    const [root, setRoot] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isValid) {
            setError(null); // Clear error if verification is successful
        }
    }, [isValid]);

    const handleVerifyProof = async () => {
        if (!leafHash || !proof || !root) { // Check if proof data exists
            console.error('No proof data to verify!');
            setError('No proof data to verify!');
            return;
        }
    
        const proofArray = proof.split(',').map(p => p.trim()); // Convert proof string to array
    
        setLoading(true); // Start loading
    
        try {
            // Convert proof array to Buffers
            const proofBuffers = proofArray.map(p => Buffer.from(p.replace('0x', ''), 'hex'));
            const leafHashBuffer = Buffer.from(leafHash.replace('0x', ''), 'hex');
            const rootBuffer = Buffer.from(root.replace('0x', ''), 'hex');
    
            // Verify the proof using the MerkleTree library
            const merkleTree = new MerkleTree([], keccak256, { sortPairs: true }); // Create an empty MerkleTree instance
            const isValid = merkleTree.verify(proofBuffers, leafHashBuffer, rootBuffer);
    
            setIsValid(isValid); // Set verification result
    
            if (isValid) {
                const web3 = new Web3(window.ethereum); // Create a new Web3 instance
                const networkId = await web3.eth.net.getId(); // Get current network ID
                const deployedNetwork = DegreeStorageArtifact.networks[networkId];
                if (!deployedNetwork) { // Check if contract is deployed on the current network
                    throw new Error('Contract not deployed on the current network');
                }
                const contract = new web3.eth.Contract(DegreeStorageArtifact.abi, deployedNetwork.address); // Create contract instance
                const degreeData = await contract.methods.getDegreeByProofHash(web3.utils.hexToBytes(leafHash)).call(); // Get degree data by proof hash
                setVerificationResult(degreeData); // Set degree data
            } else {
                setVerificationResult(null); // Reset verification result
            }
        } catch (error) {
            console.error('Error verifying proof', error); // Log error to console
            setError(`Error verifying proof: ${error.message}`); // Set error message
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Get the selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const jsonData = JSON.parse(e.target.result); // Parse JSON data
                setLeafHash(jsonData.leafHash); // Set leafHash
                setProof(jsonData.proof.join(', ')); // Join proof array into string
                setRoot(jsonData.root); // Set root value
            };
            reader.readAsText(file); // Read file as text
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files; // Get dropped files
        if (files.length) {
            handleFileChange({ target: { files } }); // Handle file change
        }
    };

    return (
        <div className="verify-proof-container">
            <Navbar />
            <h1>Verify Proof</h1>
            <div className="file-upload">
                <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} id="fileInput" />
                <div className="file-dropzone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => document.getElementById('fileInput').click()}>
                    Drag and drop a file here or click to select a file
                </div>
            </div>
            <div className="verify-proof">
                <input
                    type="text"
                    placeholder="Leaf Hash"
                    value={leafHash}
                    onChange={(e) => setLeafHash(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Proof"
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Root"
                    value={root}
                    onChange={(e) => setRoot(e.target.value)}
                />
                <button onClick={handleVerifyProof}>Verify Proof</button>
                {loading && <Loading />} {/* Display loading component */}
                {isValid !== null && (
                    <div>
                        Verification Result: {isValid ? 'Valid' : 'Invalid'}
                    </div>
                )}
                {verificationResult && (
                    <div>
                        <h2>Degree Data:</h2>
                        <p>Name: {verificationResult[0]}</p>
                        <p>Issued Date: {verificationResult[1]}</p>
                        {verificationResult[2] && (
                            <img src={`https://ipfs.io/ipfs/${verificationResult[2]}`} alt="Degree" />
                        )}
                    </div>
                )}
            </div>
            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
        </div>
    );
}

export default VerifyProof;
