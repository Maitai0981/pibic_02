import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import ImageButton from "../components/ImageButton";
import ImagePreview from "../components/ImagePreview";
import styles from "../styles/style";
import { useTheme } from "../context/ThemeContext";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import apiConfig, { HEALTH_URL, PREDICT_URL as API_URL } from "../services/api";

// Importar performance para monitoramento
import performance from 'react-native-performance';
const HomeScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [checkingServer, setCheckingServer] = useState(false);
  const { isDark } = useTheme();

  // const API_URL = 'http://10.0.2.2:5000//predict';
  // const API_URL = 'http://192.168.4.2:5000//predict';

  // Verificar status do servidor
  const checkServerStatus = async () => {
    performance.mark('server-check-start');
    setCheckingServer(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      console.log('Verificando servidor em:', HEALTH_URL);
      const response = await fetch(HEALTH_URL, { 
        method: "GET",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("error");
      }
    } catch (error) {
      console.log("Erro ao verificar servidor:", error);
      if (error.name === 'AbortError') {
        setServerStatus("timeout");
      } else {
        setServerStatus("offline");
      }
    } finally {
      setCheckingServer(false);
      performance.mark('server-check-end');
      performance.measure('server-check-time', 'server-check-start', 'server-check-end');
    }
  };

  // Verificar status do servidor ao carregar o componente
  useEffect(() => {
    checkServerStatus();
  }, []);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (
      cameraPermission.status !== "granted" ||
      mediaPermission.status !== "granted"
    ) {
      Alert.alert(
        "Permissões negadas",
        "Você precisa permitir o uso da câmera e da galeria."
      );
      return false;
    }
    return true;
  };

  const handleCaptureImage = async () => {
    performance.mark('image-capture-start');
    const granted = await requestPermissions();
    if (!granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDiagnosisResult(null);
      performance.mark('image-capture-end');
      performance.measure('image-capture-time', 'image-capture-start', 'image-capture-end');
    }
  };

  const handleSelectImage = async () => {
    performance.mark('image-select-start');
    const granted = await requestPermissions();
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDiagnosisResult(null);
      performance.mark('image-select-end');
      performance.measure('image-select-time', 'image-select-start', 'image-select-end');
    }
  };

  const handleAnalyze = async () => {
    performance.mark('image-analysis-start');
    
    if (!imageUri) {
      Alert.alert("Erro", "Selecione ou capture uma imagem primeiro.");
      return;
    }

    if (serverStatus !== "online") {
      const statusMessage = 
        serverStatus === "offline" ? "O servidor não está disponível no momento." :
        serverStatus === "error" ? "O servidor retornou um erro." :
        serverStatus === "timeout" ? "O servidor não respondeu no tempo esperado." :
        "O servidor não está acessível.";
      
      Alert.alert(
        "Servidor Indisponível", 
        `${statusMessage} Verifique sua conexão e tente novamente.`
      );
      return;
    }

    setIsLoading(true);
    setDiagnosisResult(null);

    try {
      // Redimensionar imagem para 224x224
      performance.mark('image-resize-start');
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      performance.mark('image-resize-end');
      performance.measure('image-resize-time', 'image-resize-start', 'image-resize-end');

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blobResp = await fetch(resizedImage.uri);
        const blob = await blobResp.blob();
        const file = new File([blob], 'lesao.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        formData.append("image", {
          uri: resizedImage.uri,
          name: "lesao.jpg",
          type: "image/jpeg",
        });
      }
      formData.append("consent", "true");

      performance.mark('api-call-start');
      const response = await fetch(API_URL, {
        method: "POST",
        // Não definir Content-Type manualmente para multipart/form-data
        body: formData,
      });
      performance.mark('api-call-end');
      performance.measure('api-call-time', 'api-call-start', 'api-call-end');

      console.log(`Status da resposta: ${response.status}`);

      if (!response.ok) {
        let errorMessage = "Erro ao processar a imagem.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.log("Não foi possível ler erro como JSON");
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Resposta da API:", result);

      // Adaptar para a estrutura de resposta real do servidor

      const parsed = {
        diagnostico: `Classificação: ${result.classificacao} (${result.confianca})`,
        alternativas: result.diagnostico_alternativo || "N/A",
        descricao: result.descricao_lesao || "Descrição não disponível",
        laudo: result.laudo_completo || "Laudo não disponível",
        prioridade: result.prioridade || "N/A",
        modelo: result.modelo_utilizado || "N/A"
      };
      setDiagnosisResult(parsed);
      navigation.navigate('Report', { result: parsed });

      performance.mark('image-analysis-end');
      performance.measure('image-analysis-time', 'image-analysis-start', 'image-analysis-end');
    } catch (error) {
      console.error("Erro na análise:", error);
      Alert.alert("Erro", error.message || "Erro desconhecido ao processar a imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setDiagnosisResult(null);
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

        {/* Indicador de status do servidor */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "center", 
          marginBottom: 20,
          padding: 10,
          backgroundColor: isDark ? "#374151" : "#e5e7eb",
          borderRadius: 8
        }}>
          <View style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: 
              serverStatus === "online" ? "#10b981" :
              serverStatus === "offline" ? "#ef4444" :
              serverStatus === "error" ? "#f59e0b" :
              serverStatus === "timeout" ? "#f97316" : "#6b7280",
            marginRight: 8
          }} />
          <Text style={{
            color: isDark ? "#f3f4f6" : "#374151",
            fontSize: 14,
            fontWeight: "500"
          }}>
            Servidor: {
              serverStatus === "online" ? "Online" :
              serverStatus === "offline" ? "Offline" :
              serverStatus === "error" ? "Erro" :
              serverStatus === "timeout" ? "Timeout" : "Verificando..."
            }
          </Text>
          {serverStatus !== "online" && (
            <TouchableOpacity
              onPress={checkServerStatus}
              disabled={checkingServer}
              style={{
                marginLeft: 10,
                padding: 5,
                backgroundColor: isDark ? "#4b5563" : "#d1d5db",
                borderRadius: 4,
                opacity: checkingServer ? 0.5 : 1
              }}
            >
              {checkingServer ? (
                <ActivityIndicator size="small" color={isDark ? "#f3f4f6" : "#374151"} />
              ) : (
                <Ionicons name="refresh" size={16} color={isDark ? "#f3f4f6" : "#374151"} />
              )}
            </TouchableOpacity>
          )}
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

        {/* {diagnosisResult && (
          <View style={styles.previewContainer}>
            <Text
              style={[
                styles.previewText,
                { color: isDark ? "#f9fafb" : "#1f2937", marginTop: 20 },
              ]}
            >
              Resultados da Análise:
            </Text>

            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                marginBottom: 10,
                fontWeight: "bold",
              }}
            >
              {diagnosisResult.diagnostico}
            </Text>

            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                marginBottom: 10,
                fontWeight: "bold",
              }}
            >
              Prioridade: {diagnosisResult.prioridade}
            </Text>

            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                marginBottom: 10,
              }}
            >
              Alternativa: {diagnosisResult.alternativas}
            </Text>

            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                marginBottom: 10,
                fontStyle: "italic",
              }}
            >
              {diagnosisResult.descricao}
            </Text>

            <Text
              style={{
                color: isDark ? "#f3f4f6" : "#374151",
                marginBottom: 10,
                fontSize: 12,
              }}
            >
              Modelo: {diagnosisResult.modelo}
            </Text>

            <Text style={{ color: isDark ? "#f3f4f6" : "#374151" }}>
              {diagnosisResult.laudo}
            </Text>
          </View>
        )} */}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
