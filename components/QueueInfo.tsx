// QueueInfo.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import firebase, { db } from "@/firebaseConfig"; // Import Firebase config
import { collection, getDocs, query, where, updateDoc, doc, increment, writeBatch, orderBy, onSnapshot } from "firebase/firestore";
import { query as firestoreQuery, where as firestoreWhere } from 'firebase/firestore';

interface QueueInfoProps {
  onAddFaculty: () => void;
  onAddStudent: () => void;
  onVerifyFaculty: () => void;
  onAddQueue: () => void;
  onAddQueueVisitor: () => void;
  onViewRatings: () => void;
  onViewTickets: () => void;

}

const QueueInfo: React.FC<QueueInfoProps> = ({
  onAddFaculty,
  onAddStudent,
  onVerifyFaculty,
  onAddQueue,
  onAddQueueVisitor,
  onViewRatings,
  onViewTickets,

}) => {
  const [queueCount, setQueueCount] = useState<number>(0); // State to store queue count
  const [unverifiedCount, setUnverifiedCount] = useState<number>(0);

  // Add the cancel all queues function
 const handleCancelAllQueues = async () => {
     try {
       // Confirm cancellation first
       // if (!confirm('Are you sure you want to cancel ALL queues? This action cannot be undone.')) {
       //   return;
       // }
       
       // Get all waiting students in queues
       const studentsCollectionRef = collection(db, 'student');
       const waitingStudentsQuery = firestoreQuery(
         studentsCollectionRef, 
         firestoreWhere('status', '==', 'waiting')
       );
       
       const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);
       
       // Get all faculty users
       const facultyQuery = firestoreQuery(
         studentsCollectionRef,
         firestoreWhere('userType', '==', 'FACULTY')
       );
       
       const facultySnapshot = await getDocs(facultyQuery);
       
       // Batch update to cancel all queues and reset faculty queue counts
       const batch = writeBatch(db);
       
       // Update all waiting students
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
       
       // Update all faculty members to reset numOnQueue
       if (!facultySnapshot.empty) {
         facultySnapshot.docs.forEach((docSnapshot) => {
           const facultyRef = doc(db, 'student', docSnapshot.id);
           batch.update(facultyRef, {
             numOnQueue: 0,
             displayedTicket:null
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
            <Text style={styles.queueTitle}>WAITING STUDENT </Text>
            <Text style={styles.queueCount}>{queueCount}</Text> 

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
            <Text style={styles.button}>Queue Student</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddQueueVisitor}>
        <Text style={styles.button}>Queue Visitor</Text>
          </TouchableOpacity>

        </View>
      )}
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