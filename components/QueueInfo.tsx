// QueueInfo.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import firebase, { db } from "@/firebaseConfig"; // Import Firebase config
import { collection, getDocs, query, where, updateDoc, doc, increment, writeBatch, orderBy, onSnapshot } from "firebase/firestore";

interface QueueInfoProps {
  onAddFaculty: () => void;
  onAddStudent: () => void;
  onVerifyFaculty: () => void;
  onAddQueue: () => void;
  onViewRatings: () => void;
  onViewTickets: () => void;

}

const QueueInfo: React.FC<QueueInfoProps> = ({
  onAddFaculty,
  onAddStudent,
  onVerifyFaculty,
  onAddQueue,
  onViewRatings,
  onViewTickets,

}) => {
  const [queueCount, setQueueCount] = useState<number>(0); // State to store queue count
  const [unverifiedCount, setUnverifiedCount] = useState<number>(0);

  // Add the cancel all queues function
  const handleCancelAllQueues = async () => {
    try {
      const studentsCollectionRef = collection(db, 'student');
      const waitingStudentsQuery = query(
        studentsCollectionRef,
        where('status', '==', 'waiting')
      );

      const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);

      const facultyQuery = query(
        studentsCollectionRef,
        where('userType', '==', 'FACULTY')
      );

      const facultySnapshot = await getDocs(facultyQuery);

      const batch = writeBatch(db);

      if (!waitingStudentsSnapshot.empty) {
        waitingStudentsSnapshot.docs.forEach((docSnapshot) => {
          const studentRef = doc(db, 'student', docSnapshot.id);
          batch.update(studentRef, {
            status: 'completed',
            userTicketNumber: null,
            faculty: null,
            concern: null,
            otherConcern: null,
            requestDate: null,
            queuePosition: null
          });
        });
      }

      if (!facultySnapshot.empty) {
        facultySnapshot.docs.forEach((docSnapshot) => {
          const facultyRef = doc(db, 'student', docSnapshot.id);
          batch.update(facultyRef, {
            numOnQueue: 0
          });
        });
      }

      await batch.commit();

      Alert.alert('Success', `Cancelled ${waitingStudentsSnapshot.size} queues successfully and reset all faculty queue counts`);
    } catch (error) {
      console.error('Error cancelling all queues:', error);
      Alert.alert('Error', 'Failed to cancel all queues');
    }
  };



  useEffect(() => {
    const studentRef = firebase.firestore().collection("student");
    const facultyRef = collection(db, "student");
    const unverifiedQuery = query(facultyRef, where("isVerified", "==", false));

    const unsubscribeUnverified = onSnapshot(unverifiedQuery, (snapshot) => {
      setUnverifiedCount(snapshot.size);
    });
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

            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity
                style={styles.viewTicketsButton}
                onPress={onViewTickets}
              >
                <Text style={styles.buttonText}>View All Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAllButton}
                onPress={handleCancelAllQueues}
              >
                <Text style={styles.buttonText}>Cancel All Queues</Text>
              </TouchableOpacity>
          </View>
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

        </View>
      )}
    

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
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  viewTicketsButton: {
    backgroundColor: '#1E8449',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelAllButton: {
    backgroundColor: 'rgb(173, 51, 51)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '100%'
  },
  DualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  tableSubHeader: {
    flexDirection: 'row',
    padding: 10,
  },
  headerCell: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollableContent: {
    flex: 1,
    width: '100%',
    maxHeight: '75%',
  },
  tableSection: {
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  tableHeader: {
    backgroundColor: '#1E8449',
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    padding: 12,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: 'rgb(50, 41, 41)',
    padding: 5,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'rgb(50, 41, 41)',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: .2,
  },
});

export default QueueInfo;