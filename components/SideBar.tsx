import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface SidebarProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ navigation }) => {
  return (
    <View style={styles.sidebar}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Icon name="home-outline" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
        <Icon name="stats-chart-outline" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        <Icon name="person-outline" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: { 
    flex: 1, 
    justifyContent: "space-around", 
    backgroundColor: "#222", 
    padding: 10,
    alignItems: "center",
  },
});

export default Sidebar;
