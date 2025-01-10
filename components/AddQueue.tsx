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
      setStudentsList(students);
    });

    const facultyCollectionRef = collection(db, 'faculty');
    const unsubscribeFaculty = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty = snapshot.docs.map(doc => ({
        id: doc.id,
        fullName: doc.data().fullName || '',
        status: doc.data().status || 'OFFLINE'
      }));
      setFacultyList(faculty);
    });

    if (currentUser) {
      const userRef = doc(db, 'student', currentUser.uid);
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
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
    if (!selectedFaculty) {
      Alert.alert('Error', 'Please select a faculty');
      return;
    }

    if (!selectedConcern && !otherConcern) {
      Alert.alert('Error', 'Please select a concern or provide details in Other field');
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
      }
    } catch (error) {
      console.log('Error updating ticket number:', error);
      Alert.alert('Error', 'Failed to create ticket request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'student', currentUser.uid);
        await updateDoc(userRef, {
          status: 'cancelled',
          userTicketNumber: null
        });
      }
      setIsRequested(false);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      Alert.alert('Error', 'Failed to cancel ticket');
    }
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
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStudent}
                onValueChange={(itemValue) => setSelectedStudent(itemValue)}
                style={[styles.picker, { color: '#fff' }]}
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
                style={[styles.picker, { color: '#fff' }]}
              >
                <Picker.Item label="Select your concern" value="" color="#fff" />
                <Picker.Item label="Concern A" value="concernA" color="#fff" />
                <Picker.Item label="Concern B" value="concernB" color="#fff" />
              </Picker>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Other concern:"
              placeholderTextColor="#ccc"
              value={otherConcern}
              onChangeText={(text) => setOtherConcern(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleRequest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Request</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
    textAlign: 'justify',  // Add this line to justify the title text
    width: '100%'  // Ensure it takes up the full width to apply the justification
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#fff',
  },
  ticketContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketDetails: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ticketLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  ticketNumber: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  ticketInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  ticketInfo: {
    fontSize: 18,
    color: '#fff',
  },
  waitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginVertical: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: "#2e4f2e",
    color: '#fff',
    
  },
  input: {
    height: 100,
    backgroundColor: "#2e4f2e",
    color: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',  // This makes the buttons appear side by side
    justifyContent: 'space-between',  // This ensures there is space between the buttons
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#004000',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    flex: 1,  // Ensures the button takes up equal space
    marginRight: 10,  // Adds space between the buttons
  },
  closeButton: {
    backgroundColor: '#757575',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    flex: 1,  // Ensures the button takes up equal space
  },
});

export default AddQueue;
