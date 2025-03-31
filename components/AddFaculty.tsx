import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { db, auth, userManagementAuth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Platform } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { collection, query, where, getDocs } from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ValidationErrors {
  fullName: string;
  idNumber: string;
  program: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  rfid_uid: string;
}

// Create a default form data object
const defaultFormData: FacultyFormData = {
  fullName: "",
  idNumber: "",
  program: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  rfid_uid: "",
};

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
  const [formData, setFormData] = useState<FacultyFormData>(defaultFormData);
 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [existingPrograms, setExistingPrograms] = useState<string[]>([]);
 
  const [errors, setErrors] = useState<ValidationErrors>({
    fullName: "",
    idNumber: "",
    program: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    rfid_uid: ""
  });
 
  // Load saved form data when component mounts
  useEffect(() => {
    const loadSavedFormData = async () => {
      try {
        const savedFormData = await AsyncStorage.getItem('addFacultyFormData');
        if (savedFormData) {
          setFormData(JSON.parse(savedFormData));
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };
   
    loadSavedFormData();
  }, []);
 
  // Save form data whenever it changes
  useEffect(() => {
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem('addFacultyFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };
   
    saveFormData();
  }, [formData]);
 
  // Clear saved form data after successful submission
  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem('addFacultyFormData');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };
 
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
    { label: "Dean", value: "DEAN" },
  ];

  // Fetch existing program heads and dean
  useEffect(() => {
    const fetchExistingPrograms = async () => {
      try {
        const studentCollection = collection(db, 'student');
        const programHeadQuery = query(studentCollection, where('userType', '==', 'FACULTY'));
        const snapshot = await getDocs(programHeadQuery);
       
        const existingProgramsList: string[] = [];
        snapshot.forEach(doc => {
          const program = doc.data().program;
          if (program && (program.startsWith('PH-') || program === 'DEAN')) {
            existingProgramsList.push(program);
          }
        });
       
        setExistingPrograms(existingProgramsList);
      } catch (error) {
        console.error("Error fetching existing program heads:", error);
      }
    };
   
    fetchExistingPrograms();
  }, []);

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Only accept 09 format (11 digits total: 09 + 9 more digits)
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFullName = (name: string): boolean => {
    // Updated regex to make middle initial optional and period optional
    const nameRegex = /^[A-Za-z]{2,}(?: [A-Za-z-]+)*(, )[A-Za-z-]{2,}(?: [A-Za-z-]+)*( [A-Z]\.?)?$/;
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

  const validateProgram = (program: string): { isValid: boolean; message: string } => {
    if (!program) {
      return { isValid: false, message: "Please select a program" };
    }
   
    // Check if the selected program is a program head or dean position
    if ((program.startsWith('PH-') || program === 'DEAN') && existingPrograms.includes(program)) {
      return {
        isValid: false,
        message: `A faculty member with the role ${program} already exists`
      };
    }
   
    return { isValid: true, message: "" };
  };

  const validateRfidUid = (rfid: string): boolean => {
    return rfid.trim() !== "";
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: ValidationErrors = {
      fullName: "",
      idNumber: "",
      program: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      rfid_uid: ""
    };

    // Validate full name
    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (!validateFullName(formData.fullName)) {
      newErrors.fullName = "Format should be: Last Name, First Name (MI optional)";
      isValid = false;
    }
   
    // Validate ID number
    if (!formData.idNumber) {
      newErrors.idNumber = "ID number is required";
      isValid = false;
    } else {
      const idValidation = validateFacultyIdFormat(formData.idNumber);
      if (!idValidation.isValid) {
        newErrors.idNumber = idValidation.message;
        isValid = false;
      }
    }
   
    // Validate RFID UID
    if (!formData.rfid_uid) {
      newErrors.rfid_uid = "RFID UID is required";
      isValid = false;
    }
   
    // Validate program
    if (!formData.program) {
      newErrors.program = "Please select a program";
      isValid = false;
    } else {
      const programValidation = validateProgram(formData.program);
      if (!programValidation.isValid) {
        newErrors.program = programValidation.message;
        isValid = false;
      }
    }
   
    // Validate phone number
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Enter a valid phone number (format: 09XXXXXXXXX)";
      isValid = false;
    }
   
    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }
   
    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
        isValid = false;
      }
    }
   
    // Validate password confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (!validatePasswordsMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
   
    setErrors(newErrors);
    return isValid;
  };

  const checkExistingFaculty = async () => {
    try {
      const studentCollection = collection(db, 'student');
     
      // Check for duplicate ID number
      const idQuery = query(studentCollection, where('idNumber', '==', formData.idNumber));
      const idSnapshot = await getDocs(idQuery);
      if (!idSnapshot.empty) {
        return { exists: true, field: "ID Number" };
      }
     
      // Check for duplicate RFID UID
      const rfidQuery = query(studentCollection, where('rfid_uid', '==', formData.rfid_uid));
      const rfidSnapshot = await getDocs(rfidQuery);
      if (!rfidSnapshot.empty) {
        return { exists: true, field: "RFID UID" };
      }
     
      // Check for duplicate phone number
      const phoneQuery = query(studentCollection, where('phoneNumber', '==', formData.phoneNumber));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        return { exists: true, field: "Phone Number" };
      }
     
      // Check for duplicate email
      const emailQuery = query(studentCollection, where('email', '==', formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        return { exists: true, field: "Email" };
      }
     
      return { exists: false }; // No duplicates found
    } catch (error) {
      console.error("Error checking for existing faculty:", error);
      return { exists: false, error };
    }
  };

  const handleAdd = async () => {
    if (!validateForm()) {
      return;
    }
   
    setIsLoading(true);
   
    try {
      // Check for existing faculty with same details
      const existingCheck = await checkExistingFaculty();
      if (existingCheck.exists) {
        showAlert("Error", `A faculty member with this ${existingCheck.field} already exists.`);
        setIsLoading(false);
        return;
      }
     
      const userCredential = await createUserWithEmailAndPassword(userManagementAuth, formData.email, formData.password);
      const user = userCredential.user;

      await db.collection('student').doc(user.uid).set({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber,
        program: formData.program,
        email: formData.email,
        isVerified: false,
        userType: 'FACULTY',
        numOnQueue: 0,
        status: 'UNAVAILABLE',
        rfid_uid: formData.rfid_uid,
        createdAt: new Date().toISOString()
      });
      
      await sendEmailVerification(user);
      await userManagementAuth.signOut();
      
      // Clear the form data after successful submission
      await clearSavedFormData();
      setFormData(defaultFormData);
     
      showAlert("Success", "Faculty member added successfully");
      onClose();
    } catch (error: any) {
      console.error("Detailed error:", error);
      
      // Handle Firebase auth errors with more user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        showAlert("Error", "This email is already in use by another account.");
      } else if (error.code === 'auth/invalid-email') {
        showAlert("Error", "The email address is not valid.");
      } else if (error.code === 'auth/weak-password') {
        showAlert("Error", "The password is too weak.");
      } else {
        showAlert("Error", error.message || "Failed to add faculty member");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProgram = (program: string) => {
    // Validate if the program is already taken (for program heads and dean)
    if ((program.startsWith('PH-') || program === 'DEAN') && existingPrograms.includes(program)) {
      setErrors({
        ...errors,
        program: `A faculty member with the role ${program} already exists`
      });
    } else {
      setErrors({
        ...errors,
        program: ""
      });
    }
   
    setFormData({...formData, program});
    setShowProgramModal(false);
  };

  // Handle cancel button with confirmation
  const handleCancel = () => {
    // Alert.alert(
    //   "Confirm Cancel",
    //   "Are you sure you want to cancel? All entered data will be lost.",
    //   [
    //     {
    //       text: "No",
    //       style: "cancel"
    //     },
    //     {
    //       text: "Yes",
    //       onPress: () => {
    //         clearSavedFormData();
    //         setFormData(defaultFormData);
    //         onClose();
    //       }
    //     }
    //   ]
    // );
    clearSavedFormData();
    onClose();
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
            style={[
              getInputStyle(styles.input), 
              styles.whiteBackground, 
              errors.fullName ? styles.inputError : null
            ]}
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
            style={[
              getInputStyle(styles.input), 
              styles.whiteBackground, 
              errors.idNumber ? styles.inputError : null
            ]}
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
            style={[
              getInputStyle(styles.input), 
              styles.whiteBackground,
              errors.rfid_uid ? styles.inputError : null
            ]}
            placeholder="RFID UID"
            placeholderTextColor={getPlaceholderColor()}
            value={formData.rfid_uid}
            onChangeText={(text) => {
              setFormData({...formData, rfid_uid: text});
              if (errors.rfid_uid && text.trim() !== "") {
                setErrors({...errors, rfid_uid: ""});
              }
            }}
          />
          {errors.rfid_uid ? <Text style={styles.errorText}>{errors.rfid_uid}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Program</Text>
          <TouchableOpacity
            style={[
              getInputStyle(styles.input),
              styles.whiteBackground,
              styles.programSelector,
              errors.program ? styles.inputError : null
            ]}
            onPress={() => setShowProgramModal(true)}
          >
            <Text style={formData.program ? styles.programText : styles.placeholderText}>
              {formData.program
                ? programs.find(p => p.value === formData.program)?.label || "Select Program"
                : "Select Program"}
            </Text>
            <Icon name="chevron-down-outline" size={20} color="#666" />
          </TouchableOpacity>
          {errors.program ? <Text style={styles.errorText}>{errors.program}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={getTextStyle(styles.inputLabel)}>Phone Number</Text>
          <TextInput
            style={[
              getInputStyle(styles.input), 
              styles.whiteBackground, 
              errors.phoneNumber ? styles.inputError : null
            ]}
            placeholder="Phone Number (09XXXXXXXXX)"
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
            style={[
              getInputStyle(styles.input), 
              styles.whiteBackground, 
              errors.email ? styles.inputError : null
            ]}
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
              style={[
                getInputStyle(styles.passwordInput), 
                styles.whiteBackground, 
                errors.password ? styles.inputError : null
              ]}
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
                name={showPassword ? "eye-outline" : "eye-off-outline"}
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
              style={[
                getInputStyle(styles.passwordInput), 
                styles.whiteBackground, 
                errors.confirmPassword ? styles.inputError : null
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={getPlaceholderColor()}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({...formData, confirmPassword: text});
                // Clear password error if passwords match and the password is valid
                if (errors.confirmPassword && validatePasswordsMatch(formData.password, text)) {
                  setErrors({...errors, confirmPassword: ""});
                }
              }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={getButtonStyle(styles.cancelButton, true)}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>CANCEL</Text>
          </TouchableOpacity>
              
          <TouchableOpacity
            style={[
              getButtonStyle(styles.addButton),
              isLoading && styles.disabledButton
            ]}
            onPress={handleAdd}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'ADDING...' : 'ADD'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Program Selection Modal */}
      <Modal
        visible={showProgramModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProgramModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Program</Text>
              <TouchableOpacity onPress={() => setShowProgramModal(false)}>
                <Icon name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
           
            <FlatList
              data={programs.filter(p => p.value !== "")} // Remove the "Select Program" option
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isDisabled = (item.value.startsWith('PH-') || item.value === 'DEAN') &&
                                  existingPrograms.includes(item.value);
               
                return (
                  <TouchableOpacity
                    style={[
                      styles.programItem,
                      formData.program === item.value && styles.selectedProgramItem,
                      isDisabled && styles.disabledProgramItem
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        handleSelectProgram(item.value);
                        if (errors.program) {
                          setErrors({...errors, program: ""});
                        }
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.programItemText,
                      formData.program === item.value && styles.selectedProgramItemText,
                      isDisabled && styles.disabledProgramItemText
                    ]}>
                      {item.label}
                    </Text>
                    {isDisabled && (
                      <Text style={styles.programTakenText}>
                        (Already assigned)
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    margin: 20,
    width: "70%",
    height: 700, // Set a specific height to ensure scrolling works
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
  programSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 15,
  },
  programText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
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
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '60%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800020',
  },
  programItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProgramItem: {
    backgroundColor: '#f0f8ff',
  },
  programItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedProgramItemText: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  disabledProgramItem: {
    backgroundColor: '#f5f5f5',
  },
  disabledProgramItemText: {
    color: '#999',
  },
  programTakenText: {
    fontSize: 12,
    color: 'red',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default AddFacultyScreen;
