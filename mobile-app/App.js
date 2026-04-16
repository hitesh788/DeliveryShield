import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import VerifyOTPScreen from './screens/VerifyOTPScreen';
import DashboardScreen from './screens/DashboardScreen';
import BuyPolicyScreen from './screens/BuyPolicyScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import WithdrawalsScreen from './screens/WithdrawalsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    const [initialRoute, setInitialRoute] = useState('Login');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                setInitialRoute('Dashboard');
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Initializing DeliveryShield...</Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName={initialRoute} screenOptions={{
                    headerStyle: { backgroundColor: '#1E3A8A' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerBackTitleVisible: false
                }}>
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ title: 'Email Verification' }} />

                    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{
                        title: '🛡️ DeliveryShield',
                        headerLeft: () => null // Prevent back to login
                    }} />

                    <Stack.Screen name="BuyPolicy" component={BuyPolicyScreen} options={{ title: 'Policy Setup' }} />
                    <Stack.Screen name="Claims" component={ClaimsScreen} options={{ title: 'My Claims' }} />
                    <Stack.Screen name="Withdrawals" component={WithdrawalsScreen} options={{ title: 'Payout History' }} />
                    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
                    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Admin Gateway', headerShown: false }} />
                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: '🛡️ Admin Operations' }} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
