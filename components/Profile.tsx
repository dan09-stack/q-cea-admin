import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // Import Expo Router
import firebase from '../firebaseConfig'; // Import Firebase config
import { collection, getDocs, addDoc, doc, setDoc, query, limit } from 'firebase/firestore'; // Import Firestore methods

const Profile: React.FC = () => {
  const router = useRouter(); // Initialize router
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    id: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const firestore = firebase.firestore(); // Access Firestore instance

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snapshot = await getDocs(query(collection(firestore, 'admin'), limit(1)));
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setProfileData({
            name: data.name || '',
            id: data.id || '',
            phone: data.phone || '',
            email: data.email || '',
            password: data.password || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [firestore]);

  const saveProfileToFirebase = async () => {
    try {
      setIsSaving(true);
      const snapshot = await getDocs(query(collection(firestore, 'admin'), limit(1)));
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await setDoc(doc(firestore, 'admin', docId), profileData);
        console.log('Profile data saved successfully');
      } else {
        await addDoc(collection(firestore, 'admin'), profileData);
        console.log('Profile data created successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    router.replace('/'); // Navigate back to index.tsx
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
        <Text style={styles.backButtonText}>← Logout</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Image
              style={styles.avatarImage}
              source={{ uri: 'https://via.placeholder.com/50' }}
            />
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>Name: <Text style={styles.valueText}>{profileData.name}</Text></Text>
            <Text style={styles.infoText}>ID #: <Text style={styles.valueText}>{profileData.id}</Text></Text>
            <Text style={styles.infoText}>Phone #: <Text style={styles.valueText}>{profileData.phone}</Text></Text>
            <Text style={styles.infoText}>Email: <Text style={styles.valueText}>{profileData.email}</Text></Text>
            <Text style={styles.infoText}>Password: <Text style={styles.valueText}>{profileData.password}</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a5d653',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#ff4c4c',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#0c3915',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  infoSection: {
    flex: 1,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  valueText: {
    fontWeight: 'bold',
  },
});

export default Profile;
