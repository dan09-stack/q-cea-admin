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
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc, setDoc, increment } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface AddQueueVisitorProps {
  onClose: () => void;
}

const AddQueueVisitor: React.FC<AddQueueVisitorProps> = ({ onClose }) => {
  const [visitorName, setVisitorName] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [otherConcern, setOtherConcern] = useState("");
  const [facultyList, setFacultyList] = useState<Array<{id: string, fullName: string, status: string, numOnQueue?: number}>>([]);
  const [concernsList, setConcernsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  };

  // Fetch faculty list
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
  
    if (!selectedFaculty) {
      showAlert("Please select a faculty member");
      return;
    }
  
    if (!selectedConcern) {
      showAlert("Please select a concern");
      return;
    }
  
    const concern = selectedConcern === "Other" ? otherConcern : selectedConcern;
    if (selectedConcern === "Other" && !otherConcern.trim()) {
      showAlert("Please specify your concern");
      return;
    }
  
    // Check if selected faculty is online
    const selectedFacultyData = facultyList.find(faculty => faculty.id === selectedFaculty);
    if (selectedFacultyData?.status !== 'ONLINE') {
      showAlert("The faculty is currently unavailable. Your request has been cancelled.");
      return;
    }
  
    setIsLoading(true);
    try {
      // Get ticket number from ticketNumberCounter collection
      const ticketRef = doc(db, 'ticketNumberCounter', 'ticket');
      const ticketSnap = await getDoc(ticketRef);
      
      let newTicketNum;
      
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum;
        const newNumber = currentNumber + 1;
        
        // Update the ticket counter
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
        
        newTicketNum = `${newNumber}`;
      } else {
        // If document doesn't exist, create it with initial value
        const initialNumber = 1;
        await setDoc(ticketRef, { ticketNum: initialNumber });
        newTicketNum = `${initialNumber}`;
      }
      
      setTicketNumber(newTicketNum);
  
      // Add to queue collection
      await addDoc(collection(db, "student"), {
        fullName: visitorName,
        faculty: selectedFaculty,
        facultyName: selectedFacultyData?.fullName,
        concern: concern,
        timestamp: serverTimestamp(),
        status: "waiting",
        userTicketNumber: newTicketNum,
        program: "VST",
        userType: "STUDENT",
        type: "visitor"
      });
  
      // Increment numOnQueue for faculty and possibly send notification
      const facultyRef = doc(db, "student", selectedFaculty);
      const facultyData = (await getDoc(facultyRef)).data();
      
      // If this is the first person in queue, consider sending notification like in the reference code
      if (facultyData && facultyData.numOnQueue === 0) {
        // If you have notification functions, you could call them here
        // sendNotificationToFaculty(facultyData.phoneNumber);
        // sendEmailNotification('template_jbfj8p6', facultyData.email, facultyData.fullName);
      }
      
      await updateDoc(facultyRef, {
        numOnQueue: increment(1)
      });
  
      showAlert(`Queue added successfully! Your ticket number is ${newTicketNum}`);
      onClose();
    } catch (error) {
      console.error("Error adding queue:", error);
      showAlert("Failed to add to queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Add Visitor to Queue</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
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
            selectedValue={selectedFaculty}
            onValueChange={(itemValue) => setSelectedFaculty(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Faculty" value="" />
            {facultyList.map((faculty) => (
              <Picker.Item
                key={faculty.id}
                label={faculty.fullName}
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
