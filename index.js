import { registerRootComponent } from 'expo';
import App from './App';

// Configuração do Flipper para debugging apenas em desenvolvimento
if (__DEV__) {
  // Usar try-catch para evitar erros em produção
  try {
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
  } catch (error) {
    console.log('Flipper não disponível em produção:', error.message);
  }

  // Configuração do react-native-performance com fallback
  try {
    const { PerformanceObserver } = require('react-native-performance');
    
    // Monitorar métricas de performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log('Performance Entry:', entry.name, entry.duration);
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'mark'] });
  } catch (error) {
    console.log('Performance monitoring não disponível:', error.message);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);