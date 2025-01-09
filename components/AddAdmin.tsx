import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';

interface AddAdminProps {
  onClose: () => void;
}

interface AdminFormData {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
}

const AddAdminScreen: React.FC<AddAdminProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    fullName: "",
    idNumber: "",
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

  const validateForm = () => {
    if (!formData.fullName || !formData.idNumber || 
        !formData.phoneNumber || !formData.email || !formData.password) {
      showAlert("Error", "Please fill in all fields");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Add Firebase authentication logic here
        showAlert("Success", "Admin added successfully");
        onClose();
      } catch (error) {
        showAlert("Error", "Failed to add admin");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Q-CEA Admin</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.fullName}
        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="ID Number"
        value={formData.idNumber}
        onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.addButton]} 
          onPress={handleAdd}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Adding..." : "Add Admin"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    position: 'absolute',   
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '50%',
    alignSelf: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%'
  },
  cancelButton: {
    backgroundColor: '#888'
  },
  addButton: {
    backgroundColor: '#333'
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});

export default AddAdminScreen;
