import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const AddAdmin: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Admin</Text>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});


export default AddAdmin