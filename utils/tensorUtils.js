import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Constantes de normalização ImageNet
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Classes do dataset HAM10000
const CLASSES = [
  "Queratose Actínica",
  "Carcinoma Basocelular",
  "Queratose Benigna",
  "Dermatofibroma",
  "Melanoma",
  "Nevo Melanocítico",
  "Lesão Vascular",
];

const PRIORIDADE = {
  "Melanoma": "Alta",
  "Carcinoma Basocelular": "Média",
  "Queratose Actínica": "Média",
  "Dermatofibroma": "Baixa",
  "Queratose Benigna": "Baixa",
  "Nevo Melanocítico": "Baixa",
  "Lesão Vascular": "Baixa",
};

/**
 * Converte URI de imagem em tensor Float32Array
 * IMPORTANTE: Esta é uma implementação simplificada para desenvolvimento
 * Para produção, use processamento nativo ou servidor
 */
export async function imageUriToTensor(uri) {
  try {
    console.log('[Tensor] Iniciando conversão da imagem');
    
    // 1. Garantir dimensões corretas
    const resized = await manipulateAsync(
      uri,
      [{ resize: { width: 224, height: 224 } }],
      { format: SaveFormat.JPEG, compress: 0.9 }
    );

    // 2. Ler imagem como base64
    const base64 = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Decodificar pixels (implementação simplificada)
    const pixels = await decodeBase64ToPixels(base64);

    // 4. Normalizar e converter para NCHW
    const tensor = normalizeAndFormatTensor(pixels);
    
    console.log('[Tensor] Conversão concluída');
    return tensor;
  } catch (error) {
    console.error('[Tensor] Erro na conversão:', error);
    throw new Error('Falha ao processar imagem');
  }
}

/**
 * Decodifica base64 para array de pixels
 * NOTA: Implementação simplificada - use lib nativa para produção
 */
async function decodeBase64ToPixels(base64) {
  // Para desenvolvimento, retorna pixels simulados
  // Em produção, implemente decodificação JPEG/PNG real
  console.warn('[Tensor] Usando pixels simulados - implemente decodificação real');
  
  const size = 224 * 224 * 3;
  const pixels = new Uint8Array(size);
  
  // Simula pixels variados baseados no hash do base64
  const hash = base64.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  for (let i = 0; i < size; i++) {
    pixels[i] = Math.abs((hash + i) % 256);
  }
  
  return pixels;
}

/**
 * Normaliza pixels e formata para NCHW
 */
function normalizeAndFormatTensor(pixels) {
  const tensor = new Float32Array(1 * 3 * 224 * 224);
  let idx = 0;

  // NCHW: Batch, Channel, Height, Width
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < 224; h++) {
      for (let w = 0; w < 224; w++) {
        const pixelIdx = (h * 224 + w) * 3 + c;
        const value = pixels[pixelIdx] / 255.0;
        const normalized = (value - MEAN[c]) / STD[c];
        tensor[idx++] = normalized;
      }
    }
  }

  return tensor;
}

/**
 * Processa saída do modelo (logits) e retorna classificação
 */
export function processOutputTensor(outputTensor) {
  try {
    console.log('[Tensor] Processando saída do modelo');
    
    // Converter para array
    const logits = Array.isArray(outputTensor) 
      ? outputTensor 
      : Array.from(outputTensor);
    
    // Aplicar softmax
    const maxLogit = Math.max(...logits);
    const expScores = logits.map(x => Math.exp(x - maxLogit));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    const probabilities = expScores.map(x => x / sumExp);
    
    // Encontrar classe com maior probabilidade
    let maxProb = -1;
    let maxIndex = -1;
    
    probabilities.forEach((prob, idx) => {
      if (prob > maxProb) {
        maxProb = prob;
        maxIndex = idx;
      }
    });
    
    const classificacao = CLASSES[maxIndex] || "Desconhecida";
    const confianca = `${(maxProb * 100).toFixed(2)}%`;
    
    console.log(`[Tensor] Classificação: ${classificacao} (${confianca})`);
    
    return {
      classificacao,
      confianca,
      prioridade: PRIORIDADE[classificacao] || "Baixa",
      probabilidades: probabilities.map((p, i) => ({
        classe: CLASSES[i],
        prob: (p * 100).toFixed(2) + '%'
      })).sort((a, b) => parseFloat(b.prob) - parseFloat(a.prob))
    };
  } catch (error) {
    console.error('[Tensor] Erro no processamento:', error);
    throw new Error('Falha no pós-processamento');
  }
}