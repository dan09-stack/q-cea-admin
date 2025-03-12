import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc, setDoc, increment, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface AddQueueVisitorProps {
  onClose: () => void;
}

const AddQueueVisitor: React.FC<AddQueueVisitorProps> = ({ onClose }) => {
  const [visitorName, setVisitorName] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedFacultyName, setSelectedFacultyName] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [otherConcern, setOtherConcern] = useState("");
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string, numOnQueue?: number}>>([]);
  const [concernsList, setConcernsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [specificDetails, setSpecificDetails] = useState("");
  const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  };

  // Fetch faculty list
  useEffect(() => {
    const facultyRef = collection(db, "student");
    const q = query(facultyRef, where("userType", "==", "FACULTY"), where("status", "==", "ONLINE"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const faculty: Array<{id: string, fullName: string, status: string, numOnQueue?: number}> = [];
      querySnapshot.forEach((doc) => {
        faculty.push({
          id: doc.id,
          fullName: doc.data().fullName || "",
          status: doc.data().status || "OFFLINE",
          numOnQueue: doc.data().numOnQueue || 0,
        });
      });
      setFacultyList(faculty);
    });

    return () => unsubscribe();
  }, []);

  // Fetch concerns list
  useEffect(() => {
    // Common concerns
    const defaultConcerns = [
      "Academic Advising",
      "Course Registration",
      "Thesis Consultation",
      "Project Guidance",
      "Career Counseling",
      "Technical Support",
      "Other",
    ];
    setConcernsList(defaultConcerns);
  }, []);

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      showAlert("Please enter your name");
      return;
    }
    
    if (!selectedFacultyId) {
      showAlert("Please select a faculty member");
      return;
    }
    
    if (!selectedConcern && !otherConcern) {
      showAlert("Please select or specify your concern");
      return;
    }
  
    setIsLoading(true);
    try {
      // Get queue position for waiting visitors for this faculty
      const queueQuery = query(
        collection(db, 'student'),
        where('faculty', '==', selectedFacultyName),
        where('status', '==', 'waiting')
      );
      
      const queueSnapshot = await getDocs(queueQuery);
      const queuePosition = queueSnapshot.size + 1;
  
      // Get next ticket number
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
  
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum || 0;
        const newNumber = currentNumber + 1;
  
        // Update the ticket counter with the same field name as read
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
  
        // Create a new visitor queue entry
        await addDoc(collection(db, 'student'), {
          fullName: visitorName,
          faculty: selectedFacultyName, // Use the faculty name here
          concern: selectedConcern === "Other" ? otherConcern : selectedConcern,
          otherConcern: selectedConcern === "Other" ? otherConcern : "",
          requestDate: new Date(),
          status: 'waiting',
          queuePosition: queuePosition,
          userTicketNumber: newNumber,
          specificDetails: specificDetails,
          program: "VST",
          userType: "STUDENT",
        });
  
        // Update faculty's queue count directly by ID
        await updateDoc(doc(db, 'student', selectedFacultyId), {
          numOnQueue: increment(1)
        });
  
        setTicketNumber(newNumber.toString());
        showAlert(`Queue ticket created successfully. Your ticket number is ${newNumber} and your position in queue is ${queuePosition}.`);
        onClose(); // Close the form after successful submission
      } else {
        // If the ticket counter document doesn't exist, create it
        await setDoc(doc(db, 'ticketNumberCounter', 'ticket'), {
          ticketNum: 1
        });
        
        
        
        // Update faculty's queue count
        await updateDoc(doc(db, 'student', selectedFacultyId), {
          numOnQueue: increment(1)
        });
        
        setTicketNumber("1");
        showAlert(`Queue ticket created successfully. Your ticket number is 1 and your position in queue is ${queuePosition}.`);
        onClose();
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      showAlert('Failed to join queue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFacultyChange = (itemValue: string) => {
    setSelectedFacultyId(itemValue);
    const faculty = facultyList.find(f => f.id === itemValue);
    setSelectedFacultyName(faculty ? faculty.fullName : "");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Add Visitor to Queue</Text>
       
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Visitor Name</Text>
        <TextInput
          style={styles.input}
          value={visitorName}
          onChangeText={setVisitorName}
          placeholder="Enter your full name"
        />

        <Text style={styles.label}>Select Faculty</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFacultyId}
            onValueChange={handleFacultyChange}
            style={styles.picker}
          >
            <Picker.Item label="Select Faculty" value="" />
            {facultyList.map((faculty) => (
              <Picker.Item
                key={faculty.id}
                label={`${faculty.fullName} (Queue: ${faculty.numOnQueue})`}
                value={faculty.id}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Concern</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedConcern}
            onValueChange={(itemValue) => setSelectedConcern(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Concern" value="" />
            {concernsList.map((concern, index) => (
              <Picker.Item key={index} label={concern} value={concern} />
            ))}
          </Picker>
        </View>


        {selectedConcern === "Other" && (
          <TextInput
            style={styles.input}
            value={otherConcern}
            onChangeText={setOtherConcern}
            placeholder="Specify your concern"
          />
        )}

        <Text style={styles.label}>Specific Details</Text>
        <TextInput
          style={styles.input}
          value={specificDetails}
          onChangeText={setSpecificDetails}
          placeholder="Enter any specific details about your concern"
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  picker: {
    height: 45,
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddQueueVisitor;
