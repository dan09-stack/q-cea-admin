import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface QueueInfoProps {
  queueCount: number;
  onAddFaculty: () => void;
  onAddStudent: () => void;
  onViewRatings: () => void;
  onAddAdmin?: () => void;
}

const QueueInfo: React.FC<QueueInfoProps> = ({
  queueCount,
  onAddFaculty,
  onAddStudent,
  onViewRatings,
  onAddAdmin,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.queueCount}>TOTAL STUDENT ON QUEUE</Text>
      <Text style={styles.count}>{queueCount}</Text>
      <TouchableOpacity style={styles.button} onPress={onAddFaculty}>
        <Text style={styles.buttonText}>ADD FACULTY</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onAddStudent}>
        <Text style={styles.buttonText}>ADD STUDENT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onAddAdmin}>
        <Text style={styles.buttonText}>ADD Q-CEA ADMIN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" ,width:"25%",  },
  queueCount: { fontSize: 16, fontWeight: "bold" },
  count: { fontSize: 32, fontWeight: "bold", marginVertical: 10 },
  button: { backgroundColor: "#333", padding: 10, marginVertical: 5, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff" },
});

export default QueueInfo;
