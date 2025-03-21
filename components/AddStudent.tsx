import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Platform } from 'react-native';
import { useAppTheme } from '../utils/theme';

interface AddStudentProps {
  onClose: () => void;
}

interface StudentFormData {
  fullName: string;
  idNumber: string;
  program: string;
  phoneNumber: string;
  email: string;
  password: string;
}

const AddStudentScreen: React.FC<AddStudentProps> = ({ onClose }) => {
    const { 
      colors, 
      getInputStyle, 
      getPlaceholderColor, 
      getButtonStyle, 
      getContainerStyle, 
      getTextStyle
    } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: "",
    idNumber: "",
    program: "",
    phoneNumber: "",
    email: "",
    password: "",
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
    { label: "B.S. Mechanical Engineering", value: "ME" }
  ];

  // Check if student information already exists in Firestore
  const checkExistingStudent = async () => {
    try {
      const studentRef = collection(db, 'student');
      
      // Check for existing fullName
      const nameQuery = query(studentRef, where("fullName", "==", formData.fullName));
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        return { exists: true, field: "Full Name" };
      }
      
      // Check for existing idNumber
      const idQuery = query(studentRef, where("idNumber", "==", formData.idNumber));
      const idSnapshot = await getDocs(idQuery);
      if (!idSnapshot.empty) {
        return { exists: true, field: "ID Number" };
      }
      
      // Check for existing phoneNumber
      const phoneQuery = query(studentRef, where("phoneNumber", "==", formData.phoneNumber));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        return { exists: true, field: "Phone Number" };
      }
      
      // Check for existing email
      const emailQuery = query(studentRef, where("email", "==", formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        return { exists: true, field: "Email" };
      }
      
      return { exists: false };
    } catch (error) {
      console.error("Error checking existing student:", error);
      return { exists: false, error };
    }
  };

  const validateForm = () => {
    console.log("Validating form data:", formData);
    
    // Check for empty fields
    if (!formData.fullName || !formData.idNumber || !formData.program || 
        !formData.phoneNumber || !formData.email || !formData.password) {
      console.log("Validation failed: Missing fields");
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    
    // Phone number format validation
    // Check for Philippine phone number format (e.g., 09XXXXXXXXX or +639XXXXXXXXX)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      console.log("Validation failed: Invalid phone number format");
      showAlert("Error", "Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)");
      return false;
    }
    
    // Email validation (optional)
    // if (!formData.email.endsWith("@phinmaed.com")) {
    //   console.log("Validation failed: Invalid email");
    //   showAlert("Error", "Please use a valid PHINMA email address");
    //   return false;
    // }
    
    return true;
  };

  const handleAdd = async () => {
    console.log("Add button clicked");
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if student already exists
      const existingCheck = await checkExistingStudent();
      if (existingCheck.exists) {
        showAlert("Error", `A student with this ${existingCheck.field} already exists.`);
        setIsLoading(false);
        return;
      }
      
      console.log("Starting user creation");
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await db.collection('student').doc(user.uid).set({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber,
        program: formData.program,
        email: formData.email,
        isVerified: true,
        userType: 'STUDENT',
        createdAt: new Date().toISOString()
      });
      
      await sendEmailVerification(user);
  
      showAlert("Success", "Student added successfully");
      onClose();
    } catch (error: any) {
      console.error("Detailed error:", error);
      showAlert(
        "Error", 
        error.message || "Failed to add student"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={getTextStyle(styles.title, true)}>REGISTER STUDENT</Text>
      <View style={getContainerStyle(styles.formGroup)}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name, First Name"
          placeholderTextColor="#000000"
          value={formData.fullName}
          onChangeText={(text) => setFormData({...formData, fullName: text})}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>ID Number</Text>
        <TextInput
          style={styles.input}
          placeholder="ID Number"
          placeholderTextColor="#000000"
          value={formData.idNumber}
          onChangeText={(text) => setFormData({...formData, idNumber: text})}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Program</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.program}
            onValueChange={(itemValue) => setFormData({...formData, program: itemValue})}
            style={styles.picker}
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
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number (09XXXXXXXXX)"
          placeholderTextColor="#000000"
          keyboardType="phone-pad"
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="PHINMA Email"
          placeholderTextColor="#000000"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000000"
          // secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={getButtonStyle(styles.cancelButton, true)} 
          onPress={onClose}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            getButtonStyle(styles.addButton),
            isLoading ? styles.disabledButton : null
          ]} 
          onPress={handleAdd}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? "ADDING..." : "ADD"}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    width: "100%",
    backgroundColor: "#ccc",
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  container: {
    margin: 20,
    width: "70%",
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 30,
    borderRadius: 15, 
    borderColor: '#800020',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    flex: 1,
    textAlign: "left",
    width: "100%",
  },
  inputContainer: {
    width: "90%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
    textAlign: "left",
    width: "100%",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    paddingHorizontal: 15,
    color: "#000000",
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pickerContainer: {
    width: "100%",
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
    color: "#000000",
    width: "100%",
    fontSize: 16,
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
    backgroundColor: "#1c4e1e",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: "45%",
    height: 50,
    backgroundColor: "#0f790f",
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

export default AddStudentScreen;
