import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import firebase from '@/firebaseConfig'; // Import your Firebase configuration

const Profile: React.FC = () => {
  const [adminData, setAdminData] = useState<any>(null);

  // Fetch data from the 'admin1' document in the 'admin' collection
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminRef = firebase.firestore().collection('admin').doc('admin1'); // Get the admin1 document
        const docSnapshot = await adminRef.get();
        if (docSnapshot.exists) {
          setAdminData(docSnapshot.data()); // Set data from the 'admin1' document
        } else {
          console.log('No admin1 data found');
        }
      } catch (error) {
        console.error('Error fetching admin data: ', error);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.GreenContainer}>

        {adminData ? (
          <>
            <Text style={styles.queueTitle}>Name: {adminData.name}</Text>
            <Text style={styles.queueTitle}>ID #: {adminData.id}</Text>
            <Text style={styles.queueTitle}>Phone #: {adminData.phone}</Text>
            <Text style={styles.queueTitle}>Email: {adminData.email}</Text>
            <Text style={styles.queueTitle}>Password: {adminData.password}</Text>
          </>
        ) : (
          <Text style={styles.queueTitle}>Loading...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default Profile;
