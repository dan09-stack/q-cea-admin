import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import { collection, query as firestoreQuery, where as firestoreWhere, getDocs, doc, writeBatch, DocumentSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BusinessHours {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  enabled: boolean;
}

const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    startHour: 8,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    enabled: true,
  });
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkAndCancelAfterHoursQueues();
    }, 1000); 
    
    return () => clearInterval(intervalId);
  }, [businessHours]);
  useEffect(() => {
    loadSettings();
    
    const startDate = new Date();
    startDate.setHours(businessHours.startHour);
    startDate.setMinutes(businessHours.startMinute);
    setStartTimeDate(startDate);
    
    const endDate = new Date();
    endDate.setHours(businessHours.endHour);
    endDate.setMinutes(businessHours.endMinute);
    setEndTimeDate(endDate);
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'businessHours');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as BusinessHours;
        setBusinessHours(data);
      } else {
        // Create default settings if none exist
        await setDoc(settingsRef, businessHours);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showAlert('Error', 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'businessHours');
      await setDoc(settingsRef, businessHours);
      showAlert('Success', 'Business hours settings saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('Error', 'Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatTime = (hours: number, minutes: number) => {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTimeDate(selectedDate);
      setBusinessHours({
        ...businessHours,
        startHour: selectedDate.getHours(),
        startMinute: selectedDate.getMinutes(),
      });
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTimeDate(selectedDate);
      setBusinessHours({
        ...businessHours,
        endHour: selectedDate.getHours(),
        endMinute: selectedDate.getMinutes(),
      });
    }
  };

  const isAfterHours = () => {
    if (!businessHours.enabled) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const beforeStartTime = 
      currentHour < businessHours.startHour || 
      (currentHour === businessHours.startHour && currentMinute < businessHours.startMinute);
    
    const afterEndTime = 
      currentHour > businessHours.endHour || 
      (currentHour === businessHours.endHour && currentMinute > businessHours.endMinute);
    
    return beforeStartTime || afterEndTime;
  };

  const handleCancelAllQueues = async () => {
    try {
      const studentsCollectionRef = collection(db, 'student');
      
      // Get all waiting students
      const waitingStudentsQuery = firestoreQuery(
        studentsCollectionRef,
        firestoreWhere('status', '==', 'waiting')
      );
      
      const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);
      
      if (waitingStudentsSnapshot.empty) {
        showAlert('Info', 'No active queues to cancel.');
        return;
      }
      
      const batch = writeBatch(db);
      
      waitingStudentsSnapshot.docs.forEach((docSnapshot) => {
        const studentRef = doc(db, 'student', docSnapshot.id);
        batch.update(studentRef, {
          status: 'OFFLINE',
          numOnQueue: 0
        });
      });
      
      // Get all faculty and set them offline
      const facultyQuery = firestoreQuery(
        studentsCollectionRef,
        firestoreWhere('userType', '==', 'FACULTY')
      );
      
      const facultySnapshot = await getDocs(facultyQuery);
      
      facultySnapshot.docs.forEach((docSnapshot) => {
        const facultyRef = doc(db, 'student', docSnapshot.id);
        batch.update(facultyRef, {
          status: 'OFFLINE'
        });
      });
      
      await batch.commit();
      showAlert('Success', 'All queues have been cancelled and faculty set to offline.');
    } catch (error) {
      console.error('Error cancelling queues:', error);
      showAlert('Error', 'Failed to cancel queues.');
    }
  };

  const checkAndCancelAfterHoursQueues = async () => {
    if (isAfterHours()) {
      console.log("After hours detected - cancelling all queues");
      try {
        const studentsCollectionRef = collection(db, 'student');
        const waitingStudentsQuery = firestoreQuery(
          studentsCollectionRef,
          firestoreWhere('status', '==', 'waiting')
        );
       
        // Get faculty status for reference
        const facultyQuery = firestoreQuery(
          studentsCollectionRef,
          firestoreWhere('userType', '==', 'FACULTY')
        );
       
        const facultySnapshot = await getDocs(facultyQuery);
        const batch = writeBatch(db);
       
        if (!facultySnapshot.empty) {
          facultySnapshot.docs.forEach((docSnapshot: DocumentSnapshot) => {
            const facultyRef = doc(db, 'student', docSnapshot.id);
            batch.update(facultyRef, {
              status: 'OFFLINE'
            });
          });
        }
       
        // If there are no waiting students, no need to proceed
        const waitingStudentsSnapshot = await getDocs(waitingStudentsQuery);
        if (waitingStudentsSnapshot.empty) {
          console.log("No active queues to cancel");
          await batch.commit();
          return;
        }
       
        await handleCancelAllQueues();
        console.log("Successfully cancelled all queues due to after hours");
      } catch (error) {
        console.error('Error in automatic queue cancellation:', error);
      }
    }
  };

  const renderTimePickers = () => {
    if (Platform.OS === 'web') {
      // For web, use native HTML time inputs
      return (
        <>
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>Start Time:</Text>
            <input
              type="time"
              value={`${businessHours.startHour.toString().padStart(2, '0')}:${businessHours.startMinute.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                setBusinessHours({
                  ...businessHours,
                  startHour: hours,
                  startMinute: minutes
                });
              }}
              style={{ 
                padding: 8, 
                fontSize: 16, 
                borderRadius: 4, 
                border: '1px solid #ccc'
              }}
            />
          </View>
          
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>End Time:</Text>
            <input
              type="time"
              value={`${businessHours.endHour.toString().padStart(2, '0')}:${businessHours.endMinute.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                setBusinessHours({
                  ...businessHours,
                  endHour: hours,
                  endMinute: minutes
                });
              }}
              style={{ 
                padding: 8, 
                fontSize: 16, 
                borderRadius: 4, 
                border: '1px solid #ccc'
              }}
            />
          </View>
        </>
      );
    } else {
      // For mobile platforms, use DateTimePicker
      return (
        <>
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>Start Time:</Text>
            <TouchableOpacity 
              onPress={() => setShowStartTimePicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>
                {formatTime(businessHours.startHour, businessHours.startMinute)}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showStartTimePicker && (
            <DateTimePicker
              value={startTimeDate}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
          
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>End Time:</Text>
            <TouchableOpacity 
              onPress={() => setShowEndTimePicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>
                {formatTime(businessHours.endHour, businessHours.endMinute)}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showEndTimePicker && (
            <DateTimePicker
              value={endTimeDate}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </>
      );
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f5f5f5']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>System Settings</Text>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Business Hours:</Text>
            <Switch
              value={businessHours.enabled}
              onValueChange={(value) => 
                setBusinessHours({...businessHours, enabled: value})
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={businessHours.enabled ? "#4CAF50" : "#f4f3f4"}
            />
          </View>
          
          {businessHours.enabled && (
            <>
              {renderTimePickers()}
              
              <Text style={styles.infoText}>
                The system will automatically cancel all queues and set faculty to offline 
                outside of business hours.
              </Text>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>
        
     
      </ScrollView>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4CAF50',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
export default Settings;