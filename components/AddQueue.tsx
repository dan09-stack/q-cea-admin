import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';

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

  useEffect(() => {
    const currentUser = auth.currentUser;
    setIsCheckingRequest(true);

    const studentsCollectionRef = collection(db, 'student');
    const unsubscribeStudents = onSnapshot(studentsCollectionRef, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || ''
      }));
      console.log("Students List: ", students);  // Log the students data
      setStudentsList(students);
    });

    const facultyCollectionRef = collection(db, 'faculty');
    const unsubscribeFaculty = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || '',
        status: doc.data().status || 'OFFLINE'
      }));
      console.log("Faculty List: ", faculty);  // Log the faculty data
      setFacultyList(faculty);
    });

    if (currentUser) {
      const userRef = doc(db, 'student', currentUser.uid);
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
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
        unsubscribeFaculty();
        ticketUnsubscribe();
        unsubscribeStudents();
      };
    } else {
      setIsCheckingRequest(false);
    }

    return () => unsubscribeFaculty();
  }, []);

  const handleRequest = async () => {
    console.log("Request initiated with faculty: ", selectedFaculty, " and concern: ", selectedConcern, " other concern: ", otherConcern);  // Log request details

    if (!selectedFaculty) {
      Alert.alert('Error', 'Please select a faculty');
      return;
    }

    if (!selectedConcern && !otherConcern) {
      Alert.alert('Error', 'Please select a concern or provide details in the Other field');
      return;
    }

    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;

        console.log("New ticket number: ", newNumber);  // Log new ticket number

        // Update the ticket number counter
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });

        const userRef = doc(db, 'student', currentUser.uid);
        await updateDoc(userRef, {
          userTicketNumber: newNumber,
          faculty: selectedFaculty,
          concern: selectedConcern,
          otherConcern: otherConcern,
          requestDate: new Date(),
          status: 'waiting'
        });

        setTicketNumber(newNumber);
        setIsRequested(true);

        // Now, update the status of the selected student
        console.log("Updating status of selected student: ", selectedStudent);  // Log the student ID
        const studentRef = doc(db, 'student', selectedStudent);
        await updateDoc(studentRef, {
          status: 'waiting'
        });
        Alert.alert('Success', 'Student status updated to waiting');
      }
    } catch (error) {
      console.log('Error updating ticket number:', error);  // Log any errors
      Alert.alert('Error', 'Failed to create ticket request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    try {
      // Get all students who are in 'waiting' status
      const studentsCollectionRef = collection(db, 'student');
      const querySnapshot = await getDocs(studentsCollectionRef);
      
      // Find the student with matching ticket number
      const studentToCancel = querySnapshot.docs.find(doc => 
        doc.data().userTicketNumber === userTicketNumber
      );
  
      if (!studentToCancel) {
        Alert.alert('Error', 'Could not find student ticket');
        return;
      }
  
      // Update the student's record
      const studentRef = doc(db, 'student', studentToCancel.id);
      await updateDoc(studentRef, {
        status: 'cancelled',
        userTicketNumber: null,
        faculty: null,
        concern: null,
        otherConcern: null,
        requestDate: null
      });
  
      // Reset local state
      setIsRequested(false);
      setSelectedFaculty('');
      setSelectedConcern('');
      setOtherConcern('');
      setUserTicketNumber('');
  
      Alert.alert('Success', 'Queue cancelled successfully');
    } catch (error) {
      console.error('Error cancelling queue:', error);
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
          <View style={styles.ticketContainer}>
            <Text style={styles.headerText}>{ticketNumber}</Text>
            <Text style={styles.subHeaderText}>People in front of you: 2</Text>
            <View style={styles.ticketDetails}>
              <Text style={styles.ticketLabel}>YOUR TICKET NUMBER</Text>
              <Text style={styles.ticketNumber}>{`CPE-${String(userTicketNumber).padStart(4, '0')}`}</Text>
              <View style={styles.ticketInfoContainer}>
                <View>
                  <Text style={styles.ticketLabel}>NEXT SERVING</Text>
                  <Text style={styles.ticketInfo}>ECE-0009</Text>
                </View>
                <View>
                  <Text style={styles.ticketLabel}>NOW SERVING</Text>
                  <Text style={styles.ticketInfo}>ARC-0008</Text>
                </View>
              </View>
              <Text style={styles.waitText}>PLEASE WAIT</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancelQueue}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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
                <Picker.Item label="Grades" value="Grades" />
                <Picker.Item label="Enrolment" value="Enrolment" />
                <Picker.Item label="Others" value="Other" />
              </Picker>
            </View>
            {selectedConcern === 'Others' && (
              <TextInput
                style={styles.input}
                placeholder="Describe your concern"
                placeholderTextColor="#aaa"
                value={otherConcern}
                onChangeText={setOtherConcern}
              />
            )}
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
