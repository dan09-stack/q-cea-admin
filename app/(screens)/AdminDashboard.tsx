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
import AddQueueVisitor from "@/components/AddQueueVisitor";
import List from "@/components/List";
import Settings from "@/components/Settings";
const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('faculty'); // Default view is 'faculty'
  const [showTicketOverview, setShowTicketOverview] = useState(false);
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
              } else if (screen === 'Settings') {
                setCurrentView('settings');
              }
            },
          }}
        />
      </View>
      <LinearGradient
        colors={['#fff', '#fff', '#fff']}
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
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
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
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
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
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
            />
          </View>
        ) : currentView === 'addQueueVisitor' ? (
          <View style={styles.facultyContainer}>
            <AddQueueVisitor onClose={() => setCurrentView('faculty')} />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
            />
          </View>
        ) : currentView === 'addQueue' ? (
          <View style={styles.facultyContainer}>
            <AddQueue onClose={() => setCurrentView('faculty')} 
                showTicketOverview={showTicketOverview}
                setShowTicketOverview={setShowTicketOverview}
                />
            <QueueInfo
              onAddQueueVisitor={() => setCurrentView('addQueueVisitor')}
              onAddFaculty={() => setCurrentView('addFaculty')}
              onAddStudent={() => setCurrentView('addStudent')}
              onAddQueue={() => setCurrentView('addQueue')}
              onViewRatings={() => alert('Faculty Ratings')}
              onVerifyFaculty={() => setCurrentView('verifyFaculty')}
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
            />
          </View>
        ) : currentView === 'profile' ? (
          <Profile />
        ) : currentView === 'list' ? (
          <List />
        ) : currentView === 'settings' ? (
          <Settings />
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
              onViewTickets={() => {
                setCurrentView('addQueue');
                setShowTicketOverview(true);
              }}
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
    backgroundColor: "#000",
  },
  sidebar: { 
    flex: 0.08, 
    backgroundColor: "#333",
  },
  content: { 
    flex: .92,
    borderRadius: 10,
    margin: 1,
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
