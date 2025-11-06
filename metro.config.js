const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona extensões de modelos de IA
config.resolver.assetExts.push(
  'pte',    // ExecuTorch models
  'ptl',    // PyTorch Lite
  'bin',    // Binary models
  'tflite'  // TensorFlow Lite
);

module.exports = config;