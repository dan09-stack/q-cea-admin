import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Platform } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { collection, query, where, getDocs } from "firebase/firestore";

interface AddFacultyProps {
  onClose: () => void;
}

interface FacultyFormData {
  fullName: string;
  idNumber: string;
  program: string;
  phoneNumber: string;
  email: string;
  password: string;
  rfid_uid: string;
}

const AddFacultyScreen: React.FC<AddFacultyProps> = ({ onClose }) => {
  const { 
    colors, 
    getInputStyle, 
    getPlaceholderColor, 
    getButtonStyle, 
    getContainerStyle, 
    getTextStyle
  } = useAppTheme();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FacultyFormData>({
    fullName: "",
    idNumber: "",
    program: "",
    phoneNumber: "",
    email: "",
    password: "",
    rfid_uid: "",
  });
  
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const programs = [
    { label: "Select Program", value: "" }, 
    { label: "B.S. Architecture", value: "ARCH" },
    { label: "B.S. Civil Engineering", value: "CE" },
    { label: "B.S. Computer Engineering", value: "CPE" },
    { label: "B.S. Electrical Engineering", value: "EE" },
    { label: "B.S. Electronics Engineering", value: "ECE" },
    { label: "B.S. Mechanical Engineering", value: "ME" },
    { label: "Program Head-Architecture", value: "PH-ARCH" },
    { label: "Program Head-Civil Engineering", value: "PH-CE" },
    { label: "Program Head-Computer Engineering", value: "PH-CPE" },
    { label: "Program Head-Electrical Engineering", value: "PH-EE" },
    { label: "Program Head-Electronics Engineering", value: "PH-ECE" },
    { label: "Program Head-Mechanical Engineering", value: "PH-ME" },
  ];

  const validateForm = () => {
    if (!formData.fullName || !formData.idNumber || !formData.program || 
        !formData.phoneNumber || !formData.email || !formData.password || !formData.rfid_uid) {
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    
    // Phone number format validation
    // Check for Philippine phone number format (e.g., 09XXXXXXXXX)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      showAlert("Error", "Please enter a valid Philippine phone number (e.g., 09XXXXXXXXX or +639XXXXXXXXX)");
      return false;
    }
    
    return true;
  };

  const checkExistingFaculty = async () => {
    try {
      const studentCollection = collection(db, 'student');
      
      // Check for duplicate full name
      const nameQuery = query(studentCollection, where('fullName', '==', formData.fullName));
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        showAlert("Error", "A faculty member with this name already exists");
        return true;
      }
      
      // Check for duplicate ID number
      const idQuery = query(studentCollection, where('idNumber', '==', formData.idNumber));
      const idSnapshot = await getDocs(idQuery);
      if (!idSnapshot.empty) {
        showAlert("Error", "A faculty member with this ID number already exists");
        return true;
      }
      
      // Check for duplicate RFID UID
      const rfidQuery = query(studentCollection, where('rfid_uid', '==', formData.rfid_uid));
      const rfidSnapshot = await getDocs(rfidQuery);
      if (!rfidSnapshot.empty) {
        showAlert("Error", "A faculty member with this RFID UID already exists");
        return true;
      }
      
      // Check for duplicate phone number
      const phoneQuery = query(studentCollection, where('phoneNumber', '==', formData.phoneNumber));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        showAlert("Error", "A faculty member with this phone number already exists");
        return true;
      }
      
      // Check for duplicate email
      const emailQuery = query(studentCollection, where('email', '==', formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        showAlert("Error", "A faculty member with this email already exists");
        return true;
      }
      
      return false; // No duplicates found
    } catch (error) {
      console.error("Error checking for existing faculty:", error);
      showAlert("Error", "Failed to check for existing faculty members");
      return true; // Treat as duplicate to prevent registration
    }
  };

  const handleAdd = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Check for existing faculty with same details
        const duplicateExists = await checkExistingFaculty();
        if (duplicateExists) {
          setIsLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await db.collection('student').doc(user.uid).set({
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          phoneNumber: formData.phoneNumber,
          program: formData.program,
          email: formData.email,
          isVerified: true,
          userType: 'FACULTY',
          numOnQueue: 0,
          status: 'UNAVAILABLE',
          rfid_uid: formData.rfid_uid,
          createdAt: new Date().toISOString()
        });
        await sendEmailVerification(user);
  
        showAlert("Success", "Faculty member added successfully");
        onClose();
      } catch (error: any) {
        console.error("Detailed error:", error);
        showAlert(
          "Error", 
          error.message || "Failed to add faculty member"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <View style={getContainerStyle(styles.outerContainer)}>
      <Text style={getTextStyle(styles.title, true)}>REGISTER FACULTY</Text>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Full Name</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="Last Name, First Name"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>ID Number</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="ID Number"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.idNumber}
            onChangeText={(text) => setFormData({...formData, idNumber: text})}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>RFID UID</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="RFID UID"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.rfid_uid}
            onChangeText={(text) => setFormData({...formData, rfid_uid: text})}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Program</Text>
          <View style={[getInputStyle(styles.pickerContainer), styles.whiteBackground]}>
            <Picker
              selectedValue={formData.program}
              onValueChange={(itemValue) => setFormData({...formData, program: itemValue})}
              style={[styles.picker, { color: colors.text }]}
            >
              {programs.map((program, index) => (
                <Picker.Item 
                  key={index}
                  label={program.label} 
                  value={program.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Phone Number</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="Phone Number"
            placeholderTextColor={getPlaceholderColor()}
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Email</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="PHINMA Email"
            placeholderTextColor={getPlaceholderColor()}
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Password</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground]}
            placeholder="Password"
            placeholderTextColor={getPlaceholderColor()}
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={getButtonStyle(styles.cancelButton, true)} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={getButtonStyle(styles.addButton)} 
            onPress={handleAdd}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'ADDING...' : 'ADD'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    margin: 20,
    width: "70%",
    height: "78%", // Set a specific height to ensure scrolling works
    padding: 30,
    borderRadius: 15, 
    borderWidth: 1,
    borderColor: "#800020",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "left",
    width: "100%",
  },
  scrollView: {
    flex: 1,    
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingTop: 20,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  inputContainer: {
    width: "90%",
    marginBottom: 15,
    
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
    textAlign: "left",
    width: "100%",
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  whiteBackground: {
    backgroundColor: "white",
  },
  pickerContainer: {
    width: "100%",
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 20,
  },
  cancelButton: {
    width: "45%",
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: "45%",
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AddFacultyScreen;
