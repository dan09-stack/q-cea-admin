import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyAdminCredentials, resetAdminPassword } from './services/adminAuth';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter a valid email and password.');
      return;
    }
  
    try {
      setLoading(true);
      setErrorMessage('');
  
      const result = await verifyAdminCredentials(email, password);
  
      if (result.success) {
        router.push('/(screens)/AdminDashboard');
      } else {
        setErrorMessage(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setErrorMessage('Authentication failed');
    } finally {
      setLoading(false);
    }
  };  


  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email first.');
      return;
    }
  
    try {
      setResetLoading(true);
      
      // Generate a random password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Call reset function with email and new password
      const result = await resetAdminPassword(email, newPassword);
      
      if (result.success) {
        Alert.alert('Password Reset', `Your new password is: ${newPassword}`);
      } else {
        Alert.alert('Error', result.error || 'Password reset failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setResetLoading(false);
    }
  };  

  return (
    <View style={[styles.container, { pointerEvents: 'auto' }]}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>Admin Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN</Text>
          )}
        </TouchableOpacity>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        
        <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading}>
          <Text style={styles.forgotPassword}>
            {resetLoading ? 'Resetting password...' : 'Forgot your password?'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: 400,
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#333',
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 15,
    color: '#fff',
  },
  button: {
    backgroundColor: '#43a047',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  forgotPassword: {
    color: '#ccc',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default LoginScreen;
