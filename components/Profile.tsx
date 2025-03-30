import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Dimensions, Modal } from 'react-native';
import { db, auth } from '@/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebase from '@/firebaseConfig';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [idFormatError, setIdFormatError] = useState<string | null>(null);
  const [phoneFormatError, setPhoneFormatError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
const [successModalMessage, setSuccessModalMessage] = useState('');

  const validateIdFormat = (id: string): boolean => {
    const idRegex = /^UP-\d{2}-\d{3}-[A-Z]$/;
    return idRegex.test(id);
  };
  const validatePhoneFormat = (phone: string): boolean => {
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return phoneRegex.test(phone);
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          Alert.alert('Error', 'No user is currently logged in');
          setIsLoading(false);
          return;
        }
  
        // First, check if the user exists in the admin collection
        let userRef = firebase.firestore().collection('admin').doc(currentUser.uid);
        let docSnapshot = await getDoc(userRef);
        
        // If not found in admin collection, check the student collection
        if (!docSnapshot.exists()) {
          userRef = firebase.firestore().collection('student').doc(currentUser.uid);
          docSnapshot = await getDoc(userRef);
        }
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setUserData(data);
          // Rest of your code to handle the user data...
        } else {
          Alert.alert('Error', 'User data not found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, []);
  
  const SuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={successModalVisible}
      onRequestClose={() => setSuccessModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.successModalContent]}>
          <View style={styles.modalHeader}>
            <Ionicons name="checkmark-circle" size={50} color="#1a5620" style={styles.successIcon} />
            <Text style={[styles.modalTitle, styles.successModalTitle]}>Success</Text>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>{successModalMessage}</Text>
          </View>
          <TouchableOpacity
            style={[styles.modalButton, styles.successModalButton]}
            onPress={() => setSuccessModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  const ErrorModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={errorModalVisible}
      onRequestClose={() => setErrorModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Error</Text>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>{errorModalMessage}</Text>
          </View>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setErrorModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        setErrorModalMessage('No user is currently logged in');
        setErrorModalVisible(true);
        setIsUploading(false);
        return;
      }
  
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = firebase.storage().ref(`profilePictures/${currentUser.uid}_profile.jpg`);
      await storageRef.put(blob);
      
      const downloadUrl = await storageRef.getDownloadURL();
      
      // Determine if user is in student or admin collection
      const userCollection = userData.userType ? 'student' : 'admin';
      const userRef = firebase.firestore().collection(userCollection).doc(currentUser.uid);
      
      await userRef.update({
        profilePicture: downloadUrl
      });
      
      setImageUrl(downloadUrl);
      setUserData({...userData, profilePicture: downloadUrl});
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorModalMessage('Failed to upload image. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      let hasErrors = false;
      
      // Validate ID format if it's being edited
      if (userData.idNumber && !validateIdFormat(userData.idNumber)) {
        setIdFormatError("ID must be in UP-XX-XXX-F format");
        hasErrors = true;
      }
      
      // Validate phone number format
      if (userData.phoneNumber && !validatePhoneFormat(userData.phoneNumber)) {
        setPhoneFormatError("Phone must be in 09XXXXXXXXX or +639XXXXXXXXX format");
        hasErrors = true;
      }
      
      if (hasErrors) {
        return;
      }
      
      setIsSaving(true);
      try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          setErrorModalMessage('No user is currently logged in');
          setErrorModalVisible(true);
          setIsSaving(false);
          return;
        }
  
        // Check if password has changed
        if (passwordChanged && newPassword) {
          // Validate password
          if (!currentPassword) {
            setErrorModalMessage('Please enter your current password');
            setErrorModalVisible(true);
            setIsSaving(false);
            return;
          }
          
          if (!newPassword || newPassword.length < 6) {
            setErrorModalMessage('New password must be at least 6 characters');
            setErrorModalVisible(true);
            setIsSaving(false);
            return;
          }
          
          // Reauthenticate the user first
          const credential = EmailAuthProvider.credential(
            currentUser.email || userData.email,
            currentPassword
          );
          
          try {
            await reauthenticateWithCredential(currentUser, credential);
            
            // Update the password
            await updatePassword(currentUser, newPassword);
            
            setSuccessModalMessage('Password updated successfully');
            setSuccessModalVisible(true);
            setPasswordChanged(false);
            setCurrentPassword('');
            setNewPassword('');
          } catch (authError) {
            console.error('Authentication error:', authError);
            setErrorModalMessage('Current password is incorrect or you need to reauthenticate');
            setErrorModalVisible(true);
            setIsSaving(false);
            return;
          }
        }
        
        // Determine if user is in student or admin collection
        const userCollection = userData.userType ? 'student' : 'admin';
        const userRef = firebase.firestore().collection(userCollection).doc(currentUser.uid);
        
        // Create a copy of userData without password and email for Firestore update
        const { password, email, ...dataToUpdate } = userData;
        
        await userRef.update(dataToUpdate);
        setIsEditing(false);
        setSuccessModalMessage('Profile updated successfully');
        setSuccessModalVisible(true);
      } catch (error) {
        console.error('Error updating profile:', error);
        setErrorModalMessage('Failed to update profile. Please try again.');
        setErrorModalVisible(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };
  const handlePasswordChange = () => {
    setPasswordChanged(true);
    setShowPasswordModal(true);
  };

// Modify renderProfileField to handle email field specially
const renderProfileField = (label: string, field: string, isPassword = false, isEmail = false, isId = false, isPhone = false) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {isEditing && !isEmail && !isPassword ? (
      <View>
        <TextInput 
          value={userData[field]}
          onChangeText={(text) => {
            setUserData({...userData, [field]: text});
            // Clear errors when typing
            if (isId) setIdFormatError(null);
            if (isPhone) setPhoneFormatError(null);
          }}
          style={[
            styles.input, 
            (isId && idFormatError) || (isPhone && phoneFormatError) ? styles.inputError : {}
          ]}
          placeholder={
            isId ? "UP-XX-XXX-F" : 
            isPhone ? "09XXXXXXXXX" : 
            `Enter ${label.toLowerCase()}`
          }
          placeholderTextColor="#666"
          keyboardType={isPhone ? "phone-pad" : "default"}
        />
        {isId && idFormatError && (
          <Text style={styles.errorText}>{idFormatError}</Text>
        )}
        {isPhone && phoneFormatError && (
          <Text style={styles.errorText}>{phoneFormatError}</Text>
        )}
        {isId && (
          <Text style={styles.helperText}>Format: UP-XX-XXX-F (e.g., UP-20-123-A)</Text>
        )}
        {isPhone && (
          <Text style={styles.helperText}>Format: 09XXXXXXXXX or +639XXXXXXXXX</Text>
        )}
      </View>
    ) : isEditing && isPassword ? (
      <View>
        <TouchableOpacity 
          style={styles.passwordChangeButton} 
          onPress={handlePasswordChange}
        >
          <Text style={styles.passwordChangeText}>Change Password</Text>
        </TouchableOpacity>
        {passwordChanged && (
          <>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[styles.passwordInput, {marginTop: 10}]}
                secureTextEntry={!showCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#000"
              />
              <TouchableOpacity 
                style={styles.eyeIconContainer}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput 
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.passwordInput, {marginTop: 10}]}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#000"
              />
              <TouchableOpacity 
                style={styles.eyeIconContainer}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    ) : (
      <Text style={styles.fieldValue}>
        {isPassword ? '••••••••' : userData[field]}
      </Text>
    )}
  </View>
);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ErrorModal />
        <SuccessModal />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            ADMIN PROFILE
          </Text>
        </View>
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer} disabled={isUploading}>
              {isUploading ? (
                <View style={styles.profileImage}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              ) : imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person-add" size={40} color="#000" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color="#000" />
              </View>
            </TouchableOpacity>
          </View>
  
          <View style={styles.infoContainer}>
            {userData ? (
              <>
                {renderProfileField('Name', 'fullName')}
                {renderProfileField('ID Number', 'idNumber', false, false, true)}
                {renderProfileField('Phone', 'phoneNumber', false, false, false, true)}
                {renderProfileField('Email', 'email', false, true)}
                {renderProfileField('Password', 'password', true)}
                
                <TouchableOpacity 
                  style={[styles.actionButton, isEditing ? styles.saveButton : styles.editButton]} 
                  onPress={handleEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons 
                        name={isEditing ? "save-outline" : "create-outline"} 
                        size={20} 
                        color="#fff" 
                        style={styles.buttonIcon} 
                      />
                      <Text style={styles.buttonText}>
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {isEditing && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Ionicons name="close-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>Could not load profile data</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width > 700 ? 600 : width * 0.9;

const styles = StyleSheet.create({
  successModalContent: {
    borderLeftWidth: 5,
    borderLeftColor: '#1a5620',
  },
  successModalTitle: {
    color: '#1a5620',
  },
  successModalButton: {
    backgroundColor: '#1a5620',
  },
  successIcon: {
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800020',
  },
  modalBody: {
    width: '100%',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#800020',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    color: '#000',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 10,
    padding: 5,
    top: 15,
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  passwordChangeButton: {
    backgroundColor: '#1a5620',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordChangeText: {
    color: '#fff',
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e0e0e0',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800020',
  },
  card: {
    backgroundColor: '#fff', // Dark card background
    borderRadius: 15,
    padding: 20,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#1a5620', // Darker green border
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1a5620', // Dark green bg
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2e2e2e',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1a5620', // Dark green bg
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e2e2e',
  },
  infoContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333', 
    paddingBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#000', 
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  input: {
    fontSize: 18,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    color: '#000', // Light text color
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  editButton: {
    backgroundColor: '#800020', // Darker green
  },
  saveButton: {
    backgroundColor: 'rgb(81, 21, 21)', // Darker green
  },
  cancelButton: {
    backgroundColor: 'rgba(67, 28, 28, 0.48)', // Dark red
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#f44336', // Error red
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Profile;
