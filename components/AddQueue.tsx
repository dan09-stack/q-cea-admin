import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity, Platform, ScrollView, Modal } from "react-native";
import { auth, db } from '@/firebaseConfig';
import { collection, CollectionReference, doc, DocumentData, getDoc, getDocs, onSnapshot, updateDoc, QueryConstraint,
  WhereFilterOp, 
  orderBy,
  limit,
  writeBatch,
  query,
  where,
  increment,
  setDoc} from 'firebase/firestore';
import { Query, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { query as firestoreQuery, where as firestoreWhere } from 'firebase/firestore';
import { useAppTheme } from "@/utils/theme";

interface AddQueueProps {
  onClose: () => void;
  showTicketOverview: boolean;
  setShowTicketOverview: React.Dispatch<React.SetStateAction<boolean>>;
} 

const AddQueue: React.FC<AddQueueProps> = ({ 
  onClose, 
  showTicketOverview, 
  setShowTicketOverview 
}) => {
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityName, setPriorityName] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [otherConcern, setOtherConcern] = useState('');
  const [isRequested, setIsRequested] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [userTicketNumber, setUserTicketNumber] = useState('');
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string, numOnQueue?: number}>>([]);
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
  const [specificDetails, setSpecificDetails] = useState("");
  
  // Modal visibility states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showConcernModal, setShowConcernModal] = useState(false);
  
  // All faculty tickets state
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

  // ticket queue positions display
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
    const studentsQuery = firestoreQuery(studentsCollectionRef, 
      firestoreWhere('userType', '==', 'STUDENT'),
      firestoreWhere('isVerified', '==', true)
      );
    
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || ''
      }));
      setStudentsList(students);
    });
  
    const facultyCollectionRef = collection(db, 'student');
    const facultyQuery = firestoreQuery(
      facultyCollectionRef, 
      firestoreWhere('userType', '==', 'FACULTY'),
      firestoreWhere('isVerified', '==', true) 
    );
    
    const unsubscribeFaculty = onSnapshot(facultyQuery, (snapshot) => {
      const faculty = snapshot.docs.map((doc) => ({
        id: doc.id,
        fullName: doc.data().fullName || '',
        status: doc.data().status || 'UNAVAILABLE',
        numOnQueue: doc.data().numOnQueue || 0 
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
  
  }, [selectedStudent]);

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
              status: 'UNAVAILABLE'
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

  const handleCancelAllQueues = async () => {
    try {
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
    if (selectedFacultyData?.status !== 'AVAILABLE') {
      showAlert('Selected faculty is UNAVAILABLE');
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
          queuePosition: queuePosition,
          specificDetails: specificDetails
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
      const handleSubmitRating = async () => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await setDoc(doc(db, 'ratings', `${currentUser.uid}_${Date.now()}`), {
              userId: currentUser.uid,
              faculty: selectedFaculty,  
              concern: selectedConcern,  
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error submitting rating:', error);
        }
      };
      handleSubmitRating();
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
            queuePosition: null,
            specificDetails: null
          });
  
          setIsRequested(false);
          setSelectedFaculty('');
          setSelectedConcern('');
          setOtherConcern('');
          setUserTicketNumber('');
          setSpecificDetails('');
  
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
      setSpecificDetails('');
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

  // Student Selection Modal Component
  const StudentSelectionModal = () => (
    <Modal
      visible={showStudentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowStudentModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Student</Text>
          <ScrollView style={styles.modalScrollView}>
            {studentsList
            
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedStudent(student.id);
                    setShowStudentModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedStudent === student.id && styles.selectedModalItem
                  ]}>
                    {student.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowStudentModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Faculty Selection Modal Component
  const FacultySelectionModal = () => (
    <Modal
      visible={showFacultyModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFacultyModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Faculty</Text>
          <ScrollView style={styles.modalScrollView}>
            {facultyList
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((faculty) => (
                <TouchableOpacity
                  key={faculty.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedFaculty(faculty.fullName);
                    setShowFacultyModal(false);
                  }}
                >
                  <View style={styles.facultyItemRow}>
                    <Text style={[
                      styles.modalItemText,
                      selectedFaculty === faculty.fullName && styles.selectedModalItem
                    ]}>
                      {faculty.fullName} 
                      { `(Queue: ${faculty.numOnQueue})`}
                    </Text>
                    <Text style={[
                      styles.statusText,
                      { color: faculty.status === 'AVAILABLE' ? '#4CAF50' : '#FF5252' }
                    ]}>
                      {faculty.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowFacultyModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  

  // Concern Selection Modal Component
  const ConcernSelectionModal = () => (
    <Modal
      visible={showConcernModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConcernModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Concern</Text>
          <ScrollView style={styles.modalScrollView}>
            {concernsList.length > 0 ? (
              concernsList.map((concern, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedConcern(concern);
                    setShowConcernModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedConcern === concern && styles.selectedModalItem
                  ]}>
                    {concern}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noItemsText}>No concerns available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowConcernModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
                        where('fullName', '==', facultyData.faculty),
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
  const { 
    colors, 
    getInputStyle, 
    getPlaceholderColor, 
    getButtonStyle, 
    getContainerStyle, 
    getTextStyle
  } = useAppTheme();

  // Get selected student name for display
  const getSelectedStudentName = () => {
    const student = studentsList.find(s => s.id === selectedStudent);
    return student ? student.fullName : "Select Student";
  };

  return (
    <View style={styles.container}>
      {/* Render modals */}
      <StudentSelectionModal />
      <FacultySelectionModal />
      <ConcernSelectionModal />

      {/* Render TicketOverview if showTicketOverview is true */}
      {showTicketOverview ? (
        <TicketOverview />
      ) : (
        <>
         <View style={styles.headerContainer}>
         <Text style={getTextStyle(styles.title, true)}>ADD QUEUE</Text>
            {/* <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={getButtonStyle(styles.viewTicketsButton)}
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
            </View> */}

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
                {/* Student Selection */}
                <Text style={styles.formLabel}>Student</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowStudentModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {getSelectedStudentName()}
                  </Text>
                </TouchableOpacity>
                
                {/* Faculty Selection */}
                <Text style={styles.formLabel}>Faculty</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowFacultyModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {selectedFaculty || "Select Faculty"}
                  </Text>
                </TouchableOpacity>
                
                {/* Concern Selection */}
                <Text style={styles.formLabel}>Concern</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowConcernModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {selectedConcern || "Select Concern"}
                  </Text>
                </TouchableOpacity>

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
                    style={getButtonStyle(styles.requestButton)} 
                    onPress={handleRequest}
                  >
                    <Text style={styles.buttonText}>ADD TO QUEUE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={getButtonStyle(styles.closeButton, true)} 
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
  facultyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: 5,
    marginBottom: 20,
    padding: 12,
    color: "black",
    borderWidth: 1,
    borderColor: '#ddd',
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
    margin: 20,
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    borderColor: '#800020',
    borderWidth: 1,
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
    color: '#000',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  formLabel: {
    color: '#000',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  // New styles for modal selection
  selectButton: {
    borderRadius: 5,
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    color: 'black',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  selectedModalItem: {
    fontWeight: 'bold',
    color: '#1E8449',
  },
  modalCloseButton: {
    backgroundColor: '#800020',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noItemsText: {
    textAlign: 'center',
    padding: 20,
    color: '#757575',
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
    backgroundColor: "#f9f9f9",
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
    backgroundColor: '#800020',
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
