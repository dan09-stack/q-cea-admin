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
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Platform } from 'react-native';

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
}

const AddFacultyScreen: React.FC<AddFacultyProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FacultyFormData>({
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
    { label: "Bachelor of Science in Civil Engineering", value: "BSCE" },
    { label: "Bachelor of Science in Computer Engineering", value: "BSCpE" },
    { label: "Bachelor of Science in Electrical Engineering", value: "BSEE" },
    { label: "Bachelor of Science in Mechanical Engineering", value: "BSME" },
  ];

  const validateForm = () => {
    console.log("Validating form data:", formData); // Add this
    if (!formData.fullName || !formData.idNumber || !formData.program || 
        !formData.phoneNumber || !formData.email || !formData.password) {
      console.log("Validation failed: Missing fields"); // Add this
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    // if (!formData.email.endsWith("@phinmaed.com")) {
    //   console.log("Validation failed: Invalid email"); // Add this
    //   showAlert("Error", "Please use a valid PHINMA email address");
    //   return false;
    // }
    return true;
  };

  const handleAdd = async () => {
    console.log("Add button clicked"); // Add this
    if (validateForm()) {
      console.log("Form validated"); // Add this
      setIsLoading(true);
      try {
        console.log("Starting user creation"); // Add this
        // const userCredential = await createUserWithEmailAndPassword(
        //   auth,
        //   formData.email,
        //   formData.password
        // );
        // console.log("User created:", userCredential); // Add this
  
        // const userRef = collection(db, 'student');
        // await addDoc(userRef, {
        //   uid: userCredential.user.uid,
        //   fullName: formData.fullName,
        //   idNumber: formData.idNumber,
        //   program: formData.program,
        //   phoneNumber: formData.phoneNumber,
        //   email: formData.email,
        //   userType: 'student',
        //   createdAt: new Date().toISOString()
        // });

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await db.collection('faculty').doc(user.uid).set({
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          phoneNumber: formData.phoneNumber,
          program: formData.program,
          email: formData.email,
          userType: 'faculty',
          status: 'OFFLINE',
          createdAt: new Date().toISOString()
        });
        await sendEmailVerification(user);
  
        showAlert("Success", "Faculty member added successfully");
        onClose();
      } catch (error: any) {
        console.error("Detailed error:", error); // Add detailed logging
        showAlert(
          "Error", 
          error.message || "Failed to add faculty member" // Show actual error message
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ADD FACULTY</Text>

      <TextInput
        style={styles.input}
        placeholder="Last Name, First Name"
        placeholderTextColor="#ccc"
        value={formData.fullName}
        onChangeText={(text) => setFormData({...formData, fullName: text})}
      />
      <TextInput
        style={styles.input}
        placeholder="ID Number"
        placeholderTextColor="#ccc"
        value={formData.idNumber}
        onChangeText={(text) => setFormData({...formData, idNumber: text})}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#ccc"
        keyboardType="phone-pad"
        value={formData.phoneNumber}
        onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
      />
      <TextInput
        style={styles.input}
        placeholder="PHINMA Email"
        placeholderTextColor="#ccc"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        // secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({...formData, password: text})}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.buttonText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton]} 
          onPress={() => {
            handleAdd();
          }}        >

  <Text  style={styles.buttonText}>ADD</Text>
</TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  container: {
    flex: 1,
    backgroundColor: "#0d3310",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  input: {
    width: "90%",
    height: 50,
    backgroundColor: "#2e4f2e",
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: "#fff",
    fontSize: 16,
  },
  pickerContainer: {
    width: "90%",
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

export default AddFacultyScreen;