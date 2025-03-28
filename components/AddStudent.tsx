import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Platform } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { Ionicons } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  confirmPassword: string;
}

interface ValidationErrors {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  const defaultFormData: StudentFormData = {
    fullName: "",
    idNumber: "",
    program: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  
  
  const [errors, setErrors] = useState<ValidationErrors>({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  useEffect(() => {
    const loadSavedFormData = async () => {
      try {
        const savedFormData = await AsyncStorage.getItem('addStudentFormData');
        if (savedFormData) {
          setFormData(JSON.parse(savedFormData));
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };
    
    loadSavedFormData();
  }, []);
  useEffect(() => {
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem('addStudentFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };
    
    saveFormData();
  }, [formData]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^(09\d{9}|\+63\d{10})$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z]{2,}(?: [A-Za-z-]+)*, [A-Za-z-]{2,}(?: [A-Za-z-]+)*(?: [A-Z]\.?(?:[A-Z]\.)?)?$/;
    return nameRegex.test(name);
  };

  const validateStudentIdFormat = (id: string): { isValid: boolean; message: string } => {
    // Student ID format: 03-XXXX-XXXXX or 03-XXXX-XXXXXX
    const studentIdRegex = /^03-\d{4}-\d{5,6}$/;
    
    if (studentIdRegex.test(id)) {
      return { isValid: true, message: "" };
    } else {
      return {
        isValid: false,
        message: "Please enter a valid student ID in the format 03-XXXX-XXXXX"
      };
    }
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    // Check minimum length
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
   
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
   
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
   
    // Check for at least one number
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
   
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
   
    // If all checks pass
    return { isValid: true, message: '' };
  };

  const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  };

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
    let isValid = true;
    const newErrors: ValidationErrors = {
      fullName: "",
      idNumber: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    
    // Check for empty fields
    if (!formData.fullName || !formData.idNumber || !formData.program || 
        !formData.phoneNumber || !formData.email || !formData.password || !formData.confirmPassword) {
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    
    // Validate full name
    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = "Please enter a valid name in the format: Last Name, First Name";
      isValid = false;
    }
    
    // Validate ID number
    const idValidation = validateStudentIdFormat(formData.idNumber);
    if (!idValidation.isValid) {
      newErrors.idNumber = idValidation.message;
      isValid = false;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)";
      isValid = false;
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
      isValid = false;
    }
    
    // Validate password confirmation
    if (!validatePasswordsMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleAdd = async () => {
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
      await clearSavedFormData();
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
  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem('addStudentFormData');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };
  const handleCancel = async () => {
    await clearSavedFormData();
    onClose();
  };
  const [showProgramModal, setShowProgramModal] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={getTextStyle(styles.title, true)}>REGISTER STUDENT</Text>
      <ScrollView style={getContainerStyle(styles.formGroup)}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.fullName ? styles.inputError : null]}
            placeholder="Last Name, First Name"
            placeholderTextColor="#000000"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ID Number</Text>
          <TextInput
            style={[styles.input, errors.idNumber ? styles.inputError : null]}
            placeholder="03-XXXX-XXXXX"
            placeholderTextColor="#000000"
            value={formData.idNumber}
            onChangeText={(text) => setFormData({...formData, idNumber: text})}
          />
          {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Program</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerButton]}
            onPress={() => setShowProgramModal(true)}
          >
            <Text style={[
              formData.program ? styles.pickerText : styles.pickerPlaceholder,
              styles.centeredText
            ]}>
              {formData.program ? programs.find(p => p.value === formData.program)?.label || "Select Program" : "Select Program"}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
            placeholder="Phone Number (09XXXXXXXXX)"
            placeholderTextColor="#000000"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
          />
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Email"
            placeholderTextColor="#000000"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, errors.password ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#000000"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
            <Icon
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="black"
                />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, errors.confirmPassword ? styles.inputError : null]}
              placeholder="Confirm Password"
              placeholderTextColor="#000000"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={getButtonStyle(styles.cancelButton, true)} 
            onPress={handleCancel}
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
      </ScrollView>

      <Modal
        visible={showProgramModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Program</Text>
            <ScrollView style={styles.modalScrollView}>
              {programs.filter(p => p.value !== "").map((program, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({...formData, program: program.value});
                    setShowProgramModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.program === program.value && styles.selectedModalItem
                  ]}>
                    {program.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProgramModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    justifyContent: 'center', 
    alignItems: 'flex-start',    
  },
  centeredText: {
    textAlign: 'center',
  },
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalContent: {
  width: '80%',
  maxHeight: '70%',
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
},
modalScrollView: {
  width: '100%',
  marginBottom: 15,
},
modalItem: {
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  width: '100%',
},
modalItemText: {
  fontSize: 16,
},
selectedModalItem: {
  fontWeight: 'bold',
  color: '#0f790f',
},
modalCloseButton: {
  backgroundColor: '#1c4e1e',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  marginTop: 15,
  alignSelf: 'center',
},
modalCloseButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
pickerText: {
  fontSize: 16,
  color: '#000000',
},
pickerPlaceholder: {
  fontSize: 16,
  color: '#999999',
},
  formGroup: {
    paddingLeft: 40,
    width: "100%",
    backgroundColor: "#ccc",
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  container: {
    height: 700,
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
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  pickerContainer: {
    width: "100%",
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
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    color: '#000000',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
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

