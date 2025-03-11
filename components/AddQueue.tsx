import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity, Platform } from "react-native";
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
  // ticket overview list
  const [showTicketOverview, setShowTicketOverview] = useState(false);
  const [allFacultyTickets, setAllFacultyTickets] = useState<Array<{
    faculty: string,
    tickets: Array<{
      ticketNumber: number,
      program: string,
      studentName: string,
      status: string
    }>
  }>>([]);

const showAlert = (message: string) => {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert(message);
  }
};
// ticket queue postions display
useEffect(() => {
  if (!selectedStudent) return;

  const studentRef = doc(db, 'student', selectedStudent);
  const unsubscribe = onSnapshot(studentRef, (doc) => {
    if (doc.exists()) {
      const studentData = doc.data();
      const studentFaculty = studentData.faculty;

      if (studentFaculty) {
        // Get current displayed ticket from faculty
        const facultyQuery = firestoreQuery(
          collection(db, 'student'),
          firestoreWhere('userType', '==', 'FACULTY'),
          firestoreWhere('fullName', '==', studentFaculty)
        );

        onSnapshot(facultyQuery, async (snapshot) => {
          if (!snapshot.empty) {
            const facultyData = snapshot.docs[0].data();
            const displayedTicket = facultyData.displayedTicket;
        
            // Get current ticket's program
            const currentTicketQuery = firestoreQuery(
              collection(db, 'student'),
              firestoreWhere('userTicketNumber', '==', displayedTicket)
            );
            const currentTicketSnapshot = await getDocs(currentTicketQuery);
            if (!currentTicketSnapshot.empty) {
              setCurrentDisplayedProgram(currentTicketSnapshot.docs[0].data().program);
            }
            setCurrentDisplayedTicket(displayedTicket || '');
            
            // Get next ticket
            const nextTicketQuery = firestoreQuery(
              collection(db, 'student'),
              firestoreWhere('faculty', '==', studentFaculty),
              firestoreWhere('status', '==', 'waiting'),
              firestoreWhere('userTicketNumber', '>', facultyData.displayedTicket),
              orderBy('userTicketNumber', 'asc'),
              limit(1)
            );

            onSnapshot(nextTicketQuery, (nextSnapshot) => {
              if (!nextSnapshot.empty) {
                const nextTicket = nextSnapshot.docs[0].data();
                setNextDisplayedTicket(nextTicket.userTicketNumber);
                setNextDisplayedProgram(nextTicket.program);
              }
            });
          }
        });
      }
    }
  });

  return () => unsubscribe();
}, [selectedStudent]);
  
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

  useEffect(() => {
    if (!selectedStudent) return;
  
    const studentRef = doc(db, 'student', selectedStudent);
    const unsubscribe = onSnapshot(studentRef, (doc) => {
      if (doc.exists()) {
        const studentData = doc.data();
        const studentFaculty = studentData.faculty;
  
        if (studentFaculty) {
          const queueQuery = firestoreQuery(
            collection(db, 'student'),
            firestoreWhere('faculty', '==', studentFaculty),
            firestoreWhere('status', '==', 'waiting'),
            firestoreWhere('userTicketNumber', '>', Number(currentDisplayedTicket)),
            firestoreWhere('userTicketNumber', '<', Number(userTicketNumber))
          );
  
          onSnapshot(queueQuery, (snapshot) => {
            setPeopleAhead(snapshot.size);
          });
        }
      }
    });
  
    return () => unsubscribe();
  }, [selectedStudent, currentDisplayedTicket, userTicketNumber]);

  const handleRequest = async () => {
    console.log("Request initiated with faculty: ", selectedFaculty, " and concern: ", selectedConcern, " other concern: ", otherConcern);
  
    if (!selectedFaculty || !selectedStudent || (!selectedConcern && !otherConcern)) {
      showAlert('Please fill in all required fields');
      return;
    }

    const selectedFacultyData = facultyList.find(f => f.fullName === selectedFaculty);
    if (selectedFacultyData?.status !== 'ONLINE') {
      showAlert('Selected faculty is not online');
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

  const AddMoreQueue = async () => {
    try {
      setIsRequested(false);
      setSelectedFaculty('');
      setSelectedConcern('');
      setOtherConcern('');
    } catch (error) {
      console.error('Error adding more queue:', error);
      Alert.alert('Error', 'Failed to add more queue');
    }
  };

  
  const handleCancel = () => {
    console.log("Cancel button pressed, closing the modal.");
    onClose(); // Close the modal by calling the onClose function passed via props
  };

  useEffect(() => {
    const facultyQuery = firestoreQuery(
      collection(db, 'student'),
      firestoreWhere('userType', '==', 'FACULTY')
    );
  
    const unsubscribe = onSnapshot(facultyQuery, async (snapshot) => {
      const facultyData = await Promise.all(snapshot.docs.map(async (facultyDoc) => {
        const faculty = facultyDoc.data().fullName;
        
        const ticketsQuery = firestoreQuery(
          collection(db, 'student'),
          firestoreWhere('faculty', '==', faculty),
          firestoreWhere('status', '==', 'waiting'),
          orderBy('userTicketNumber', 'asc')
        );
        
        const ticketsUnsubscribe = onSnapshot(ticketsQuery, (ticketsSnapshot) => {
          const tickets = ticketsSnapshot.docs.map(doc => ({
            ticketNumber: doc.data().userTicketNumber,
            program: doc.data().program,
            studentName: doc.data().fullName,
            status: doc.data().status
          }));
  
          setAllFacultyTickets(prevState => {
            const newState = [...prevState];
            const facultyIndex = newState.findIndex(f => f.faculty === faculty);
            if (facultyIndex >= 0) {
              newState[facultyIndex].tickets = tickets; 
            } else {
              newState.push({ faculty, tickets });
            }
            return newState;
          });
        });
  
        return ticketsUnsubscribe;
      }));
    });
  
    return () => unsubscribe();
  }, []);

  const TicketOverview = () => (
    <View style={styles.overviewContainer}>
     <View style={styles.DualContainer}>
      <Text style={styles.overviewTitle}>All Faculty Queues</Text>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setShowTicketOverview(false)}
      >
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>

     </View>
     <View style={styles.tableSubHeader}>
          <Text style={[styles.headerCell, { flex: 1 }]}>Ticket #</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Student</Text>
        </View>
     {allFacultyTickets.map((facultyData, index) => (
     
     <View key={index} style={styles.tableSection}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>{facultyData.faculty}</Text>
        </View>

        {facultyData.tickets.map((ticket, ticketIndex) => (
          <TouchableOpacity
            key={ticketIndex}
            style={styles.tableRow}
            onPress={() => {
              setSelectedStudent(ticket.studentName);
              setShowTicketOverview(false);
            }}
          >
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {`${ticket.program}-${String(ticket.ticketNumber).padStart(4, '0')}`}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{ticket.studentName}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ))}
      
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Render TicketOverview if showTicketOverview is true */}
      {showTicketOverview ? (
        <TicketOverview />
      ) : (
        <>
        <View style = {styles.DualContainer}>
          <Text style={styles.title}>ADD QUEUE</Text>
          <TouchableOpacity 
            style={styles.overviewButton}
            onPress={() => setShowTicketOverview(true)}
          >
            <Text style={styles.buttonText}>View All Tickets</Text>
          </TouchableOpacity>
         </View>
  
          {isCheckingRequest ? (
            <ActivityIndicator size="large" color="#004000" />
          ) : (
            isRequested ? (
              <View style={[styles.ticketContainer, {
                width: '100%',
                backgroundColor: '#FFFFFF',  // Add white background
                padding: 20,                 // Add some padding
                borderRadius: 8,            // Optional: rounded corners       
              }]}>
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
                    <Button title="QUEUE AGAIN" onPress={AddMoreQueue} color="#004000" />
                  </View>
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
        </>
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
    color: '#555555',
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
    color: 'black',
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
    color: 'black',
    fontSize: 18,
  },
  waitText: {
    color: '#004000',
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
    justifyContent: 'space-evenly', 
    width: '100%',
    marginTop: 20,
  },
  DualContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', 
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  requestButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 8,
    width: '48%', // Adjust width if necessary
  },
  closeButton: {
    backgroundColor: '#FF5C5C',
    paddingVertical: 8,
    borderRadius: 5,
    width: '48%', // Adjust width if necessary
    alignItems: 'center',
  },
  overviewButton : {
    backgroundColor: 'green',
    paddingVertical: 8,
    borderRadius: 5,
    width: '15%', 
    alignItems: 'center',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '100%'
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  facultySection: {
    marginBottom: 20
  },
  facultyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  ticketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  miniTicket: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5
  },
  miniTicketText: {
    fontSize: 14
  },
  tableSection: {
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tableHeader: {
    backgroundColor: '#004000',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableSubHeader: {
    flexDirection: 'row',
    backgroundColor: 'black',
    padding: 10,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    padding: 10,
  },
  tableCell: {
    fontSize: 14,
  }
});

export default AddQueue;
