import { Platform } from 'react-native';

// For local development:
// 10.0.2.2 is usually the address to reach your host from Android Emulator
// If testing on a real device, replace this with your machine's local IP (e.g., 192.168.1.5)
// 1. Run 'ipconfig' in your terminal
// 2. Find your IPv4 Address (e.g., 192.168.1.15)
// 3. Replace the address below:
const LOCAL_IP = '172.16.149.138'; // <--- CHANGE THIS TO YOUR IP

const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : `http://${LOCAL_IP}:5000/api`;

export default API_URL;
