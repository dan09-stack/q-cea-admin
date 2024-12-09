import FacultyList from "@/components/FacultyList";
import AddFaculty from "@/components/AddFaculty";
import QueueInfo from "@/components/QueueInfo";
import Sidebar from "@/components/SideBar";
import Profile from '@/components/Profile';
import Statistics from '@/components/Statistics';
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";

const AdminDashboard: React.FC = () => {
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [currentView, setCurrentView] = useState('faculty'); // 'faculty', 'profile', 'addFaculty'

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
      <Sidebar 
        navigation={{ 
          navigate: (screen) => {
            if (screen === 'Profile') {
              setCurrentView('profile');
            } else if (screen === 'Home') {
              setCurrentView('faculty');
            } else if (screen === 'Dashboard') {
              setCurrentView('statistics');
            }
          }
        }} 
      />

      </View>
      <View style={styles.content}>
        {currentView === 'addFaculty' ? (
          <View style={styles.facultyContainer}>
            <AddFaculty 
              onClose={() => setCurrentView('faculty')} 
            />
            <QueueInfo
                queueCount={8}
                onAddFaculty={() => setCurrentView('addFaculty')}
                onAddStudent={() => alert("Add Student")}
                onViewRatings={() => alert("Faculty Ratings")}
              />
          </View>
          
        ) : currentView === 'profile' ? (
          <Profile />
        ) : currentView === 'statistics' ? (
          <Statistics />
        ) : (
          <View style={styles.facultyContainer}>
            <FacultyList />
            <QueueInfo
              queueCount={8}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => alert("Add Student")}
              onViewRatings={() => alert("Faculty Ratings")}
            />
          </View>
        )}
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row" },
  sidebar: { flex: 0.1, backgroundColor: "#333" },
  content: { flex: 1, backgroundColor: "#4CAF50" },
  FacultyList: { flex: 1 ,width: "100%"},
  facultyContainer: { flexDirection:"row", padding: 20 , justifyContent: "space-between" },
});

export default AdminDashboard;
