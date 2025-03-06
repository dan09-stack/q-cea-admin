import { router } from "expo-router";
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
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
      <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.icon}>
        <Icon name="home-outline" size={40} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.icon}>
        <Icon name="stats-chart-outline" size={40} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.icon}>
        <Icon name="person-outline" size={40} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("List")} style={styles.icon}>
        <Icon name="list" size={40} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={styles.icon}>
        <Icon name="settings" size={40} color="#fff" />
      </TouchableOpacity>
      
      {/* Logout Icon at the bottom */}
      <View style={styles.spacer}></View>
      <TouchableOpacity onPress={handleLogout} style={styles.icon}>
        <Icon name="log-out-outline" size={40} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: { 
    flex: 1, 
    flexDirection: "column",  // Ensure vertical alignment
    justifyContent: "flex-start", // Align the icons to the top
    backgroundColor: "#032911", 
    padding: 10,
    paddingTop: 50,
    alignItems: "center",
  },
  icon: {
    marginBottom: 30,  // Space between icons
  },
  spacer: {
    flexGrow: 1,  // Push the logout icon to the bottom
  }
});

export default Sidebar;
