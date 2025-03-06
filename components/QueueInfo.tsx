// QueueInfo.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import firebase, { db } from "@/firebaseConfig"; // Import Firebase config
import { collection, query, where, onSnapshot } from "firebase/firestore";
interface QueueInfoProps {
  onAddFaculty: () => void;
  onAddStudent: () => void;
  onVerifyFaculty: () => void;
  onAddQueue: () => void;
  onViewRatings: () => void;
  
}

const QueueInfo: React.FC<QueueInfoProps> = ({
  onAddFaculty,
  onAddStudent,
  onVerifyFaculty,
  onAddQueue,
  onViewRatings,
  
}) => {
  const [queueCount, setQueueCount] = useState<number>(0); // State to store queue count
  const [unverifiedCount, setUnverifiedCount] = useState<number>(0);

  useEffect(() => {
    const studentRef = firebase.firestore().collection("student");
    const facultyRef = collection(db, "student");
    const unverifiedQuery = query(facultyRef, where("isVerified", "==", false));
    
    const unsubscribeUnverified = onSnapshot(unverifiedQuery, (snapshot) => {
      setUnverifiedCount(snapshot.size);
    });
  
    // Query all faculty members and sum their numOnQueue
    const facultyQuery = query(facultyRef, where("userType", "==", "FACULTY"));
    const unsubscribeFaculty = onSnapshot(facultyQuery, (snapshot) => {
      let totalOnQueue = 0;
      snapshot.forEach((doc) => {
        totalOnQueue += doc.data().numOnQueue || 0;
      });
      setQueueCount(totalOnQueue);
    });
  
    // Cleanup the listeners when the component unmounts
    return () => {
      unsubscribeUnverified();
      unsubscribeFaculty();
    };
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Queue Count Section */}
      <View style={styles.queueCountContainer}>
        <Text style={styles.queueTitle}>TOTAL</Text>
        <Text style={styles.queueTitle}>STUDENT ON QUEUE</Text>
        <Text style={styles.queueCount}>{queueCount}</Text> {/* Display the queueCount */}
      </View>

      {/* Action Buttons */}
      <TouchableOpacity onPress={onAddFaculty}>
        <Text style={styles.button}>Register Faculty</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddStudent}>
        <Text style={styles.button}>Register Student</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddQueue}>
        <Text style={styles.button}>Queue</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={onVerifyFaculty}>
        <Text style={styles.button}>
          Verify Faculty Account{' '}
          {unverifiedCount > 0 && (
            <Text style={{ color: '#FF0000', fontWeight: 'bold' }}>
              ({unverifiedCount})
            </Text>
          )}
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
  },
  queueCountContainer: {
    backgroundColor: "#0d3310", // Green background
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  queueTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  queueCount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  button: {
    backgroundColor: "#333", 
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    color: "#fff",
    textAlign: "center",
  },
});

export default QueueInfo;
