import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import firebase from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, query, limit } from 'firebase/firestore';

const Profile: React.FC = () => {
  const router = useRouter();
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
  
  // Email sending state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const firestore = firebase.firestore();

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

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const snapshot = await getDocs(query(collection(firestore, 'admin'), limit(1)));
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await setDoc(doc(firestore, 'admin', docId), profileData);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  };
/*
  const handleSendEmail = async () => {
    if (!recipientEmail.trim() || !message.trim()) {
      Alert.alert("Error", "Please enter both an email and a message.");
      return;
    }
  
    setIsSending(true);
  
    try {
      const response = await fetch(
        "https://us-central1-q-cea-3b4bf.cloudfunctions.net/sendEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: recipientEmail, // ✅ Matches Cloud Function parameters
            message: message,
          }),
        }
      );
  
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(responseText);
      }
  
      Alert.alert("Success", "Email sent successfully!");
    } catch (error: any) {
      console.error("Error sending email:", error);
      Alert.alert("Error", error.message || "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };  
*/
  const handleLogout = () => {
    router.replace('/');
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
            {Object.keys(profileData).map((key) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.infoText}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={profileData[key as keyof typeof profileData]}
                    onChangeText={(text) => setProfileData({ ...profileData, [key]: text })}
                  />
                ) : (
                  <Text style={styles.valueText}>{profileData[key as keyof typeof profileData]}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Email Form */}
        <View style={styles.emailContainer}>
          <Text style={styles.infoText}>Send Email:</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient Email"
            value={recipientEmail}
            onChangeText={setRecipientEmail}
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
          /*  onPress={handleSendEmail} */
            disabled={isSending}
          >
            <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send Email'}</Text>
          </TouchableOpacity>
        </View> 
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emailContainer: {
    marginTop: 20,
  },
  sendButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    marginTop: 80,
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
  inputGroup: {
    marginBottom: 10,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  valueText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 5,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
