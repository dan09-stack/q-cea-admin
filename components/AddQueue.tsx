import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '@/firebaseConfig';
import { collection, CollectionReference, doc, DocumentData, getDoc, getDocs, onSnapshot, updateDoc, QueryConstraint,
  WhereFilterOp, 
  orderBy,
  limit} from 'firebase/firestore';
import { Query, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { query as firestoreQuery, where as firestoreWhere } from 'firebase/firestore';

const AddQueue: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [isRequested, setIsRequested] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [studentsList, setStudentsList] = useState<Array<{id: string, fullName: string}>>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [concernsList, setConcernsList] = useState<string[]>([]);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [nextDisplayedTicket, setNextDisplayedTicket] = useState('');
  const [nextDisplayedProgram, setNextDisplayedProgram] = useState('');
  const [currentDisplayedTicket, setCurrentDisplayedTicket] = useState('');
  const [currentDisplayedProgram, setCurrentDisplayedProgram] = useState('');
  const [userProgram, setUserProgram] = useState('');

// Track next ticket
useEffect(() => {
  if (!selectedFaculty) return;

  const facultyQuery = firestoreQuery(
    collection(db, 'student'),
    firestoreWhere('faculty', '==', selectedFaculty),
    firestoreWhere('status', '==', 'waiting'),
    firestoreWhere('userTicketNumber', '>', currentDisplayedTicket),
    orderBy('userTicketNumber', 'asc'),
    limit(1)
  );

  const unsubscribe = onSnapshot(facultyQuery, (snapshot) => {
    if (!snapshot.empty) {
      const nextTicket = snapshot.docs[0].data();
      setNextDisplayedTicket(nextTicket.userTicketNumber);
      setNextDisplayedProgram(nextTicket.program);
    } else {
      setNextDisplayedTicket('');
      setNextDisplayedProgram('');
    }
  });

  return () => unsubscribe();
}, [currentDisplayedTicket, selectedFaculty]);

// Track queue position
useEffect(() => {
  if (!selectedFaculty || !userTicketNumber) return;

  const queueQuery = firestoreQuery(
    collection(db, 'student'),
    firestoreWhere('faculty', '==', selectedFaculty),
    firestoreWhere('userTicketNumber', '>', Number(currentDisplayedTicket)),
    firestoreWhere('userTicketNumber', '<', Number(userTicketNumber)),
    firestoreWhere('status', '==', 'waiting')
  );

  const unsubscribe = onSnapshot(queueQuery, (snapshot) => {
    setPeopleAhead(snapshot.size);
  });

  return () => unsubscribe();
}, [userTicketNumber, currentDisplayedTicket, selectedFaculty]);
  
  useEffect(() => {
    // Get user program
    const getCurrentUserProgram = async () => {
      if (selectedStudent) {
        const studentRef = doc(db, 'student', selectedStudent);
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          setUserProgram(studentDoc.data().program || '');
        }
      }
    };
  
    getCurrentUserProgram();
  }, [selectedStudent]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setIsCheckingRequest(true);
  
    const studentsCollectionRef = collection(db, 'student');
    const studentsQuery = firestoreQuery(studentsCollectionRef, firestoreWhere('userType', '==', 'STUDENT'));
    
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || ''
      }));
      setStudentsList(students);
    });
  
    const facultyCollectionRef = collection(db, 'student');
    const facultyQuery = firestoreQuery(facultyCollectionRef, firestoreWhere('userType', '==', 'FACULTY'));
    
    const unsubscribeFaculty = onSnapshot(facultyQuery, (snapshot) => {
      const faculty = snapshot.docs.map((doc) => ({
        id: doc.id,
        fullName: doc.data().fullName || '',
        status: doc.data().status || 'OFFLINE'
      }));
      setFacultyList(faculty);
    });
  
    const concernDoc = doc(db, 'admin', 'concern');
    const unsubscribeConcerns = onSnapshot(concernDoc, (doc) => {
      if (doc.exists()) {
        const concerns = doc.data().concern || [];
        setConcernsList(concerns);
      }
    });
  
    if (selectedStudent) {
      const studentRef = doc(db, 'student', selectedStudent);
      const userUnsubscribe = onSnapshot(studentRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          console.log("User Data: ", userData);  // Log the user data
          if (userData.status === 'waiting') {
            setIsRequested(true);
          } else {
            setIsRequested(false);
          }
          setUserTicketNumber(userData.userTicketNumber);
        }
        setIsCheckingRequest(false);
      });
  
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketUnsubscribe = onSnapshot(ticketRef, (doc) => {
        if (doc.exists()) {
          console.log("Ticket Number Data: ", doc.data());  // Log ticket data
          setTicketNumber(doc.data().ticketNum);
        }
      });
  
      return () => {
        userUnsubscribe();
        ticketUnsubscribe();
        unsubscribeFaculty();
        unsubscribeStudents();
        unsubscribeConcerns();
      };
    } else {
      setIsCheckingRequest(false);
    }
  
  }, [selectedStudent]); // Add selectedStudent as a dependency

  const handleRequest = async () => {
    console.log("Request initiated with faculty: ", selectedFaculty, " and concern: ", selectedConcern, " other concern: ", otherConcern);
  
    if (!selectedFaculty || !selectedStudent || (!selectedConcern && !otherConcern)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const selectedFacultyData = facultyList.find(f => f.fullName === selectedFaculty);
    if (selectedFacultyData?.status !== 'ONLINE') {
      console.log('Error', 'Selected faculty is not online');
      return;
    }
  
    setIsLoading(true);
    try {
      // First verify the selected student is a STUDENT
      const studentVerifyQuery = firestoreQuery(
        collection(db, 'student'),
        firestoreWhere('userType', '==', 'STUDENT')
      );

      const studentVerifySnapshot = await getDocs(studentVerifyQuery);
      const isStudent = studentVerifySnapshot.docs.some(doc => doc.id === selectedStudent);

      if (!isStudent) {
        Alert.alert('Error', 'Selected user is not a student');
        return;
      }
  
      // Get queue position for waiting STUDENTS only
      const queueQuery = firestoreQuery(
        collection(db, 'student'),
        firestoreWhere('userType', '==', 'STUDENT'),
        firestoreWhere('faculty', '==', selectedFaculty),
        firestoreWhere('status', '==', 'waiting')
      );
      
      const queueSnapshot = await getDocs(queueQuery);
      const queuePosition = queueSnapshot.size + 1;
  
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
  
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;
  
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
  
        const studentRef = doc(db, 'student', selectedStudent);
        await updateDoc(studentRef, {
          userTicketNumber: newNumber,
          faculty: selectedFaculty,
          concern: selectedConcern,
          otherConcern: otherConcern,
          requestDate: new Date(),
          status: 'waiting',
          queuePosition: queuePosition
        });
  
        setTicketNumber(newNumber);
        setIsRequested(true);
        Alert.alert('Success', `Queue position: ${queuePosition}`);
      }
    } catch (error) {
      console.log('Error updating queue:', error);
      Alert.alert('Error', 'Failed to join queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    try {
      console.log("Starting cancel queue for selected student:", selectedStudent);
      
      const studentsCollectionRef = collection(db, 'student');
      const studentRef = doc(db, 'student', selectedStudent);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        console.log("Student data found:", studentData);
        
        if (studentData.userType === 'STUDENT') {
          await updateDoc(studentRef, {
            status: 'cancelled',
            userTicketNumber: null,
            faculty: null,
            concern: null,
            otherConcern: null,
            requestDate: null,
            queuePosition: null
          });
  
          setIsRequested(false);
          setSelectedFaculty('');
          setSelectedConcern('');
          setOtherConcern('');
          setUserTicketNumber('');
  
          Alert.alert('Success', 'Queue cancelled successfully');
        } else {
          Alert.alert('Error', 'Only student queues can be cancelled');
        }
      } else {
        Alert.alert('Error', 'Could not find student');
      }
    } catch (error) {
      console.error('Error in cancel queue:', error);
      Alert.alert('Error', 'Failed to cancel the queue');
    }
  };
  

  
  const handleCancel = () => {
    console.log("Cancel button pressed, closing the modal.");
    onClose(); // Close the modal by calling the onClose function passed via props
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ADD QUEUE</Text>
      {isCheckingRequest ? (
        <ActivityIndicator size="large" color="#004000" />
      ) : (
        isRequested ? (
          <View style={[styles.ticketContainer, {width: '100%'}]}>
            <Text style={[styles.subHeaderText, {fontWeight: 'bold'}]}>
              People in front of you: {peopleAhead}
            </Text>
            <View style={styles.ticketDetails}>
              <Text style={[styles.ticketLabel, { color: '#d9ab0e', fontWeight: 'bold', fontSize: 22}]}>
                YOUR TICKET NUMBER
              </Text>
              <Text style={[styles.ticketNumber, { fontSize: 25, marginBottom: 20}]}>
                {`${userProgram}-${String(userTicketNumber).padStart(4, '0')}`}
              </Text>
              <View style={styles.ticketInfoContainer}>
                <View>
                  <Text style={[styles.ticketLabel, { color: '#000000', fontWeight: 'bold', fontSize: 16 }]}>
                    NEXT SERVING
                  </Text>
                  <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                    {nextDisplayedTicket 
                      ? `${nextDisplayedProgram}-${String(nextDisplayedTicket).padStart(4, '0')}`
                      : 'No Next Ticket'
                    }
                  </Text>
                </View>
                <View>
                  <Text style={[styles.ticketLabel, { color: '#000000', fontWeight: 'bold', fontSize: 16 }]}>
                    NOW SERVING
                  </Text>
                  <Text style={[styles.ticketInfo, {fontSize: 20}]}>
                    {currentDisplayedTicket
                      ? `${currentDisplayedProgram}-${String(currentDisplayedTicket).padStart(4, '0')}`
                      : 'No ticket displayed'
                    }
                  </Text>
                </View>
              </View>
              <Text style={[styles.waitText, { marginTop: 30, marginBottom: -10, fontSize: 23}]}>
                {userTicketNumber === currentDisplayedTicket ? "YOUR TURN" : "PLEASE WAIT"}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Button title="CANCEL" onPress={handleCancelQueue} color="#c8c4c4" />
            </View>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStudent}
                onValueChange={(itemValue) => {
                  setSelectedStudent(itemValue);
                }}
                style={[styles.picker, { color: '#ccc' }]}
              >
                <Picker.Item label="Select Student" value="" color="#fff" />
                {studentsList
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((student) => (
                    <Picker.Item 
                      key={student.id}
                      label={student.fullName}
                      value={student.id}
                      color="#fff"
                    />
                  ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedFaculty}
                onValueChange={(itemValue) => setSelectedFaculty(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Faculty" value="" />
                {facultyList
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((faculty) => (
                    <Picker.Item 
                      key={faculty.id}
                      label={faculty.fullName}
                      value={faculty.fullName}
                      color={faculty.status === 'ONLINE' ? '#4CAF50' : '#757575'}
                    />
                  ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedConcern}
              onValueChange={(itemValue) => setSelectedConcern(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Concern" value="" />
              {concernsList.length > 0 ? (
                concernsList.map((concern, index) => (
                  <Picker.Item key={index} label={concern} value={concern} />
                ))
              ) : (
                <Picker.Item label="No concerns available" value="" />
              )}
            </Picker>
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.requestButton} onPress={handleRequest}>
                <Text style={styles.buttonText}>Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d3310",
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'justify',
    width: '100%',
  },
  ticketContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#f3f3f3',
    marginBottom: 20,
  },
  subHeaderText: {
    color: '#f3f3f3',
  },
  ticketDetails: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ticketLabel: {
    color: '#f3f3f3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ticketNumber: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ticketInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
  },
  ticketInfo: {
    color: '#f3f3f3',
    fontSize: 18,
  },
  waitText: {
    color: '#f3f3f3',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  formGroup: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  pickerContainer: {
    width: "100%",
    height: 50,
    backgroundColor: "#2e4f2e",
    borderRadius: 5,
    justifyContent: "center",
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    borderColor: "#2e4f2e",
    backgroundColor: "#2e4f2e",
    color: "#fff",
    width: "100%",
    fontSize: 16,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Ensures equal space between the buttons
    width: '100%',
    marginTop: 20,
  },
  requestButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 12,
    width: '48%', // Adjust width if necessary
  },
  closeButton: {
    backgroundColor: '#FF5C5C',
    paddingVertical: 12,
    borderRadius: 5,
    width: '48%', // Adjust width if necessary
    alignItems: 'center',
  },
});

export default AddQueue;


//const userUnsubscribe = onSnapshot(userRef, (doc) => {
 // if (doc.exists()) {
  //  const userData = doc.data();
  //  if (userData.status === 'waiting') {
   //   setIsRequested(true);
   // } else {
   //   setIsRequested(false);  // This triggers when status changes to 'cancelled'
    //}
  //  setUserTicketNumber(userData.userTicketNumber);
//  }
//  setIsCheckingRequest(false);
//});