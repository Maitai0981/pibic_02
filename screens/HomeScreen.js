import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../styles/style';
import { ThemeContext } from '../context/ThemeContext';
// CORREÇÃO: Alterado de './components/...' para '../components/...'
import ImageButton from '../components/ImageButton';
import ImagePreview from '../components/ImagePreview';
import { useOnDeviceModel } from '../hooks/useOnDeviceModel';

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  const { loadModel, runModel } = useOnDeviceModel();

  const containerStyle = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const textStyle = isDarkMode ? styles.darkText : styles.lightText;
  const titleStyle = isDarkMode ? styles.darkTitle : styles.lightTitle;

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null); 
      }
    } catch (error) {
      console.error("Erro ao escolher imagem: ", error);
      Alert.alert("Erro", "Não foi possível carregar a imagem da galeria.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      console.error("Erro ao tirar foto: ", error);
      Alert.alert("Erro", "Não foi possível abrir a câmera.");
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert("Nenhuma imagem", "Por favor, selecione uma imagem ou tire uma foto primeiro.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const model = await loadModel();
      if (model) {
        const predictions = await runModel(image, model);
        setResult(predictions);
      } else {
        Alert.alert("Erro", "Não foi possível carregar o modelo de IA.");
      }
    } catch (error) {
      console.error("Erro ao analisar imagem: ", error);
      Alert.alert("Erro", `Ocorreu um erro durante a análise: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
  };

  const formatResult = (predictions) => {
    if (!predictions || predictions.length === 0) {
      return "Nenhum resultado encontrado.";
    }
    
    // Formata a predição (ajuste conforme a saída real do seu modelo)
    // Exemplo: { className: "Melanoma", probability: 0.9 }
    return predictions.map(p => 
      `${p.className}: ${(p.probability * 100).toFixed(2)}%`
    ).join('\n');
  };
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#111827" : "#f3f4f6" },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#f9fafb" : "#1f2937" }]}>
          Captura e Seleção de Imagens
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            padding: 10,
            backgroundColor: isDark ? "#374151" : "#e5e7eb",
            borderRadius: 8,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor:
                modelStatus === "online"
                  ? "#10b981"
                  : modelStatus === "error"
                  ? "#ef4444"
                  : "#f59e0b",
              marginRight: 8,
            }}
          />
          <Text
            style={{
              color: isDark ? "#f3f4f6" : "#374151",
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Modelo CNN: {modelStatusText}
          </Text>
        </View>

        <ImageButton
          label="Capturar Imagem"
          onPress={handleCaptureImage}
          color="primary"
        />
        <ImageButton
          label="Importar Imagem"
          onPress={handleSelectImage}
          color="secondary"
        />

        {imageUri && (
          <>
            <View style={{ position: "relative" }}>
              <ImagePreview uri={imageUri} />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: 6,
                  borderRadius: 20,
                }}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ImageButton
              label="Analisar Imagem"
              onPress={handleAnalyze}
              color="analyze"
              disabled={!isCnnReady || isLoading}
            />
          </>
        )}

        {isLoading && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator
              size="large"
              color={isDark ? "#ffffff" : "#2563eb"}
            />
            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Analisando imagem...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};