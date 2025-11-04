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

  // NOVAS IMPORTAÇÕES
  // Hook para carregar o modelo CNN
  import { useOnDeviceModel } from '../hooks/useOnDeviceModel'; 
  // Funções utilitárias (Stubs - precisam ser implementadas)
  import { imageUriToTensor, processOutputTensor } from '../utils/tensorUtils';
  // Hook e modelo LLM (para pré-carregar)
  import { useLLM, LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch';

  // REMOVIDO: import { HEALTH_URL, PREDICT_URL as API_URL } from "../services/api";

  const HomeScreen = ({ navigation }) => {
    const [imageUri, setImageUri] = useState(null);
    const [diagnosisResult, setDiagnosisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { isDark } = useTheme();

    // REMOVIDO: serverStatus, checkingServer

    // NOVO: Carregar modelos on-device
    // Certifique-se que 'malenet.pte' está em 'assets/models/'
    const { 
      isReady: isCnnReady, 
      model: cnnModel, 
      error: cnnError 
    } = useOnDeviceModel('malenet.pte');
    
    // Pré-carrega o LLM para a próxima tela
    // Certifique-se que 'llama3_2_1b_spinquant.pte' está em 'assets/models/'
    const { 
      isReady: isLlmReady, 
      error: llmError 
    } = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

    // REMOVIDO: checkServerStatus e useEffect relacionado

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

      // NOVO: Checar status do modelo CNN local
      if (!isCnnReady) {
        const msg = cnnError 
          ? `Erro ao carregar modelo: ${cnnError.message}` 
          : "O modelo de análise ainda está carregando.";
        Alert.alert("Modelo não disponível", msg);
        return;
      }

      setIsLoading(true);
      setDiagnosisResult(null);

      try {
        // 1. Redimensionar imagem (provavelmente 224x224 para o MaleNet)
        const resizeStart = Date.now();
        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 224, height: 224 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        console.log("Tempo redimensionar:", Date.now() - resizeStart, "ms");

        // 2. Converter Imagem para Tensor (NOVO)
        // ATENÇÃO: Esta função (utils/tensorUtils.js) é um STUB 
        // e precisa ser implementada corretamente por você.
        const inputTensor = await imageUriToTensor(resizedImage.uri);

        // 3. Executar Inferência (SUBSTITUI O FETCH)
        const apiStart = Date.now();
        
        // O nome 'output_0' é um placeholder. Você deve usar o nome da camada de saída
        // real do seu modelo .pte exportado.
        const output = await cnnModel.forward(inputTensor, 'output_0');
        const outputTensor = output.output_0; 
        
        console.log("Tempo Inferência:", Date.now() - apiStart, "ms");

        // 4. Pós-processar resultado (NOVO)
        // ATENÇÃO: Esta função (utils/tensorUtils.js) é um STUB
        // e precisa ser implementada corretamente por você.
        const result = processOutputTensor(outputTensor);

        // Monta o objeto de resultado para a próxima tela
        const parsed = {
          diagnostico: `Classificação: ${result.classificacao} (${result.confianca})`,
          alternativas: "N/A (on-device)",
          descricao: "Aguardando geração de laudo...",
          laudo: "Aguardando geração de laudo...",
          prioridade: result.prioridade || "N/A",
          modelo: "MaleNet (on-device)",
        };
        setDiagnosisResult(parsed);
        // Navega para a tela de relatório passando o status do LLM
        navigation.navigate("Report", { 
          result: parsed,
          isLlmReady: isLlmReady, // Passa o status do LLM
          llmError: llmError ? llmError.message : null
        });

        console.log("Tempo análise total:", Date.now() - startAnalysis, "ms");
      } catch (error) {
        console.error("Erro na análise local:", error);
        Alert.alert(
          "Erro",
          error.message || "Erro desconhecido ao processar a imagem localmente."
        );
      } finally {
        setIsLoading(false);
      }
    };

    const handleRemoveImage = () => {
      setImageUri(null);
      setDiagnosisResult(null);
    };

    // Lógica de status do modelo para UI
    const modelStatus = isCnnReady ? "online" : (cnnError ? "error" : "checking");
    const modelStatusText = isCnnReady ? "Pronto" : (cnnError ? "Erro" : "Carregando...");

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

          {/* Indicador de status do MODELO (substitui o do servidor) */}
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
                    ? "#10b981" // Verde (Pronto)
                    : modelStatus === "error"
                    ? "#ef4444" // Vermelho (Erro)
                    : "#f59e0b", // Amarelo (Carregando)
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
            {/* Botão de refresh removido. Pode ser adicionado para tentar 
                recarregar o modelo se 'cnnError' for true. */}
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
                disabled={!isCnnReady || isLoading} // Desativa se o modelo não está pronto ou se já está analisando
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
