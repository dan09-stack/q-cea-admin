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
  Modal,
  FlatList,
} from "react-native";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc, setDoc, increment, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAppTheme } from "@/utils/theme";

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
  
  // Modal visibility states
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showConcernModal, setShowConcernModal] = useState(false);
  
  const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  };

  // Fetch faculty list - modified to include all faculty members regardless of status
  useEffect(() => {
    const facultyRef = collection(db, "student");
    const q = query(facultyRef, where("userType", "==", "FACULTY"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const faculty: Array<{id: string, fullName: string, status: string, numOnQueue?: number}> = [];
      querySnapshot.forEach((doc) => {
        faculty.push({
          id: doc.id,
          fullName: doc.data().fullName || "",
          status: doc.data().status || "UNAVAILABLE",
          numOnQueue: doc.data().numOnQueue || 0,
        });
      });
      setFacultyList(faculty);
    });

    return () => unsubscribe();
  }, []);

  // Fetch concerns list
  useEffect(() => {
    // Fetch concerns from Firestore
    const concernDoc = doc(db, 'admin', 'concern');
    
    const unsubscribeConcerns = onSnapshot(concernDoc, (doc) => {
      if (doc.exists()) {
        const concerns = doc.data().concern || [];
        setConcernsList(concerns);
      } else {
        // Fallback to default concerns if document doesn't exist
        const defaultConcerns = [
          "",
        ];
        setConcernsList(defaultConcerns);
      }
    });

    return () => unsubscribeConcerns();
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

    // Check if selected faculty is available
    const selectedFaculty = facultyList.find(f => f.id === selectedFacultyId);
    if (selectedFaculty && selectedFaculty.status !== "AVAILABLE") {
      showAlert("The selected faculty member is currently unavailable. Please select another faculty member or try again later.");
      return;
    }

    setIsLoading(true);
    try {
      // Check if visitor with same name already exists
      const visitorQuery = query(
        collection(db, 'student'),
        where('fullName', '==', visitorName.trim()),
        where('userType', '==', 'VISITOR')
      );
      
      const visitorSnapshot = await getDocs(visitorQuery);
      
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
      
      let newNumber = 1;
      
      if (ticketSnap.exists()) {
        const currentNumber = ticketSnap.data().ticketNum || 0;
        newNumber = currentNumber + 1;

        // Update the ticket counter
        await updateDoc(ticketRef, {
          ticketNum: newNumber
        });
      } else {
        // If the ticket counter document doesn't exist, create it
        await setDoc(doc(db, 'ticketNumberCounter', 'ticket'), {
          ticketNum: 1
        });
      }
      
      const visitorData = {
        fullName: visitorName,
        faculty: selectedFacultyName,
        concern: selectedConcern === "Other" ? otherConcern : selectedConcern,
        otherConcern: selectedConcern === "Other" ? otherConcern : "",
        requestDate: new Date(),
        status: 'waiting',
        queuePosition: queuePosition,
        userTicketNumber: newNumber,
        specificDetails: specificDetails,
        program: "VST",
        userType: "VISITOR",
      };
      
      // If visitor exists, update their record, otherwise create a new one
      if (!visitorSnapshot.empty) {
        // Visitor exists, update their record
        const visitorDoc = visitorSnapshot.docs[0];
        await updateDoc(doc(db, 'student', visitorDoc.id), visitorData);
      } else {
        // Create a new visitor record
        await addDoc(collection(db, 'student'), visitorData);
      }

      // Update faculty's queue count directly by ID
      await updateDoc(doc(db, 'student', selectedFacultyId), {
        numOnQueue: increment(1)
      });
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
      setTicketNumber(newNumber.toString());
      showAlert(`Queue ticket created successfully. Your ticket number is ${newNumber} and your position in queue is ${queuePosition}.`);
      onClose(); // Close the form after successful submission
    } catch (error) {
      console.error('Error adding to queue:', error);
      showAlert('Failed to join queue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacultySelect = (faculty: {id: string, fullName: string, status: string}) => {
    if (faculty.status !== "AVAILABLE") {
      showAlert("This faculty member is currently unavailable. You can still select them, but your queue request may not be processed until they become available.");
    }
    
    setSelectedFacultyId(faculty.id);
    setSelectedFacultyName(faculty.fullName);
    setShowFacultyModal(false);
  };

  const handleConcernSelect = (concern: string) => {
    setSelectedConcern(concern);
    setShowConcernModal(false);
  };
  
  const { 
    colors, 
    getInputStyle, 
    getPlaceholderColor, 
    getButtonStyle, 
    getContainerStyle, 
    getTextStyle
  } = useAppTheme();
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={getTextStyle(styles.headerText, true)}>Add Visitor to Queue</Text>
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
        <TouchableOpacity 
          style={styles.selectButton} 
          onPress={() => setShowFacultyModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {selectedFacultyName ? selectedFacultyName : "Select Faculty"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Concern</Text>
        <TouchableOpacity 
          style={styles.selectButton} 
          onPress={() => setShowConcernModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {selectedConcern ? selectedConcern : "Select Concern"}
          </Text>
        </TouchableOpacity>

        {selectedConcern === "Other" && (
          <>
            <Text style={styles.label}>Specify Concern</Text>
            <TextInput
              style={styles.input}
              value={otherConcern}
              onChangeText={setOtherConcern}
              placeholder="Specify your concern"
            />
          </>
        )}

        <Text style={styles.label}>Specific Details</Text>
        <TextInput
          style={styles.input}
          value={specificDetails}
          onChangeText={setSpecificDetails}
          placeholder="Enter any specific details about your concern"
        />
        
        <TouchableOpacity
          style={getButtonStyle(styles.submitButton)}
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

      {/* Faculty Selection Modal */}
      <Modal
        visible={showFacultyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFacultyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Faculty</Text>
            
            <FlatList
              data={facultyList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    { backgroundColor: item.status === "AVAILABLE" ? "f0f0f0" : "#white" }
                  ]}
                  onPress={() => handleFacultySelect(item)}
                >
                  <View style={styles.facultyItemContainer}>
                    <Text style={styles.modalItemText}>
                      {item.fullName} { `(Queue: ${item.numOnQueue})`}
                    </Text>
                    <Text style={[
                      styles.statusText,
                      { color: item.status === "AVAILABLE" ? "#2E7D32" : "#D32F2F" }
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowFacultyModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Concern Selection Modal */}
      <Modal
        visible={showConcernModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConcernModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Concern</Text>
            
            <FlatList
              data={concernsList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleConcernSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowConcernModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor:"#800020",
    borderRadius: 10,
    margin: 20,
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
  selectButton: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  selectButtonText: {
    color: "#333",
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2E7D32",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  facultyItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});

export default AddQueueVisitor;