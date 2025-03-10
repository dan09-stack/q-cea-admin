import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity, Platform, ScrollView } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '@/firebaseConfig';
import { collection, CollectionReference, doc, DocumentData, getDoc, getDocs, onSnapshot, updateDoc, QueryConstraint,
  WhereFilterOp, 
  orderBy,
  
  limit,
  writeBatch,
  query,
  where,
  increment} from 'firebase/firestore';
import { Query, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { query as firestoreQuery, where as firestoreWhere } from 'firebase/firestore';

const AddQueue: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [showPriorityModal, setShowPriorityModal] = useState(false);
const [priorityName, setPriorityName] = useState('');
const [priorityId, setPriorityId] = useState('');
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
  const [specificDetails, setSpecificDetails] = useState("");
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
  // Add this function to check if current time is after hours
  const isAfterHours = (): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    // After hours is between 6:00 PM (18) and 5:00 AM (5)
    return currentHour >= 18 || currentHour < 5;
  };
  
  // Add this function to automatically cancel queues during after hours
  const checkAndCancelAfterHoursQueues = async () => {
    if (isAfterHours()) {
      console.log("After hours detected - cancelling all queues");
      try {
        const studentsCollectionRef = collection(db, 'student');
        const waitingStudentsQuery = firestoreQuery(
          studentsCollectionRef, 
          firestoreWhere('status', '==', 'waiting')
        );
        
        // Get faculty status for reference
        const facultyQuery = firestoreQuery(
          studentsCollectionRef,
          firestoreWhere('userType', '==', 'FACULTY')
        );
        
        const facultySnapshot = await getDocs(facultyQuery);
        const batch = writeBatch(db);
        
        if (!facultySnapshot.empty) {
          facultySnapshot.docs.forEach((docSnapshot: DocumentSnapshot) => {
            const facultyRef = doc(db, 'student', docSnapshot.id);
            batch.update(facultyRef, {
              status: 'OFFLINE'
            });
          });
        }
        
        // If there are no waiting students, no need to proceed
        const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);
        if (waitingStudentsSnapshot.empty) {
          console.log("No active queues to cancel");
          await batch.commit();
          return;
        }
        
        await handleCancelAllQueues();
        console.log("Successfully cancelled all queues due to after hours");
      } catch (error) {
        console.error('Error in automatic queue cancellation:', error);
      }
    }
  };
  
  // Add this useEffect to check time periodically
  // useEffect(() => {
  //   // Check immediately when component mounts
  //   checkAndCancelAfterHoursQueues();
    
  //   // Set up interval to check every minute
  //   const intervalId = setInterval(checkAndCancelAfterHoursQueues, 60000);
    
  //   // Clean up interval on component unmount
  //   return () => clearInterval(intervalId);
  // }, []);


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
  
        const facultyQuery = query(
          collection(db, 'student'),
          where('fullName', '==', selectedFaculty),
          where('userType', '==', 'FACULTY')
        );
        
        const facultySnapshot = await getDocs(facultyQuery);
        if (!facultySnapshot.empty) {
          const facultyDoc = facultySnapshot.docs[0];
          const facultyData = facultyDoc.data();
          
          // If queue is empty, send notification to faculty
          if (facultyData.numOnQueue === 0) {
            // await sendNotificationToFaculty(facultyData.phoneNumber);
            // await sendEmailNotification(
            //   'template_jbfj8p6',
            //   facultyData.email,
            //   facultyData.fullName
            // );
          }
          
          await updateDoc(doc(db, 'student', facultyDoc.id), {
            numOnQueue: increment(1)
          });
        }
  
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
        
        const facultyQuery = query(
          collection(db, 'student'),
          where('fullName', '==', selectedFaculty),
          where('userType', '==', 'FACULTY')
        );
        
        const facultySnapshot = await getDocs(facultyQuery);
        if (!facultySnapshot.empty) {
          const facultyDoc = facultySnapshot.docs[0];
          
          await updateDoc(doc(db, 'student', facultyDoc.id), {
            numOnQueue: increment(-1)
          });
        }
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
          style={[styles.closeButton,{width: 100}]}
          onPress={() => setShowTicketOverview(false)}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableSubHeader}>
        <Text style={[styles.headerCell, { flex: 1 }]}>Ticket #</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Student</Text>
        
      </View>
      <View style={{ height: 2, backgroundColor: 'black' }} />
      <ScrollView style={styles.scrollableContent}>
        {allFacultyTickets
        .filter(facultyData => facultyData.tickets.length > 0)
        .map((facultyData, index) => (
          <View key={index} style={styles.tableSection}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>{facultyData.faculty}</Text>
            </View>
  
            {facultyData.tickets.map((ticket, ticketIndex) => (
              <View key={ticketIndex} style={[styles.tableRow, { justifyContent: 'space-between' }]}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', flex: 1 }}
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
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={async () => {
                    try {
                      // Find the student document by name
                      const studentsQuery = firestoreQuery(
                        collection(db, 'student'),
                        firestoreWhere('fullName', '==', ticket.studentName),
                        firestoreWhere('userTicketNumber', '==', ticket.ticketNumber)
                      );
                      const facultyQuery = query(
                        collection(db, 'student'),
                        where('fullName', '==', selectedFaculty),
                        where('userType', '==', 'FACULTY')
                      );
                      
                      const facultySnapshot = await getDocs(facultyQuery);
                      if (!facultySnapshot.empty) {
                        const facultyDoc = facultySnapshot.docs[0];
                        
                        await updateDoc(doc(db, 'student', facultyDoc.id), {
                          numOnQueue: increment(-1)
                        });
                      }
                      const studentSnapshot = await getDocs(studentsQuery);
                      if (!studentSnapshot.empty) {
                        const studentDoc = studentSnapshot.docs[0];
                        await updateDoc(doc(db, 'student', studentDoc.id), {
                          status: 'cancelled',
                          userTicketNumber: null,
                          faculty: null,
                          concern: null,
                          otherConcern: null,
                          requestDate: null,
                          queuePosition: null
                        });
                        Alert.alert('Success', 'Queue cancelled successfully');
                      } else {
                        Alert.alert('Error', 'Could not find student');
                      }
                    } catch (error) {
                      console.error('Error cancelling queue:', error);
                      Alert.alert('Error', 'Failed to cancel the queue');
                    }
                  }}
                >
                  <Text style={styles.cancelButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
  

  return (
    <View style={styles.container}>
      {/* Render TicketOverview if showTicketOverview is true */}
      {showTicketOverview ? (
        <TicketOverview />
      ) : (
        <>
         <View style={styles.headerContainer}>
            <Text style={styles.title}>ADD QUEUE</Text>
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={styles.viewTicketsButton}
                onPress={() => setShowTicketOverview(true)}
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
  
          {isCheckingRequest ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loaderText}>Checking request status...</Text>
            </View>
          ) : (
            isRequested ? (
              <View style={styles.ticketContainerCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.queuePositionText}>
                    People in front of you: <Text style={styles.highlightText}>{peopleAhead}</Text>
                  </Text>
                </View>
                <View style={styles.ticketDetails}>
                  <Text style={styles.ticketLabelLarge}>
                    YOUR TICKET NUMBER
                  </Text>
                  <Text style={styles.ticketNumber}>
                    {`${userProgram}-${String(userTicketNumber).padStart(4, '0')}`}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusBox}>
                      <Text style={styles.statusLabel}>NEXT SERVING</Text>
                      <Text style={styles.statusValue}>
                        {nextDisplayedTicket 
                          ? `${nextDisplayedProgram}-${String(nextDisplayedTicket).padStart(4, '0')}`
                          : 'No Next Ticket'
                        }
                      </Text>
                    </View>
                    <View style={styles.statusBox}>
                      <Text style={styles.statusLabel}>NOW SERVING</Text>
                      <Text style={styles.statusValue}>
                        {currentDisplayedTicket
                          ? `${currentDisplayedProgram}-${String(currentDisplayedTicket).padStart(4, '0')}`
                          : 'No ticket displayed'
                        }
                      </Text>
                    </View>
                  </View>
                  <View style={styles.turnIndicator}>
                    <Text style={userTicketNumber === currentDisplayedTicket ? styles.yourTurnText : styles.waitText}>
                      {userTicketNumber === currentDisplayedTicket ? "YOUR TURN" : "PLEASE WAIT"}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelQueueButton} 
                    onPress={handleCancelQueue}
                  >
                    <Text style={styles.buttonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.queueAgainButton} 
                    onPress={AddMoreQueue}
                  >
                    <Text style={styles.buttonText}>QUEUE AGAIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedStudent}
                    onValueChange={(itemValue) => {
                      setSelectedStudent(itemValue);
                    }}
                    style={[styles.picker, { color: 'black' }]}
                  >
                    <Picker.Item label="Select Student" value="" color="black" />
                    {studentsList
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((student) => (
                        <Picker.Item 
                          key={student.id}
                          label={student.fullName}
                          value={student.id}
                          color="black"
                        />
                      ))}
                  </Picker>
                </View>
                
                <Text style={styles.formLabel}>Faculty</Text>
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
                
                <Text style={styles.formLabel}>Concern</Text>
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

                {/* Add this conditional rendering for Other Concern */}
                {selectedConcern === "Other" && (
                  <>
                    <Text style={styles.formLabel}>Specify Other Concern</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Please specify your concern"
                      placeholderTextColor="#aaa"
                      value={otherConcern}
                      onChangeText={setOtherConcern}
                    />
                  </>
                )}

                <Text style={styles.formLabel}>Specific Details</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter specific details about the concern"
                  placeholderTextColor="#aaa"
                  value={specificDetails}
                  onChangeText={setSpecificDetails}
                  multiline={true}
                  numberOfLines={3}
                />
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={styles.requestButton} 
                    onPress={handleRequest}
                  >
                    <Text style={styles.buttonText}>ADD TO QUEUE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleCancel}
                  >
                    <Text style={styles.buttonText}>CANCEL</Text>
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
  textInput: {
    backgroundColor: "#2e4f2e",
    borderRadius: 5,
    marginBottom: 20,
    padding: 12,
    color: "white",
    borderWidth: 1,
    borderColor: '#3e6f3e',
    textAlignVertical: 'top',
    minHeight: 20,
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgb(50, 41, 41)',
    padding: 5,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: "#0d3310",
    padding: 20,
    borderRadius: 8,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: 'black',
    marginTop: 10,
    fontSize: 16,
  },
  formGroup: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  formLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: "#2e4f2e",
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#3e6f3e',
  },
  picker: {
    color: "black",
    width: "100%",
    height: 50,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  requestButton: {
    backgroundColor: '#1E8449',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: 'rgb(45, 43, 43)',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: .2,
  },
  ticketContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ticketHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 15,
    marginBottom: 15,
  },
  queuePositionText: {
    fontSize: 16,
    color: '#555555',
    fontWeight: '600',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#1E8449',
  },
  ticketDetails: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ticketLabelLarge: {
    color: '#d9ab0e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ticketNumber: {
    color: '#333333',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
  },
  statusBox: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  statusLabel: {
    color: '#555555',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusValue: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  turnIndicator: {
    marginTop: 20,
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  yourTurnText: {
    color: '#1E8449',
    fontSize: 20,
    fontWeight: 'bold',
  },
  waitText: {
    color: '#07643d',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelQueueButton: {
    backgroundColor: '#808080',
    borderRadius: 5,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  queueAgainButton: {
    backgroundColor: '#1E8449',
    borderRadius: 5,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  // Add these additional styles needed for TicketOverview
  scrollableContent: {
    flex: 1,
    width: '100%',
    maxHeight: '75%',
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
    marginBottom: 20,
    color: '#333'
  },
  tableSection: {
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  tableHeader: {
    backgroundColor: '#1E8449',
    padding: 12,
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
  DualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default AddQueue;