import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { db } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export interface Faculty {
  fullName: string;
  status: "ONLINE" | "OFFLINE";
  userType: string;
}

const FacultyList: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredFaculty = faculty
    .filter(item => 
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );

  const TableHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>Name</Text>
      <Text style={styles.headerText}>Status</Text>
    </View>
  );

  useEffect(() => {
    const q = query(
      collection(db, "faculty"),
      where("userType", "==", "faculty")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const facultyData = snapshot.docs.map(doc => ({
        fullName: doc.data().fullName,
        status: doc.data().status,
        userType: doc.data().userType
      }));
      setFaculty(facultyData);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: Faculty }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={item.status === "ONLINE" ? styles.online : styles.offline}>
        {item.status}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LIST OF FACULTY</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search faculty..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TableHeader />
      <FlatList
        data={filteredFaculty}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  container: { 
    margin: 20,
    width: "70%",
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  name: { fontSize: 14 },
  online: { color: "green" },
  offline: { color: "red" },
});

export default FacultyList;