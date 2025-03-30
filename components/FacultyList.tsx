import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';
import { getAuth,  } from "firebase/auth";

const FacultyList: React.FC = () => {
  const [facultyData, setFacultyData] = useState<FacultyItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  interface FacultyItem {
    id: string;
    name: string;
    status: 'AVAILABLE' | 'UNAVAILABLE';
    numOnQueue: number;
    userType: string;
    email: string;
  }

  const handleSearch = () => {
    setActiveSearch(true);
  };

  const NoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No authenticated faculty members found</Text>
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
          { color: item.status === 'AVAILABLE' ? '#00FF00' : '#FF0000' },
        ]}
      >
        {item.status}
      </Text>
      <Text style={[styles.studentCount, { flex: 1, textAlign: 'center' }]}>{item.numOnQueue}</Text>
    </View>
  );

  useEffect(() => {
    const fetchFacultyData = async () => {
      setIsLoading(true);
      try {
        // Get all faculty from Firestore
        const facultyCollectionRef = collection(db, 'student');
        const facultyQuery = query(facultyCollectionRef, where("userType", "==", "FACULTY"),where("isVerified", "==", true));
        const facultySnapshot = await getDocs(facultyQuery);
        
        // Get all faculty with email addresses
        const facultyWithEmails = facultySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().fullName || '',
          status: doc.data().status || 'UNAVAILABLE',
          userType: doc.data().userType || '',
          numOnQueue: doc.data().numOnQueue || 0,
          email: doc.data().email || ''
        }));
        
        // Filter to only include faculty with valid emails (authenticated users must have emails)
        const authenticatedFaculty = facultyWithEmails.filter(faculty => 
          faculty.email && faculty.email.trim() !== ''
        );
        
        // Sort by name
        authenticatedFaculty.sort((a, b) => a.name.localeCompare(b.name));
        
        setFacultyData(authenticatedFaculty);
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      } finally {
        setIsLoading(false);
      }
      
      // Get current user type
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDocs(query(
          collection(db, 'student'), 
          where("email", "==", currentUser.email)
        ));
        
        if (!userDoc.empty) {
          setUserType(userDoc.docs[0].data().userType || '');
        }
      }
    };

    fetchFacultyData();
    
    // Set up real-time listener for updates
    const facultyCollectionRef = collection(db, 'student');
    const unsubscribe = onSnapshot(
      query(facultyCollectionRef, where("userType", "==", "FACULTY")), 
      (snapshot) => {
        fetchFacultyData(); // Refresh data when changes occur
      }
    );
  
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LIST OF AUTHENTICATED FACULTY</Text>
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
      {isLoading ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>Loading faculty data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFacultyData}
          keyExtractor={(item) => item.id}
          renderItem={renderFaculty}
          style={styles.list}
          ListEmptyComponent={NoResults}
        />
      )}
    </View>
  );
};

// Styles remain the same


const styles = StyleSheet.create({
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: '#333', // Changed from #f3f3f3 to dark color
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
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
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
    margin: 20,
    width: "70%",
    backgroundColor: 'white', // Changed from #032911 to white
    padding: 30,  
    borderRadius: 15, 
    borderColor: '#800020',
    borderWidth: 1,
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
    color: "black", // Changed from white to black
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
    color: "#800020" 
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
    color: "black" // Changed from white to black
  },
  status: {
    fontSize: 15
  },
  studentCount: {
    fontSize: 15,
    color: "black" // Changed from white to black
  }
});

export default FacultyList;
