const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Adiciona extensões de modelos de IA
config.resolver.assetExts.push(
  'pte',  // Modelos ExecuTorch
  'ptl',  // Modelos PyTorch Lite
  'bin',  // Binários de modelos
  'tflite' // TensorFlow Lite (se usar)
);

// Corrige warning de expo-asset
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  if (realModuleName.includes('expo-asset/build/resolveAssetSource')) {
    return {
      type: 'sourceFile',
      filePath: path.join(
        __dirname,
        'node_modules/expo-asset/build/resolveAssetSource.js'
      ),
    };
  }
  return context.resolveRequest(context, realModuleName, platform);
};

module.exports = config;