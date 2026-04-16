import { Platform } from 'react-native';

const LOCAL_IP = '172.16.149.138';
const PRODUCTION_URL = 'https://deliveryshield.onrender.com';

const API_URL = (process.env.NODE_ENV === 'production')
    ? `${PRODUCTION_URL}/api`
    : (Platform.OS === 'web' ? 'http://localhost:5000/api' : `http://${LOCAL_IP}:5000/api`);

export default API_URL;
