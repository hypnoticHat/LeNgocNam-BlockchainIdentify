import React, { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';
import keccak256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';
import Web3 from 'web3';
import DegreeStorageArtifact from '../contracts/DegreeStorage.json';
import imageCompression from 'browser-image-compression';
import pinFileToIPFS from './pinata';
import '../styles/UploadFile.css';
import Navbar from './Navbar';
import Loading from './LoadImg';

function UploadFile() {
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [error, setError] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadedImages, setUploadedImages] = useState({});
    const [allUploadMessage, setAllUploadMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [progressError, setProgressError] = useState(false);

    useEffect(() => {
        if (uploadMessage || error) {
            const timer = setTimeout(() => {
                setUploadMessage('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [uploadMessage, error]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    //drop file box
    const handleDrop = (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length) {
            setFile(files[0]);
        }
    };

    const handleUpload = async () => {
        setLoading(true); // Set loading state
        setProgressStep(1); // Update progress step
        setProgressError(false); // Reset progress error state

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const workbook = xlsx.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

                console.log('Data from Excel:', data);

                const degreeData = data.slice(1).map(row => row.slice(1).join(''));
                const leafNodes = degreeData.map(addr => keccak256(addr));
                const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
                const rootHash = merkleTree.getRoot().toString('hex');
                const proofs = leafNodes.map(leaf => merkleTree.getHexProof(leaf));

                setFileData({
                    data,
                    leafNodes: leafNodes.map(node => node.toString('hex')),
                    proofs,
                    rootHash
                });

                setUploadMessage('File processed successfully!');
                setProgressStep(2);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            setError('There was an error processing the file!');
            setProgressError(true);
            setLoading(false);
        } finally {
            setLoading(false); // Ensure loading state is reset
        }
    };

    //upload file to IPFS
    const handleImageUpload = async (event, rowIndex) => {
        setLoading(true); // Set loading state
        setProgressStep(2); // Update progress step
        setProgressError(false); // Reset progress error state
        let imageFile = event.target.files[0]; // Get the selected file
    
        // Set options for image compression
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };
    
        try {
            // Compress the image file
            imageFile = await imageCompression(imageFile, options);
        } catch (error) {
            // Handle compression error
            setError('Error compressing image');
            setProgressError(true);
            setLoading(false);
            return;
        }
    
        try {
            // Upload the compressed image to IPFS
            const ipfsHash = await pinFileToIPFS(imageFile);
    
            // Update the state with the new IPFS hash
            setUploadedImages({
                ...uploadedImages,
                [rowIndex]: ipfsHash
            });
    
            setUploadMessage('Image uploaded to IPFS successfully!'); // Set success message
            setProgressStep(3); // Update progress step
        } catch (error) {
            // Handle IPFS upload error
            setError('Error uploading image to IPFS');
            setProgressError(true);
            setLoading(false);
        } finally {
            setLoading(false); // Ensure loading state is reset
        }
    };

    const handleUploadInfor = async () => {
        if (!fileData) { // Check if fileData exists
            setError('No file data to upload!');
            return;
        }
        setLoading(true); // Set loading state
        setProgressStep(4); // Set progress step
        setProgressError(false); // Reset progress error state
        try {
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' }); // Request access to MetaMask accounts
            } else {
                setError('MetaMask is not installed.');
                setLoading(false);
                return;
            }
    
            const web3 = new Web3(window.ethereum); // Create a new Web3 instance
            const networkId = await web3.eth.net.getId(); // Get the current network ID
            const deployedNetwork = DegreeStorageArtifact.networks[networkId];
            if (!deployedNetwork) {
                throw new Error('Contract not deployed on the current network');
            }
            const contract = new web3.eth.Contract(DegreeStorageArtifact.abi, deployedNetwork.address); // Create contract instance
            const accounts = await web3.eth.getAccounts(); // Get the list of accounts
            if (accounts.length === 0) {
                throw new Error('No accounts found. Please make sure MetaMask is connected.');
            }
    
            // Map file data to respective arrays
            const proofHashes = fileData.leafNodes.map(hash => `0x${hash}`);
            const names = fileData.data.slice(1).map(row => row[1] || '');
            const issuedDates = fileData.data.slice(1).map(row => row[2] || '');
            const pictures = fileData.data.slice(1).map((row, rowIndex) => uploadedImages[rowIndex] || '');
    
            // Check if there are valid degrees to upload
            if (proofHashes.length === 0 || names.length === 0 || issuedDates.length === 0) {
                throw new Error('No valid degrees to upload.');
            }
    
            // Call the addDegrees method on the smart contract
            await contract.methods.addDegrees(proofHashes, names, issuedDates, pictures).send({ from: accounts[0] });
    
            setAllUploadMessage('All degrees uploaded successfully!'); // Set success message
            setProgressStep(5); // Update progress step
        } catch (error) {
            console.error('Error uploading degrees:', error); // Log error to console
            setError(`Error uploading degrees: ${error.message}`); // Set error message
            setProgressError(true); // Set progress error state
            setLoading(false); // Reset loading state
        } finally {
            setLoading(false); // Ensure loading state is reset
        }
    };

    //export to file json
    const handleExport = (rowIndex) => {
        const name = fileData.data[rowIndex + 1][1] || `proof_${rowIndex}`;
        //fill data
        const exportData = {
            leafHash: fileData.leafNodes[rowIndex], // Use leafHash instead of leafIndex
            proof: fileData.proofs[rowIndex],
            root: fileData.rootHash,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`; // Name file as customer name
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="upload-file-container">
            <Navbar />
            <h1>Upload File</h1>
            <div className="file-upload">
                <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} id="fileInput" />
                <div className="file-dropzone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => document.getElementById('fileInput').click()}>
                    {file ? file.name : 'Drag and drop a file here or click to select a file'}
                </div>
                <button onClick={handleUpload}>Upload File</button>
                <button onClick={handleUploadInfor}>Upload Info</button>
            </div>
            <div className="progress-bar">
                <div className={`circle ${progressStep >= 1 ? (progressError && progressStep === 1 ? 'error' : 'completed') : ''}`}>1</div>
                <div className="line"></div>
                <div className={`circle ${progressStep >= 2 ? (progressError && progressStep === 2 ? 'error' : 'completed') : ''}`}>2</div>
                <div className="line"></div>
                <div className={`circle ${progressStep >= 3 ? (progressError && progressStep === 3 ? 'error' : 'completed') : ''}`}>3</div>
                <div className="line"></div>
                <div className={`circle ${progressStep >= 4 ? (progressError && progressStep === 4 ? 'error' : 'completed') : ''}`}>4</div>
            </div>
            <div className="progress-labels">
                <span>Read & Hash</span>
                <span>Upload to IPFS</span>
                <span>Upload to Blockchain</span>
                <span>Complete</span>
            </div>
            {loading && (
                <div className="loading-overlay">
                    <Loading />
                </div>
            )}
            {(error || uploadMessage || allUploadMessage) && (
                <div className={`message ${error ? 'error-message' : 'upload-message'}`}>
                    {error || uploadMessage || allUploadMessage}
                </div>
            )}
            {fileData && (
                <div>
                    <h2>File Data</h2>
                    <div className="data-table-container">
                        <table className="data-table" border="1">
                            <thead>
                                <tr>
                                    {fileData.data[0].map((header, index) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                    <th>Upload Image</th>
                                    <th>Proof</th>
                                    <th>Export</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileData.data.slice(1).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex}>{cell}</td>
                                        ))}
                                        <td>
                                            <input type="file" onChange={(event) => handleImageUpload(event, rowIndex)} />
                                        </td>
                                        <td>
                                            {fileData.proofs[rowIndex] ? fileData.proofs[rowIndex].join(', ') : 'No proof'}
                                        </td>
                                        <td>
                                            {fileData && progressStep >= 4 && (
                                                <button onClick={() => handleExport(rowIndex)}>Export</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <h2>Root Hash</h2>
                    <p>{fileData.rootHash}</p>
                </div>
            )}
        </div>
    );
}

export default UploadFile;
