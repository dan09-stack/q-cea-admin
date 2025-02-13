import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { db } from "../firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface UnverifiedUser {
  id: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
}

const AddAdmin: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const studentRef = collection(db, 'student');
    const q = query(studentRef, where('isVerified', '==', false));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: UnverifiedUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          fullName: data.fullName,
          idNumber: data.idNumber,
          phoneNumber: data.phoneNumber,
          email: data.email,
        });
      });
      setUnverifiedUsers(users);
    });

    return () => unsubscribe();
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      const userRef = doc(db, 'student', userId);
      await updateDoc(userRef, {
        isVerified: true
      });
      setModalMessage("User verified successfully!");
      setModalVisible(true);
    } catch (error) {
      setModalMessage("Failed to verify user. Please try again.");
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
    <Text style={styles.title}>Unverified Users</Text>
    <ScrollView style={styles.scrollView}>
      {unverifiedUsers.length > 0 ? (
        unverifiedUsers.map((user, index) => (
          <View key={index} style={styles.userCard}>
            <Text style={styles.userText}>Name: {user.fullName}</Text>
            <Text style={styles.userText}>ID: {user.idNumber}</Text>
            <Text style={styles.userText}>Phone: {user.phoneNumber}</Text>
            <Text style={styles.userText}>Email: {user.email}</Text>
            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={() => handleVerify(user.id)}
            >
              <Text style={styles.buttonText}>Verify User</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No Verification Pending</Text>
        </View>
      )}
    </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{modalMessage}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    margin: 20,
    width: "70%",
    backgroundColor: "#032911",
    alignItems: "center",
    padding: 30,
    borderRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  scrollView: {
    width: "100%",
    maxHeight: 500,
  },
  userCard: {
    backgroundColor: "#1c4e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  verifyButton: {
    backgroundColor: "#0f790f",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: "#032911",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    top: '40%',
    left: '25%',
    width: '50%',
  },
  modalText: {
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  closeButton: {
    backgroundColor: "#1c4e1e",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default AddAdmin;
