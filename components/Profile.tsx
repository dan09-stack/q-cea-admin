import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import firebase from '@/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';

const Profile: React.FC = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
      }
    };

    fetchAdminData();
  }, []);
  const handleEdit = async () => {
    if (isEditing) {
      // Save changes to Firebase
      try {
        const adminRef = firebase.firestore().collection('admin').doc('admin1');
        await adminRef.update(adminData);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      setIsEditing(true);
    }
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.GreenContainer}>
        <View style={styles.contentRow}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
  
          <View style={styles.infoContainer}>
            {adminData ? (
              <>
                <Text style={styles.queueTitle}>
                  Name: {isEditing ? (
                    <TextInput 
                      value={adminData.name}
                      onChangeText={(text) => setAdminData({...adminData, name: text})}
                      style={styles.input}
                    />
                  ) : adminData.name}
                </Text>
                <Text style={styles.queueTitle}>
                  ID #: {isEditing ? (
                    <TextInput 
                      value={adminData.id}
                      onChangeText={(text) => setAdminData({...adminData, id: text})}
                      style={styles.input}
                    />
                  ) : adminData.id}
                </Text>
                <Text style={styles.queueTitle}>
                  Phone #: {isEditing ? (
                    <TextInput 
                      value={adminData.phone}
                      onChangeText={(text) => setAdminData({...adminData, phone: text})}
                      style={styles.input}
                    />
                  ) : adminData.phone}
                </Text>
                <Text style={styles.queueTitle}>
                  Email: {isEditing ? (
                    <TextInput 
                      value={adminData.email}
                      onChangeText={(text) => setAdminData({...adminData, email: text})}
                      style={styles.input}
                    />
                  ) : adminData.email}
                </Text>
                <Text style={styles.queueTitle}>
                  Password: {isEditing ? (
                    <TextInput 
                      value={adminData.password}
                      onChangeText={(text) => setAdminData({...adminData, password: text})}
                      secureTextEntry
                      style={styles.input}
                    />
                  ) : '********'}
                </Text>
                
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={handleEdit}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.queueTitle}>Loading...</Text>
            )}
            </View>
        </View>
      </View>
    </View>
  );
  
};


const styles = StyleSheet.create({
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 5,
    color: '#000',
    marginLeft: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  imageContainer: {
    marginRight: 50,
    marginLeft: -20,
  },
  infoContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#4CAF50', // Same green background color as QueueInfo
    justifyContent: 'center', // Centering content
    alignItems: 'center', // Centering content horizontally
  },
  GreenContainer: {
    backgroundColor: '#0d3310', // Same dark green background as QueueInfo
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%'
  },
  queueTitle: {
    fontSize: 18, // Adjusted for better readability
    color: '#fff', // White text color
    marginBottom: 12, // Added margin between fields
  },
  
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1a5620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Profile;
