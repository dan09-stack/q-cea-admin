import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Modal,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyAdminCredentials, resetAdminPassword } from './services/adminAuth';
import { getAdminByEmail } from './services/adminService';
import { auth } from './../firebaseConfig';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSMS } from './services/smsService';

const MAX_LOGIN_ATTEMPTS = 5;
const INITIAL_LOCKOUT_DURATION = 5 * 1000; // 5 seconds in milliseconds (for testing)

const Index = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [lockoutCount, setLockoutCount] = useState(0);
  // Security features
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState('');
  
  // Forgot password modal state
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageRecipient, setMessageRecipient] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const handleSendMessage = async () => {
    if (!messageRecipient || !messageText) {
      Alert.alert('Error', 'Please enter both recipient number and message text.');
      return;
    }
  
    try {
      setSendingMessage(true);
      
      // Use the existing SMS service
      const result = await sendSMS(
        messageRecipient,
        messageText
      );
      
      if (result) {
        Alert.alert('Success', 'Message sent successfully.');
        setMessageModalVisible(false);
        setMessageText('');
        setMessageRecipient('');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Update countdown timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isLocked && lockoutTime) {
      intervalId = setInterval(() => {
        const currentTime = new Date().getTime();
        const timeLeft = lockoutTime - currentTime;
        
        if (timeLeft <= 0) {
          // Unlock account when time is up
          setIsLocked(false);
          setLoginAttempts(0);
          AsyncStorage.removeItem('lockoutTime');
          AsyncStorage.setItem('loginAttempts', '0');
          clearInterval(intervalId);
          setLockoutCountdown('');
        } else {
          // Update countdown display - for 5 seconds, just show seconds
          const seconds = Math.ceil(timeLeft / 1000);
          setLockoutCountdown(`${seconds}`);
        }
      }, 100); // Update more frequently for a smoother countdown
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLocked, lockoutTime]);

  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const storedLockoutTime = await AsyncStorage.getItem('lockoutTime');
        const storedAttempts = await AsyncStorage.getItem('loginAttempts');
        const storedLockoutCount = await AsyncStorage.getItem('lockoutCount');
        
        if (storedLockoutCount) {
          setLockoutCount(parseInt(storedLockoutCount));
        }
        
        if (storedLockoutTime) {
          const lockTime = parseInt(storedLockoutTime);
          const currentTime = new Date().getTime();
          
          if (currentTime < lockTime) {
            // Account is still locked
            setIsLocked(true);
            setLockoutTime(lockTime);
            setLoginAttempts(parseInt(storedAttempts || '0'));
            
            // Initial countdown display
            const timeLeft = lockTime - currentTime;
            const seconds = Math.ceil(timeLeft / 1000);
            setLockoutCountdown(`${seconds}`);
          } else {
            // Lock period has expired
            setIsLocked(false);
            setLoginAttempts(0);
            AsyncStorage.removeItem('lockoutTime');
            AsyncStorage.setItem('loginAttempts', '0');
            // Don't reset lockoutCount here - it should persist across lockouts
          }
        } else if (storedAttempts) {
          setLoginAttempts(parseInt(storedAttempts));
        }
      } catch (error) {
        console.error('Error checking lock status:', error);
      }
    };
    
    checkLockStatus();
  }, []);

  // Ensure user is signed out on screen load
  useEffect(() => {
    const logout = async () => {
      await signOut(auth); // Logs out any existing session
    };
    logout();
  }, []);

  const handleLogin = async () => {
    if (isLocked) {
      setErrorMessage(`Account is locked. Please wait ${lockoutCountdown} seconds before trying again.`);
      return;
    }
  
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter a valid email and password.');
      return;
    }
  
    try {
      setLoading(true);
      setErrorMessage('');
  
      const result = await verifyAdminCredentials(email, password);
      if (email != 'albisdandan@gmail.com') {
        setErrorMessage('Invalid email or password');
        return;
      }

      if (result.success) {
        // Reset login attempts on successful login
        setLoginAttempts(0);
        await AsyncStorage.setItem('loginAttempts', '0');
        
        // Reset lockout count on successful login
        setLockoutCount(0);
        AsyncStorage.setItem('lockoutCount', '0');
        
        // Navigate directly to dashboard without OTP
        router.replace('/(screens)/AdminDashboard');
        return;
      } else {
        // Increment login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        await AsyncStorage.setItem('loginAttempts', newAttempts.toString());
        
        // Check if account should be locked
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          // Increment lockout count
          const newLockoutCount = lockoutCount + 1;
          setLockoutCount(newLockoutCount);
          await AsyncStorage.setItem('lockoutCount', newLockoutCount.toString());
          
          // Calculate progressive lockout duration (5, 10, 20, 40 seconds, etc.)
          const currentLockoutDuration = INITIAL_LOCKOUT_DURATION * Math.pow(2, newLockoutCount - 1);
          
          const lockTime = new Date().getTime() + currentLockoutDuration;
          setIsLocked(true);
          setLockoutTime(lockTime);
          await AsyncStorage.setItem('lockoutTime', lockTime.toString());
          
          // Initial countdown display
          const seconds = Math.ceil(currentLockoutDuration / 1000);
          setLockoutCountdown(`${seconds}`);
          
          setErrorMessage(`Too many failed attempts. Account locked for ${seconds} seconds.`);
        } else {
          setErrorMessage(`${result.error || 'Invalid credentials'}. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      setErrorMessage('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      setResetLoading(true);
      const result = await resetAdminPassword(resetEmail);

      if (result.success) {
        Alert.alert('Password Reset', 'A password reset email has been sent. Please check your inbox.');
        setForgotPasswordVisible(false);
        setResetEmail('');
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
    <View style={styles.container}>
      {/* Left Section with Illustration */}
      <View style={styles.leftContainer}>
        <Image source={require('../assets/images/q-cea.png')} style={styles.illustration} resizeMode="contain" />
      </View>
      
      {/* Right Section with Login Form */}
      <View style={styles.rightContainer}>
        <Image source={require('../assets/images/typing.gif')} style={styles.avatar} />
        <Text style={styles.welcomeText}>WELCOME ADMIN</Text>
        
        {/* Account Lockout Banner */}
        {isLocked && (
          <View style={styles.lockoutBanner}>
            <Ionicons name="lock-closed" size={24} color="#fff" />
            <Text style={styles.lockoutText}>
              Account locked. Try again in: {lockoutCountdown} seconds
            </Text>
          </View>
        )}
        
        {/* Email/Username Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLocked}
          />
        </View>
        
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isLocked}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLocked}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#888" style={styles.iconRight} />
          </TouchableOpacity>
        </View>
        
        {/* Error Message */}
        {errorMessage && !isLocked ? <Text style={styles.error}>{errorMessage}</Text> : null}
        
        {/* Forgot Password Link */}
        <TouchableOpacity onPress={() => setForgotPasswordVisible(true)} disabled={isLocked}>
          <Text style={[styles.forgotPassword, isLocked && styles.disabledText]}>Forgot Password?</Text>
        </TouchableOpacity>
        
        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.loginButton, (loading || isLocked) && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading || isLocked}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>LOGIN</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={messageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message</Text>
            <Text style={styles.modalText}>Enter recipient phone number and message.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Recipient Phone Number (e.g., 09XXXXXXXXX)"
              placeholderTextColor="#999"
              value={messageRecipient}
              onChangeText={setMessageRecipient}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={[styles.modalInput, styles.messageInput]}
              placeholder="Message"
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline={true}
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setMessageModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSendButton, sendingMessage && styles.buttonDisabled]}
                onPress={handleSendMessage}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
      
      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotPasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalText}>Enter your email address to receive a password reset link.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#999"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setForgotPasswordVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSendButton, resetLoading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Send Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  messageButton: {
    backgroundColor: '#4CAF50', // Green color for message button
    width: '90%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },  
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8E6E6', // Light maroon/pink background
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '80%',
    height: '80%',
  },
  rightContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: {
    width: 300,
    height: 200,
    borderRadius: 30,
    marginTop: "20%",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#800020', // Maroon color for welcome text
    marginBottom: 20,
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '90%',
  },
  lockoutText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: '90%',
  },
  icon: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  input: {
    paddingLeft: 10,
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  error: {
    color: '#D32F2F', // A slightly brighter red for error messages
    marginBottom: 10,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#800020', // Maroon color for the link
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  disabledText: {
    opacity: 0.5,
  },
  loginButton: {
    backgroundColor: '#800020', // Main maroon color for button
    width: '90%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 5,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#800020', // Maroon color for modal title
  },
  modalText: {
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#F1F3F4',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingLeft: 10,
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  modalSendButton: {
    backgroundColor: '#800020', // Maroon color for send button
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelModalText: {
    color: '#000',
  }
});

export default Index;
