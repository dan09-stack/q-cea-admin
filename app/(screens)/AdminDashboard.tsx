import FacultyList from "@/components/FacultyList";
import AddFaculty from "@/components/AddFaculty";
import QueueInfo from "@/components/QueueInfo";
import Sidebar from "@/components/SideBar";
import Profile from '@/components/Profile';
import Statistics from '@/components/Statistics';
import AddStudent from "@/components/AddStudent";
import AddQueue from "@/components/AddQueue";
import AddAdmin from "@/components/AddAdmin";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('faculty'); // Default view is 'faculty'

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
            },
          }}
        />
      </View>
      <View style={styles.content}>
        {currentView === 'addFaculty' ? (
          <View style={styles.facultyContainer}>
            <AddFaculty onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddAdmin={() => setCurrentView('addAdmin')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'addStudent' ? (
          <View style={styles.facultyContainer}>
            <AddStudent onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddAdmin={() => setCurrentView('addAdmin')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'addAdmin' ? (
          <View style={styles.facultyContainer}>
            <AddAdmin onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddAdmin={() => setCurrentView('addAdmin')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        ) : currentView === 'addQueue' ? (
          <View style={styles.facultyContainer}>
            <AddQueue onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddAdmin={() => setCurrentView('addAdmin')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
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
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddAdmin={() => setCurrentView('addAdmin')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
            />
          </View>
        )}
      </View>
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
    flex: 0.92, 
    backgroundColor: "#4CAF50",
  },
  facultyContainer: { 
    flexDirection: "row", 
    padding: 20, 
    justifyContent: "space-between",
  },
});

export default AdminDashboard;
