import FacultyList from "@/components/FacultyList";
import AddFaculty from "@/components/AddFaculty";
import QueueInfo from "@/components/QueueInfo";
import Sidebar from "@/components/SideBar";
import Profile from '@/components/Profile';
import Statistics from '@/components/Statistics';
import AddStudent from "@/components/AddStudent";
import AddQueue from "@/components/AddQueue";
import AddAdmin from "@/components/VerifyFaculty";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import AddAdminScreen from "@/components/VerifyFaculty";
import AddQueueVisitor from "@/components/AddQueueVisitor";
import List from "@/components/List";

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('faculty'); // Default view is 'faculty'
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
              } else if (screen === 'List') {
                setCurrentView('list');
              }
            },
          }}
        />
      </View>
      <LinearGradient
        colors={['#4CAF50', '#2E7D32', '#1B5E20']}
        style={styles.content}
      >
        {currentView === 'addFaculty' ? (
          <View style={styles.facultyContainer}>
            <AddFaculty onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'addStudent' ? (
          <View style={styles.facultyContainer}>
            <AddStudent onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'verifyFaculty' ? (
          <View style={styles.facultyContainer}>
            <AddAdmin onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'addQueue' ? (
          <View style={styles.facultyContainer}>
            <AddQueue onClose={() => setCurrentView('faculty')} />
            <QueueInfo  
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
            />
          </View>
        ) : currentView === 'addQueueVisitor' ? (
          <View style={styles.facultyContainer}>
            <AddQueueVisitor onClose={() => setCurrentView('faculty')} />
            <QueueInfo  
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
            />
          </View>
        ) : currentView === 'profile' ? (
          <Profile />
        ) : currentView === 'list' ? (
          <List />
        ) : currentView === 'statistics' ? (
          <Statistics />
        ) : (
          <View style={styles.facultyContainer}>
            <FacultyList />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
          
        )
        }
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: "row",
  },
  sidebar: { 
    flex: 0.08, 
    backgroundColor: "#333",
  },
  content: { 
    flex: .92,
    // Remove the backgroundColor property as it's now handled by LinearGradient
  },
  FacultyList: { 
    flex: 1,
    width: "100%"
  },
  facultyContainer: { 
    flexDirection: "row", 
    padding: 20, 
    justifyContent: "space-between",
  },
});

export default AdminDashboard;
