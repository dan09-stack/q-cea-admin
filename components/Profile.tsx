import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Dimensions } from 'react-native';
import firebase from '@/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

const Profile: React.FC = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminRef = firebase.firestore().collection('admin').doc('admin1');
        const docSnapshot = await adminRef.get();
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          setAdminData(data);
          setImageUrl(data?.profilePicture || null);
        }
      } catch (error) {
        console.error('Error fetching admin data: ', error);
        Alert.alert('Error', 'Could not load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);
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
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = firebase.storage();
      const imageRef = storageRef.ref(`adminProfiles/admin1_profile.jpg`);
      
      await imageRef.put(blob);
      const downloadUrl = await imageRef.getDownloadURL();
      
      const adminRef = firebase.firestore().collection('admin').doc('admin1');
      await adminRef.update({
        profilePicture: downloadUrl
      });
      
      setImageUrl(downloadUrl);
      setAdminData({...adminData, profilePicture: downloadUrl});
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };


  const handleEdit = async () => {
    if (isEditing) {
      setIsSaving(true);
      try {
        // Check if password has changed
        if (passwordChanged && newPassword) {
          const user = firebase.auth().currentUser;
          if (user) {
            // Reauthenticate the user first
            const credential = EmailAuthProvider.credential(
              user.email || adminData.email,
              currentPassword
            );
            
            try {
              await reauthenticateWithCredential(user, credential);
              
              // Update the password
              await updatePassword(user, newPassword);
              
              // Update the stored password in Firestore (optional, for display purposes)
              adminData.password = newPassword;
              
              Alert.alert('Success', 'Password updated successfully');
              setPasswordChanged(false);
              setCurrentPassword('');
              setNewPassword('');
            } catch (authError) {
              console.error('Authentication error:', authError);
              Alert.alert('Authentication Error', 'Current password is incorrect or you need to reauthenticate.');
              setIsSaving(false);
              return;
            }
          }
        }
        
        // Update other profile data in Firestore
        const adminRef = firebase.firestore().collection('admin').doc('admin1');
        await adminRef.update(adminData);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  // Add a method to handle password change
  const handlePasswordChange = () => {
    setPasswordChanged(true);
    setShowPasswordModal(true);
  };

  // Modify renderProfileField to handle password field specially
  const renderProfileField = (label: string, field: string, isPassword = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        isPassword ? (
          <View>
            <TouchableOpacity 
              style={styles.passwordChangeButton} 
              onPress={handlePasswordChange}
            >
              <Text style={styles.passwordChangeText}>Change Password</Text>
            </TouchableOpacity>
            {passwordChanged && (
              <>
                <TextInput 
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  style={[styles.input, {marginTop: 10}]}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor="#000"
                />
                <TextInput 
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={[styles.input, {marginTop: 10}]}
                  secureTextEntry
                  placeholder="Enter new password"
                  placeholderTextColor="#000"
                />
              </>
            )}
          </View>
        ) : (
          <TextInput 
            value={adminData[field]}
            onChangeText={(text) => setAdminData({...adminData, [field]: text})}
            style={styles.input}
            secureTextEntry={isPassword}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#666"
          />
        )
      ) : (
        <Text style={styles.fieldValue}>{isPassword ? '••••••••' : adminData[field]}</Text>
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
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Admin Profile</Text>
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
            {adminData ? (
              <>
                {renderProfileField('Name', 'name')}
                {renderProfileField('ID', 'id')}
                {renderProfileField('Phone', 'phone')}
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
