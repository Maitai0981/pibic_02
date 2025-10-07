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
import * as ImageManipulator from "expo-image-manipulator";
import { HEALTH_URL, PREDICT_URL as API_URL } from "../services/api";

const HomeScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [checkingServer, setCheckingServer] = useState(false);
  const { isDark } = useTheme();

  // Verificar status do servidor
  const checkServerStatus = async () => {
    const start = Date.now();
    setCheckingServer(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log("Verificando servidor em:", HEALTH_URL);
      const response = await fetch(HEALTH_URL, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("error");
      }
    } catch (error) {
      console.log("Erro ao verificar servidor:", error);
      if (error.name === "AbortError") {
        setServerStatus("timeout");
      } else {
        setServerStatus("offline");
      }
    } finally {
      setCheckingServer(false);
      console.log("Tempo servidor:", Date.now() - start, "ms");
    }
  };

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
    const start = Date.now();
    const granted = await requestPermissions();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDiagnosisResult(null);
      console.log("Tempo captura:", Date.now() - start, "ms");
    }
  };

  const handleSelectImage = async () => {
    const start = Date.now();
    const granted = await requestPermissions();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDiagnosisResult(null);
      console.log("Tempo seleção:", Date.now() - start, "ms");
    }
  };

  const handleAnalyze = async () => {
    const startAnalysis = Date.now();

    if (!imageUri) {
      Alert.alert("Erro", "Selecione ou capture uma imagem primeiro.");
      return;
    }

    if (serverStatus !== "online") {
      const statusMessage =
        serverStatus === "offline"
          ? "O servidor não está disponível no momento."
          : serverStatus === "error"
          ? "O servidor retornou um erro."
          : serverStatus === "timeout"
          ? "O servidor não respondeu no tempo esperado."
          : "O servidor não está acessível.";

      Alert.alert(
        "Servidor Indisponível",
        `${statusMessage} Verifique sua conexão e tente novamente.`
      );
      return;
    }

    setIsLoading(true);
    setDiagnosisResult(null);

    try {
      // Redimensionar imagem
      const resizeStart = Date.now();
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log("Tempo redimensionar:", Date.now() - resizeStart, "ms");

      // Montar FormData
      const formData = new FormData();
      if (Platform.OS === "web") {
        const blobResp = await fetch(resizedImage.uri);
        const blob = await blobResp.blob();
        const file = new File([blob], "lesao.jpg", { type: "image/jpeg" });
        formData.append("image", file);
      } else {
        formData.append("image", {
          uri: resizedImage.uri,
          name: "lesao.jpg",
          type: "image/jpeg",
        });
      }
      formData.append("consent", "true");

      // Chamada à API
      const apiStart = Date.now();
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      console.log("Tempo API:", Date.now() - apiStart, "ms");

      if (!response.ok) {
        let errorMessage = "Erro ao processar a imagem.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          console.log("Não foi possível ler erro como JSON");
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Resposta da API:", result);

      const parsed = {
        diagnostico: `Classificação: ${result.classificacao} (${result.confianca})`,
        alternativas: result.diagnostico_alternativo || "N/A",
        descricao: result.descricao_lesao || "Descrição não disponível",
        laudo: result.laudo_completo || "Laudo não disponível",
        prioridade: result.prioridade || "N/A",
        modelo: result.modelo_utilizado || "N/A",
      };
      setDiagnosisResult(parsed);
      navigation.navigate("Report", { result: parsed });

      console.log("Tempo análise total:", Date.now() - startAnalysis, "ms");
    } catch (error) {
      console.error("Erro na análise:", error);
      Alert.alert(
        "Erro",
        error.message || "Erro desconhecido ao processar a imagem."
      );
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
                serverStatus === "online"
                  ? "#10b981"
                  : serverStatus === "offline"
                  ? "#ef4444"
                  : serverStatus === "error"
                  ? "#f59e0b"
                  : serverStatus === "timeout"
                  ? "#f97316"
                  : "#6b7280",
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
            Servidor:{" "}
            {serverStatus === "online"
              ? "Online"
              : serverStatus === "offline"
              ? "Offline"
              : serverStatus === "error"
              ? "Erro"
              : serverStatus === "timeout"
              ? "Timeout"
              : "Verificando..."}
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
                opacity: checkingServer ? 0.5 : 1,
              }}
            >
              {checkingServer ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#f3f4f6" : "#374151"}
                />
              ) : (
                <Ionicons
                  name="refresh"
                  size={16}
                  color={isDark ? "#f3f4f6" : "#374151"}
                />
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
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
