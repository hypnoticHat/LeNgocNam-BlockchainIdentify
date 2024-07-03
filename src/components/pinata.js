import axios from 'axios';

//API project from Pinata
const PINATA_API_KEY = '14c21df3eafd014813d1';
const PINATA_SECRET_API_KEY = '8a9dcef1fd41735294f407068455af271f5c9d643155d3812971b449d5d34b5b';

const pinataApiBaseUrl = 'https://api.pinata.cloud/pinning';

const pinFileToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${pinataApiBaseUrl}/pinFileToIPFS`, formData, {
            maxContentLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            },
            timeout: 30000
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading file to Pinata', error);
        throw error;
    }
};

export default pinFileToIPFS;
