import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContactScreen from './screens/ContactScreen';

const Drawer = createDrawerNavigator();

function AppWithTheme() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Principal' }} />
        <Drawer.Screen name="Contact" component={ContactScreen} options={{ title: 'Contato' }} />
        <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações / Ajuda' }} />
        <Drawer.Screen name="Report" component={ReportScreen} options={{ title: 'Laudo' }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}
