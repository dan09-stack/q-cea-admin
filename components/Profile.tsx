import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import firebase from '../firebaseConfig'; // Importing default firebase config
import { collection, getDocs, addDoc, doc, setDoc, query, limit } from 'firebase/firestore'; // Import Firestore methods

const Profile: React.FC = () => {
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

  // Fetch the first document from the 'admin' collection
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
        const docId = snapshot.docs[0].id; // Get the document ID
        await setDoc(doc(firestore, 'admin', docId), profileData); // Update the document
        console.log('Profile data saved successfully');
      } else {
        // If no document exists, create a new one
        await addDoc(collection(firestore, 'admin'), profileData);
        console.log('Profile data created successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSavePress = async () => {
    setIsEditing(false);
    await saveProfileToFirebase();
  };

  const handleChange = (key: string, value: string) => {
    setProfileData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
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
      <View style={styles.card}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Image
              style={styles.avatarImage}
              source={{ uri: 'https://via.placeholder.com/50' }}
            />
          </View>
          <View style={styles.infoSection}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.input}
                  value={profileData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Name"
                />
                <TextInput
                  style={styles.input}
                  value={profileData.id}
                  onChangeText={(text) => handleChange('id', text)}
                  placeholder="ID #"
                />
                <TextInput
                  style={styles.input}
                  value={profileData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  placeholder="Phone #"
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  value={profileData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Email"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  value={profileData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  placeholder="Password"
                  secureTextEntry
                />
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Name: <Text style={styles.valueText}>{profileData.name}</Text>
                </Text>
                <Text style={styles.infoText}>
                  ID #: <Text style={styles.valueText}>{profileData.id}</Text>
                </Text>
                <Text style={styles.infoText}>
                  Phone #: <Text style={styles.valueText}>{profileData.phone}</Text>
                </Text>
                <Text style={styles.infoText}>
                  Email: <Text style={styles.valueText}>{profileData.email}</Text>
                </Text>
                <Text style={styles.infoText}>
                  Password: <Text style={styles.valueText}>{profileData.password}</Text>
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleSavePress : handleEditPress}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.editText}>{isEditing ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  editButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#1c6625',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
