import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

const Statistics: React.FC = () => {
  const [todayQueue, setTodayQueue] = useState(0);

  useEffect(() => {
    const queueCounterRef = doc(db, 'admin', 'QueueCounter');
    
    // Real-time listener for queue updates
    const unsubscribe = onSnapshot(queueCounterRef, (doc) => {
      if (doc.exists()) {
        setTodayQueue(doc.data().today_queue);
      }
    });

    // Check time and reset counter at midnight
    const checkMidnightReset = () => {
      const now = new Date();
      // Check for the entire first minute of the day
      if (now.getHours() === 0 && now.getMinutes() <= 1) {
        updateDoc(queueCounterRef, {
          today_queue: 0
        });
      }
    };
    

    // Run check every minute
    const intervalId = setInterval(checkMidnightReset, 60000);

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics Dashboard</Text>
      
      <View style={styles.counterCard}>
        <Text style={styles.counterTitle}>Today's Queue</Text>
        <Text style={styles.counterValue}>{todayQueue}</Text>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  counterCard: {
    width: '20%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  counterValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  }
});

export default Statistics;
