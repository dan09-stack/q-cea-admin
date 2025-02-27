import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { db } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';
import { auth } from "../firebaseConfig";

const FacultyList: React.FC = () => {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);
  const [userType, setUserType] = useState('');

  interface FacultyItem {
    id: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE';
    numOnQueue: number;
    userType: string;
  }

  const handleSearch = () => {
    setActiveSearch(true);
  };

  const NoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No faculty members found</Text>
    </View>
  );

  const filteredFacultyData = !activeSearch 
    ? facultyData 
    : facultyData.filter(faculty =>
        faculty.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      const renderFaculty = ({ item }: { item: FacultyItem }) => (
        <View style={styles.row}>
          <Text style={[styles.name, { flex: 1 }]}>{item.name}</Text>
          <Text
            style={[
              styles.status,
              { flex: 1, textAlign: 'center' },
              { color: item.status === 'ONLINE' ? '#00FF00' : '#FF0000' },
            ]}
          >
            {item.status}
          </Text>
          <Text style={[styles.studentCount, { flex: 1, textAlign: 'center' }]}>{item.numOnQueue}</Text>
        </View>
      );

  useEffect(() => {
    const facultyCollectionRef = collection(db, 'student');
    const unsubscribe = onSnapshot(facultyCollectionRef, (snapshot) => {
      const faculty: FacultyItem[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().fullName || '',
          status: doc.data().status || 'OFFLINE',
          userType: doc.data().userType || '',
          numOnQueue: doc.data().numOnQueue || 0
        }))
        .filter(user => user.userType === 'FACULTY')
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setFacultyData(faculty);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const currentUserDoc = snapshot.docs.find(doc => doc.id === currentUser.uid);
        if (currentUserDoc) {
          setUserType(currentUserDoc.data().userType || '');
        }
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LIST OF FACULTY</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search faculty..."
          placeholderTextColor="#999"
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            if (text === '') {
              setActiveSearch(false);
            }
          }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'left' }]}>NAME</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>WAITING</Text>
      </View>
      <FlatList
        data={filteredFacultyData}
        keyExtractor={(item) => item.id}
        renderItem={renderFaculty}
        style={styles.list}
        ListEmptyComponent={NoResults}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: '#f3f3f3',
    fontSize: 16,
    textAlign: 'center',
  }, 
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",

    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#f3f3f3',
    paddingBottom: 5,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  container: { 
    marginTop: 50,
    margin: 20,
    width: "70%",
    backgroundColor: '#032911',
    padding: 30,  
    borderRadius: 15, 
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 20,
    color: "white",
  },
  searchInput: {
    height: 40,
    width: "98%",
    borderColor: '#ddd',
    paddingHorizontal: 10,
  },
  title: { 
    fontWeight: "bold", 
    fontSize: 25, 
    marginBottom: 15, 
    color: "white" 
  },
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 13, 
    borderBottomWidth: 1, 
    borderBottomColor: "#ddd" 
  },
  name: { 
    fontSize: 15, 
    color: "white" 
  },
  status: {
    fontSize: 15
  },
  studentCount: {
    fontSize: 15,
    color: "white"
  }
});

export default FacultyList;
