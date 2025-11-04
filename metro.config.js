const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

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
  return null;
};

module.exports = config;
