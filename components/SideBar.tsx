import { router } from "expo-router";
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface SidebarProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ navigation }) => {
  const handleLogout = () => {
    router.replace('/');
  };
  return (
    <View style={styles.sidebar}>
      <View style={{marginBottom: 30}}>
        <Text style={styles.title}>Q-CEA</Text>
        <Text style={styles.title}>ADMIN</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.icon}>
        <Icon name="home-outline" size={40} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.icon}>
        <Icon name="stats-chart-outline" size={40} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.icon}>
        <Icon name="person-outline" size={40} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("List")} style={styles.icon}>
        <Icon name="list" size={40} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={styles.icon}>
        <Icon name="settings" size={40} color="#000" />
      </TouchableOpacity>
      
      {/* Logout Icon at the bottom */}
      <View style={styles.spacer}></View>
      <TouchableOpacity onPress={handleLogout} style={styles.icon}>
        <Icon name="log-out-outline" size={40} color="#000" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800020",
    flex: 1,
    textAlign: "center",
    width: "100%",
  },
  logoutText: {
    fontSize: 12,
    color: '#000',
    marginTop: 5,
  },

  version: {
    fontSize: 12,
    color: '#000',
    marginTop: 10,
  },
  sidebar: { 
    flex: 1, 
    flexDirection: "column",  // Ensure vertical alignment
    justifyContent: "flex-start", // Align the icons to the top
    backgroundColor: "#fff", 
    padding: 10,
    paddingTop: 50,
    alignItems: "center",
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
  },
  icon: {
    marginBottom: 30,  // Space between icons
  },
  spacer: {
    flexGrow: 1,  // Push the logout icon to the bottom
  }
});

export default Sidebar;
