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
  onAddQueueVisitor: () => void;
  onViewRatings: () => void;
  onViewAllTickets: () => void;
  onCancelAllQueues: () => void;
}

const QueueInfo: React.FC<QueueInfoProps> = ({
  onAddFaculty,
  onAddStudent,
  onVerifyFaculty,
  onAddQueue,
  onAddQueueVisitor,
  onViewRatings,
  onViewAllTickets, 
  onCancelAllQueues,
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
        <Text style={styles.queueTitle}>WAITING STUDENT</Text>
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
        <Text style={styles.button}>Queue Student</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddQueueVisitor}>
        <Text style={styles.button}>Queue Visitor</Text>
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
      {/* <View style={styles.headerButtonsContainer}>
        <TouchableOpacity 
          style={styles.viewTicketsButton}
          onPress={onViewAllTickets}
        >
          <Text style={styles.buttonText}>View All Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cancelAllButton}
          onPress={onCancelAllQueues}
        >
          <Text style={styles.buttonText}>Cancel All Queues</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 15,
  },
  viewTicketsButton: {
    backgroundColor: '#1E8449',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelAllButton: {
    backgroundColor: 'rgb(61, 57, 57)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    padding: 20,
    borderRadius: 10,
  },
  queueCountContainer: {
    backgroundColor: "#fff", // Green background
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#800020",
  },
  queueTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#800020",
    marginBottom: 5,
  },
  queueCount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#000",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    textAlign: "center",
    fontWeight: "bold",
    color: "#800020",
    fontSize: 16,
    elevation: 3,
    borderColor: "#800020",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default QueueInfo;
