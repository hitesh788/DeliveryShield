import { Platform } from 'react-native';

const LOCAL_IP = '172.16.149.138';
const PRODUCTION_URL = 'https://deliveryshield.onrender.com';

// __DEV__ is true when running locally via 'npx expo start'
// It is false when the app is published or built as an APK
const API_URL = __DEV__
    ? (Platform.OS === 'web' ? 'http://localhost:5000/api' : `http://${LOCAL_IP}:5000/api`)
    : `${PRODUCTION_URL}/api`;

export default API_URL;
