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
import Icon from 'react-native-vector-icons/Ionicons';

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
  confirmPassword: string;
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
    confirmPassword: "",
    rfid_uid: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: ""
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

  const validateFacultyIdFormat = (id: string): { isValid: boolean; message: string } => {
    // Faculty ID format: UP-XX-XXX-F
    const facultyIdRegex = /^UP-\d{2}-\d{3}-[A-Z]$/;
    
    // Student ID format: 03-XXXX-XXXXX or 03-XXXX-XXXXXX
    const studentIdRegex = /^03-\d{4}-\d{5,6}$/;
    
    if (facultyIdRegex.test(id)) {
      return { isValid: true, message: "" };
    } else if (studentIdRegex.test(id)) {
      return { 
        isValid: false, 
        message: "You entered a student ID format. Faculty ID should follow the format UP-XX-XXX-F" 
      };
    } else {
      return { 
        isValid: false, 
        message: "Please enter a valid faculty ID in the format UP-XX-XXX-F" 
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

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: "",
      idNumber: "",
      phoneNumber: "",
      email: "",
      password: ""
    };

    // Check if all fields are filled
    if (!formData.fullName || !formData.idNumber || !formData.program || 
        !formData.phoneNumber || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.rfid_uid) {
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    
    // Validate full name format
    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = "Please enter a valid name format (Last Name, First Name)";
      isValid = false;
    }
    
    // Validate ID number format
    const idValidation = validateFacultyIdFormat(formData.idNumber);
    if (!idValidation.isValid) {
      newErrors.idNumber = idValidation.message;
      isValid = false;
    }
    
    // Validate phone number format
    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Philippine phone number (e.g., 09XXXXXXXXX or +63XXXXXXXXXX)";
      isValid = false;
    }
    
    // Validate email format
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
      isValid = false;
    } else if (!validatePasswordsMatch(formData.password, formData.confirmPassword)) {
      // Only check if passwords match if the password itself is valid
      newErrors.password = "Passwords do not match";
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      const errorMessages = Object.values(newErrors).filter(msg => msg !== "").join("\n");
      showAlert("Validation Error", errorMessages);
    }
    
    return isValid;
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
            style={[getInputStyle(styles.input), styles.whiteBackground, errors.fullName ? styles.inputError : null]}
            placeholder="Last Name, First Name"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.fullName}
            onChangeText={(text) => {
              setFormData({...formData, fullName: text});
              if (errors.fullName && validateFullName(text)) {
                setErrors({...errors, fullName: ""});
              }
            }}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>ID Number</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground, errors.idNumber ? styles.inputError : null]}
            placeholder="ID Number (UP-XX-XXX-F)"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.idNumber}
            onChangeText={(text) => {
              setFormData({...formData, idNumber: text});
              if (errors.idNumber) {
                const validation = validateFacultyIdFormat(text);
                if (validation.isValid) {
                  setErrors({...errors, idNumber: ""});
                }
              }
            }}
          />
          {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
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
            style={[getInputStyle(styles.input), styles.whiteBackground, errors.phoneNumber ? styles.inputError : null]}
            placeholder="Phone Number (09XXXXXXXXX or +63XXXXXXXXXX)"
            placeholderTextColor={getPlaceholderColor()}
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(text) => {
              setFormData({...formData, phoneNumber: text});
              if (errors.phoneNumber && validatePhoneNumber(text)) {
                setErrors({...errors, phoneNumber: ""});
              }
            }}
          />
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Email</Text>
          <TextInput
            style={[getInputStyle(styles.input), styles.whiteBackground, errors.email ? styles.inputError : null]}
            placeholder="Email"
            placeholderTextColor={getPlaceholderColor()}
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => {
              setFormData({...formData, email: text});
              if (errors.email && validateEmail(text)) {
                setErrors({...errors, email: ""});
              }
            }}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[getInputStyle(styles.passwordInput), styles.whiteBackground, errors.password ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor={getPlaceholderColor()}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => {
                setFormData({...formData, password: text});
                // Clear password error if it becomes valid and matches confirmation
                if (errors.password) {
                  const validation = validatePassword(text);
                  if (validation.isValid && validatePasswordsMatch(text, formData.confirmPassword)) {
                    setErrors({...errors, password: ""});
                  }
                }
              }}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          <Text style={styles.passwordHint}>
            Password must be at least 8 characters long and contain uppercase, lowercase, 
            number, and special character.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[getInputStyle(styles.passwordInput), styles.whiteBackground, errors.password ? styles.inputError : null]}
              placeholder="Confirm Password"
              placeholderTextColor={getPlaceholderColor()}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({...formData, confirmPassword: text});
                // Clear password error if passwords match and the password is valid
                if (errors.password) {
                  const passwordValidation = validatePassword(formData.password);
                  if (passwordValidation.isValid && validatePasswordsMatch(formData.password, text)) {
                    setErrors({...errors, password: ""});
                  }
                }
              }}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: "100%",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: 50,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
  },
  passwordHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
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
