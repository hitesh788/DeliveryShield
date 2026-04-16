const API_URL = import.meta.env.PROD
    ? 'https://deliveryshield-backend.onrender.com/api'
    : 'http://localhost:5000/api';

export default API_URL;
