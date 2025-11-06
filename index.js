import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Configuração do Flipper apenas em desenvolvimento
if (__DEV__) {
  try {
    require('react-native-flipper');
    console.log('Flipper conectado');
  } catch (error) {
    console.log('Flipper não disponível:', error.message);
  }

  try {
    const { PerformanceObserver } = require('react-native-performance');
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log('Performance:', entry.name, entry.duration);
      });
    });
    observer.observe({ entryTypes: ['measure', 'mark'] });
  } catch (error) {
    console.log('Performance monitoring não disponível:', error.message);
  }
}

// Registra o componente principal
registerRootComponent(App);