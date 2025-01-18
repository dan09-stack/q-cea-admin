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
      Alert.alert('Error', 'Please select a concern or provide details in the Other field');
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
                style={[styles.picker, { color: '#ccc' }]}
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
    textAlign: 'justify',
    width: '100%',
  },
  ticketContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  subHeaderText: {
    fontSize: 20,
    color: '#fff',
  },
  ticketDetails: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#005C12',
    borderRadius: 8,
    width: '100%',
  },
  ticketLabel: {
    fontSize: 14,
    color: '#fff',
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketInfo: {
    fontSize: 14,
    color: '#fff',
  },
  waitText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    padding: 10,
    marginTop: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  formGroup: {
    marginTop: 10,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    color: '#ccc',
    backgroundColor: '#1b5e20',
  },
  input: {
    height: 100,
    backgroundColor: '#1b5e20',
    color: '#fff',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#388E3C',
    padding: 10,
    width: '48%',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#757575',
    padding: 10,
    width: '48%',
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default AddQueue;
