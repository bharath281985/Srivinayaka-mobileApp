import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ title: 'OTP Verification' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
    <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: 'Complete Profile' }} />
  </Stack.Navigator>
);

export default AuthNavigator;
