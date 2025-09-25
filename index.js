import { registerRootComponent } from 'expo';
import App from './App';

// Configuração do Flipper para debugging
if (__DEV__) {
  const { addPlugin } = require('react-native-flipper');
  
  // Plugin de performance
  addPlugin({
    getId() {
      return 'react-native-flipper-performance-plugin';
    },
    onConnect(connection) {
      console.log('Flipper Performance Plugin connected');
    },
    onDisconnect() {
      console.log('Flipper Performance Plugin disconnected');
    },
  });

  // Plugin da Shopify para performance
  addPlugin({
    getId() {
      return '@shopify/flipper-plugin-react-native-performance';
    },
    onConnect(connection) {
      console.log('Shopify Flipper Performance Plugin connected');
    },
    onDisconnect() {
      console.log('Shopify Flipper Performance Plugin disconnected');
    },
  });

  // Configuração do react-native-performance
  const { PerformanceObserver } = require('react-native-performance');
  
  // Monitorar métricas de performance
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log('Performance Entry:', entry.name, entry.duration);
    });
  });
  
  observer.observe({ entryTypes: ['measure', 'mark'] });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
