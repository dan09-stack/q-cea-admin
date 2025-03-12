import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyAdminCredentials, resetAdminPassword } from './services/adminAuth';
import { auth } from './../firebaseConfig';
import { signOut } from 'firebase/auth';

const Index = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Ensure user is signed out on screen load
  useEffect(() => {
    const logout = async () => {
      await signOut(auth); // Logs out any existing session
    };
    logout();
  }, []);

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
      const result = await resetAdminPassword(email);

      if (result.success) {
        Alert.alert('Password Reset', 'A password reset email has been sent. Please check your inbox.');
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
    <ImageBackground 
      source={require('../assets/images/green.jpg')}  
      style={styles.container}
    >
      
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
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? 'eye' : 'eye-off'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity>
          {/* <Text style={styles.forgotPassword}>Forgot your password?</Text> */}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: "25%",
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,  
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    position: 'relative', 
  },
  passwordInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 5,
    paddingLeft: 10,
    color: '#fff',
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  adminButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default Index;
