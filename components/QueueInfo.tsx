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
    <View style={styles.mainContainer}>
      {/* Queue Count Container */}
      <View style={styles.queueContainer}>
        <Text style={styles.queueCount}>TOTAL STUDENT ON QUEUE</Text>
        <Text style={styles.count}>{queueCount}</Text>
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20, 
  },
  queueContainer: {
    padding: 70,
    alignItems: "center",
    backgroundColor: "#032911",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    width: "80%",
    marginBottom: 25,
  },
  queueCount: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  count: {
    fontSize: 65,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
  },
  buttonContainer: {
    width: "80%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#11592b",
    padding: 10,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default QueueInfo;
