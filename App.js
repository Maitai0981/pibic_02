import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContactScreen from './screens/ContactScreen';
// import { registerUploadTask } from './services/uploadTask'; // Removido

import Ionicons from 'react-native-vector-icons/Ionicons'; 

const Tab = createBottomTabNavigator(); 

function AppWithTheme() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Tab.Navigator 
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Contact') {
              iconName = focused ? 'chatbox' : 'chatbox-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Report') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: isDark ? 'lightblue' : 'blue',
          tabBarInactiveTintColor: 'gray', 
          tabBarStyle: {
            backgroundColor: isDark ? DarkTheme.colors.card : DefaultTheme.colors.card,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Principal' }}
        />
        <Tab.Screen 
          name="Contact" 
          component={ContactScreen} 
          options={{ title: 'Contato' }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Configurações' }}
        />
        <Tab.Screen 
          name="Report" 
          component={ReportScreen} 
          options={{ title: 'Laudo' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {

  /*
  useEffect(() => {
    registerUploadTask();
  }, []);
  */ // Removido
  
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}