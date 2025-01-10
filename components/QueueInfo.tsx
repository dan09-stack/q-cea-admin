// QueueInfo.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import firebase from "@/firebaseConfig"; // Import Firebase config

interface QueueInfoProps {
  onAddFaculty: () => void;
  onAddStudent: () => void;
  onAddAdmin: () => void;
  onAddQueue: () => void;
  onViewRatings: () => void;
}

const QueueInfo: React.FC<QueueInfoProps> = ({
  onAddFaculty,
  onAddStudent,
  onAddAdmin,
  onAddQueue,
  onViewRatings,
}) => {
  const [queueCount, setQueueCount] = useState<number>(0); // State to store queue count

  useEffect(() => {
    const studentRef = firebase.firestore().collection("student");

    // Real-time fetch queueCount from Firestore where status is "waiting"
    const unsubscribe = studentRef
      .where("status", "==", "waiting")
      .onSnapshot((querySnapshot) => {
        // Update the queueCount whenever the collection changes
        setQueueCount(querySnapshot.size); // 'size' gives the number of matching documents
      });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs only once when the component mounts

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
        <Text style={styles.button}>Add Faculty</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddStudent}>
        <Text style={styles.button}>Add Student</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddAdmin}>
        <Text style={styles.button}>Add Admin</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddQueue}>
        <Text style={styles.button}>Add Queue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#4CAF50",
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
