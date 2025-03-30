import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFunctions, httpsCallable } from 'firebase/functions';
interface UserItem {
  id: string;
  email: string;  
  fullName: string;
  userType: string;
  rfid_uid: string;
  program: string;
  status: string;
  numOnQueue: number;
  phoneNumber: string;
  idNumber: string;
  userTicketNumber: string;
  archived?: boolean;
}

const List: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState<Partial<UserItem>>({});
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [idNumberError, setIdNumberError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);

  // Programs list for dropdown
  const basePrograms = [
    { label: "B.S. Architecture", value: "ARCH" },
    { label: "B.S. Civil Engineering", value: "CE" },
    { label: "B.S. Computer Engineering", value: "CPE" },
    { label: "B.S. Electrical Engineering", value: "EE" },
    { label: "B.S. Electronics Engineering", value: "ECE" },
    { label: "B.S. Mechanical Engineering", value: "ME" },
  ];
  
  // Additional program head options for faculty only
  const programHeadOptions = [
    { label: "Program Head-Architecture", value: "PH-ARCH" },
    { label: "Program Head-Civil Engineering", value: "PH-CE" },
    { label: "Program Head-Computer Engineering", value: "PH-CPE" },
    { label: "Program Head-Electrical Engineering", value: "PH-EE" },
    { label: "Program Head-Electronics Engineering", value: "PH-ECE" },
    { label: "Program Head-Mechanical Engineering", value: "PH-ME" },
  ];
  

  // User types list for dropdown
  const userTypes = [
    "STUDENT", "FACULTY", "VISITOR"
  ];

  // Status options
  const statusOptions = [
    "AVAILABLE", "UNAVAILABLE"
  ];

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Validation functions
  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z]{2,}(?: [A-Za-z-]+)*, [A-Za-z-]{2,}(?: [A-Za-z-]+)*(?: [A-Z]\.?(?:[A-Z]\.)?)?$/;
    return nameRegex.test(name);
  };

  const validateIdNumber = (id: string, userType: string): boolean => {
    if (userType === "STUDENT") {
      const studentIdRegex = /^03-\d{4}-\d{5,6}$/;
      return studentIdRegex.test(id);
    } else {
      const facultyIdRegex = /^UP-\d{2}-\d{3}-[A-Z]$/;
      return facultyIdRegex.test(id);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Phone format: 09XXXXXXXXX or +639XXXXXXXXX
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Fetch users from Firestore
  useEffect(() => {
    const usersRef = collection(db, 'student');
    
    const unsubscribe = onSnapshot(usersRef, (querySnapshot) => {
      const usersList: UserItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          userType: data.userType || '',
          rfid_uid: data.rfid_uid || '',
          program: data.program || '',
          status: data.status || '',
          numOnQueue: data.numOnQueue || 0,
          phoneNumber: data.phoneNumber || '',
          idNumber: data.idNumber || '',
          userTicketNumber: data.userTicketNumber || '',
          archived: data.archived || false,
        });
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle search and filter
  useEffect(() => {
    let result = users;
    
    
    if (filterType !== 'ALL') {
      result = result.filter(user => user.userType === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.idNumber.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
  }, [searchQuery, filterType, users]);

  // Handle edit button press
  const handleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({...user});
    setFullNameError(null);
    setIdNumberError(null);
    setPhoneNumberError(null);
    setModalVisible(true);
  };

  // Handle delete button press
  const handleDelete = (user: UserItem) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'student', selectedUser.id));

      // First try to delete the user from Firebase Authentication
      if (selectedUser.email) {
        try {
         
          interface DeleteAuthUserResponse {
            success: boolean;
            message?: string; 
          }
          const functions = getFunctions();
      const deleteAuthUser = httpsCallable<{ email: string }, DeleteAuthUserResponse>(functions, "deleteAuthUser");
  
      console.log("🔄 Sending delete request to Firebase Functions...");
      // Corrected the way the email is passed to Firebase Functions
      const result = await deleteAuthUser({ email: selectedUser.email });
          console.log('User authentication deleted successfully');
        } catch (authError: any) {
          console.error('Error deleting user from authentication:', authError);
          // Continue with Firestore deletion even if auth deletion fails
        }
      }
      
      // Then delete the user document from Firestore
      
      showAlert('Success', 'User deleted successfully!');
      setDeleteModalVisible(false);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error deleting user:', error);
      showAlert('Error', 'Failed to delete user. Please try again.');
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setModalVisible(false);
    setFullNameError(null);
    setIdNumberError(null);
    setPhoneNumberError(null);
  };

  // Close create modal
  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setFullNameError(null);
    setIdNumberError(null);
    setPhoneNumberError(null);
  };

  // Handle input change
  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Clear previous errors when user starts typing
    if (field === 'fullName') setFullNameError(null);
    if (field === 'idNumber') setIdNumberError(null);
    if (field === 'phoneNumber') setPhoneNumberError(null);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save edited user with duplicate checking
  const saveUser = async () => {
    if (!selectedUser || !formData) return;
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber) {
      showAlert('Error', 'Full Name, ID Number, and Phone Number are required fields.');
      return;
    }

    // Validate formats
    let hasError = false;
    
    if (!validateFullName(formData.fullName)) {
      setFullNameError('Full name should be in format: Last Name, First Name MI.');
      hasError = true;
    }
    
    if (!validateIdNumber(formData.idNumber, formData.userType as string)) {
      setIdNumberError('ID Number should be in format UP-XX-XXX-X for faculty or UP-XXXX-XXXXX/UP-XXXX-XXXXXX for students');
      hasError = true;
    }
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setPhoneNumberError('Phone Number should be in format 09XXXXXXXXX or +639XXXXXXXXX');
      hasError = true;
    }
    
    if (hasError) {
      return;
    }
    
    try {
      // Check if any fields have changed that need duplicate checking
      const fieldsToCheck = [];
      if (formData.idNumber !== selectedUser.idNumber) fieldsToCheck.push('idNumber');
      if (formData.phoneNumber !== selectedUser.phoneNumber) fieldsToCheck.push('phoneNumber');
      // Add RFID UID check if it has changed and is not empty
      if (formData.rfid_uid !== selectedUser.rfid_uid && formData.rfid_uid) fieldsToCheck.push('rfid_uid');
      
      // If any of these fields changed, check for duplicates
      if (fieldsToCheck.length > 0) {
        setIsLoading(true);
        
        // Create queries for each field that needs checking
        const duplicateChecks = fieldsToCheck.map(async (field) => {
          const fieldValue = formData[field as keyof typeof formData];
          if (!fieldValue) return null;
          
          const fieldQuery = query(
            collection(db, 'student'),
            where(field, '==', fieldValue),
          );
          
          const querySnapshot = await getDocs(fieldQuery);
          
          // Check if any document exists with this value (excluding the current user)
          const duplicates = querySnapshot.docs.filter(doc => doc.id !== selectedUser.id);
          
          if (duplicates.length > 0) {
            return { field, value: fieldValue };
          }
          return null;
        });
        
        // Wait for all duplicate checks to complete
        const results = await Promise.all(duplicateChecks);
        const foundDuplicates = results.filter(result => result !== null);
        
        if (foundDuplicates.length > 0) {
          const fieldNameMap = {
            'idNumber': 'ID Number',
            'phoneNumber': 'Phone Number',
            'email': 'Email',
            'rfid_uid': 'RFID UID'  // Add RFID UID to the field name map
          };
          
          const duplicateFieldNames = foundDuplicates
            .map(d => fieldNameMap[d?.field as keyof typeof fieldNameMap] || d?.field)
            .join(', ');
            
          showAlert('Duplicate Found', `Another user already exists with the same ${duplicateFieldNames}. Please use different values.`);
          setIsLoading(false);
          return;
        }
      }
      
      // If no duplicates found, proceed with the update
      const userRef = doc(db, 'student', selectedUser.id);
      await updateDoc(userRef, {
        email: formData.email,
        fullName: formData.fullName,
        userType: formData.userType,
        rfid_uid: formData.rfid_uid,
        program: formData.program,
        status: formData.status,
        numOnQueue: formData.numOnQueue || 0,
        phoneNumber: formData.phoneNumber,
        idNumber: formData.idNumber,
        userTicketNumber: formData.userTicketNumber,
        archived: formData.archived
      });
      
      showAlert('Success', 'User updated successfully!');
      setFullNameError(null);
      setIdNumberError(null);
      setPhoneNumberError(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Error', 'Failed to update user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  



  // Render user item
  const renderUserItem = ({ item }: { item: UserItem }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
  
        {/*  for visitors */}
        <Text style={styles.userDetail}>Type: {item.userType}</Text>
        <Text style={styles.userDetail}>Program: {item.program}</Text>
        <Text style={styles.userDetail}>
          Ticket Number: {item.userTicketNumber || 'No active ticket'}
        </Text>
  
        {/* for students and faculty */}
        {(item.userType === 'STUDENT' || item.userType === 'FACULTY') && (
          <>
            <Text style={styles.userDetail}>Email: {item.email}</Text>
            <Text style={styles.userDetail}>ID: {item.idNumber}</Text>
            <Text style={styles.userDetail}>
              Status: 
              <Text
                style={item.status === 'AVAILABLE' ? styles.statusOnline : styles.statusOffline}
              >
                {item.status}
              </Text>
            </Text>
          </>
        )}
      </View>
  
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
          <Icon name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
          <Icon name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users List</Text>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.typeFilter}>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'ALL' && styles.activeFilter]} 
              onPress={() => setFilterType('ALL')}
            >
              <Text style={[styles.filterText, filterType === 'ALL' && styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'STUDENT' && styles.activeFilter]} 
              onPress={() => setFilterType('STUDENT')}
            >
              <Text style={[styles.filterText, filterType === 'STUDENT' && styles.activeFilterText]}>Students</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'FACULTY' && styles.activeFilter]} 
              onPress={() => setFilterType('FACULTY')}
            >
              <Text style={[styles.filterText, filterType === 'FACULTY' && styles.activeFilterText]}>Faculty</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'VISITOR' && styles.activeFilter]} 
              onPress={() => setFilterType('VISITOR')}
            >
              <Text style={[styles.filterText, filterType === 'VISITOR' && styles.activeFilterText]}>Visitors</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Edit User Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredField}>*</Text></Text>
              <TextInput
                style={[styles.input, fullNameError ? styles.inputError : null]}
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                placeholder="Full Name"
              />
              {fullNameError && <Text style={styles.errorText}>{fullNameError}</Text>}

              <Text style={styles.inputLabel}>ID Number <Text style={styles.requiredField}>*</Text></Text>
              <TextInput
                style={[styles.input, idNumberError ? styles.inputError : null]}
                value={formData.idNumber}
                onChangeText={(text) => handleInputChange('idNumber', text)}
                placeholder="ID Number"
              />
              {idNumberError && <Text style={styles.errorText}>{idNumberError}</Text>}

              <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredField}>*</Text></Text>
              <TextInput
                style={[styles.input, phoneNumberError ? styles.inputError : null]}
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
              {phoneNumberError && <Text style={styles.errorText}>{phoneNumberError}</Text>}

              {formData.userType !== 'STUDENT' && (
                <>
                  <Text style={styles.inputLabel}>RFID UID</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.rfid_uid}
                    onChangeText={(text) => handleInputChange('rfid_uid', text)}
                    placeholder="RFID UID"
                  />
                  
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.pickerContainer}>
                    {statusOptions.map(status => (
                      <TouchableOpacity 
                        key={status}
                        style={[
                          styles.pickerItem, 
                          formData.status === status && styles.selectedPickerItem
                        ]}
                        onPress={() => handleInputChange('status', status)}
                      >
                        <Text style={styles.pickerText}>{status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {formData.userType !== 'VISITOR' && (
                <>
                  <Text style={styles.inputLabel}>Program</Text>
                  <View style={styles.pickerContainer}>
                    {(formData.userType === 'FACULTY' ? 
                      [...basePrograms, ...programHeadOptions] : 
                      basePrograms
                    ).map(program => (
                      <TouchableOpacity 
                        key={program.value}
                        style={[
                          styles.pickerItem, 
                          formData.program === program.value && styles.selectedPickerItem
                        ]}
                        onPress={() => handleInputChange('program', program.value)}
                      >
                        <Text style={styles.pickerText}>{program.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditModal}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveUser}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading && (
              <View style={styles.modalLoadingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Checking for duplicates...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete user {selectedUser?.fullName}?
            </Text>
            <Text style={styles.warningText}>
              This action cannot be undone. The user will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  requiredField: {
    color: 'red',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#800020',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 8,
  },
  typeFilter: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFilter: {
    backgroundColor: '#fff',
  },
  activeFilterText: {
    color: '#000',
  },
  filterText: {
    color: '#fff',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusOnline: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusOffline: {
    color: '#F44336',
    fontWeight: '600',
  },
  actionButtons: {
    justifyContent: 'space-around',
    width: 50,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  archiveButton: {
    backgroundColor: '#FF9800',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formContainer: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pickerItem: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPickerItem: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  pickerText: {
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  deleteConfirmButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default List;