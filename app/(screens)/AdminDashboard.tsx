import FacultyList from "@/components/FacultyList";
import AddFaculty from "@/components/AddFaculty";
import QueueInfo from "@/components/QueueInfo";
import Sidebar from "@/components/SideBar";
import Profile from '@/components/Profile';
import Statistics from '@/components/Statistics';
import AddStudent from "@/components/AddStudent";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import AddAdminScreen from "@/components/AddAdmin";

const AdminDashboard: React.FC = () => {
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [currentView, setCurrentView] = useState('faculty'); // 'faculty', 'profile', 'addFaculty'
  const [showAddAdmin, setShowAddAdmin] = useState(false);
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
            <AddFaculty onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              queueCount={8}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onViewRatings={() => alert("Faculty Ratings")}
              onAddAdmin={() => setShowAddAdmin(true)}
            />
          </View>
        ) : currentView === 'addStudent' ? (
          <View style={styles.facultyContainer}>
            <AddStudent onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              queueCount={8}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onViewRatings={() => alert("Faculty Ratings")}
              onAddAdmin={() => setShowAddAdmin(true)}
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
              onAddStudent={() => setCurrentView('addStudent')}
              onViewRatings={() => alert("Faculty Ratings")}
              onAddAdmin={() => setShowAddAdmin(true)}
           />
           
          </View>
          
        )
        }
        {showAddAdmin && (
          <AddAdminScreen onClose={() => setShowAddAdmin(false)} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: "row" 
  },
  sidebar: { 
    flex: 0.08, 
    backgroundColor: "#333" 
  },
  content: { 
    flex: .92, 
    backgroundColor: "#4CAF50" 
  },
  FacultyList: { 
    flex: 1 ,
    width: "100%"
  },
  facultyContainer: { 
    flexDirection:"row", 
    padding: 20 , 
    justifyContent: "space-between" 
  },
});

export default AdminDashboard;
