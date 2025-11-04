import { ImageUtil, Tensor } from "react-native-pytorch-core";

// 1. CONSTANTES DE NORMALIZAÇÃO (Padrão ImageNet)
// ATENÇÃO: Se o seu modelo 'malenet.pte' foi treinado com
// valores diferentes, você DEVE alterá-los aqui.
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// 2. MAPEAR O ÍNDICE DA SAÍDA PARA CLASSES
// ATENÇÃO: Esta é a suposição mais crítica. A ordem das classes
// DEVE ser exatamente a mesma usada no treinamento do modelo.
// Esta é uma lista comum para o dataset HAM10000 (7 classes).
// Verifique a ordem correta para o seu 'malenet.pte'.
const CLASSES = [
  "Queratose Actínica", // 0
  "Carcinoma Basocelular", // 1
  "Queratose Benigna", // 2
  "Dermatofibroma", // 3
  "Melanoma", // 4
  "Nevo Melanocítico", // 5
  "Lesão Vascular", // 6
];

// Mapeamento de prioridade (exemplo, ajuste conforme necessário)
const PRIORIDADE = {
  Melanoma: "Alta",
  "Carcinoma Basocelular": "Média",
  "Queratose Actínica": "Média",
};

/**
 * Converte a URI de uma imagem (já redimensionada) em um
 * tensor pronto para o modelo (Batch, Channel, Height, Width).
 *
 * Esta função substitui o 'STUB' de imageUriToTensor.
 */
export async function imageUriToTensor(uri) {
    // 1. Carrega a imagem da URI usando o utilitário do PyTorch
  const image = await ImageUtil.fromFile(uri);

  // 2. Converte para tensor. A forma é [C, H, W] (Canal, Altura, Largura)
  let tensor = image.toTensor();

  // 3. Normaliza os pixels de [0, 255] para [0.0, 1.0]
  tensor = tensor.div(255.0);

  // 4. Normaliza com os valores de Média (Mean) e Desvio Padrão (Std)
  tensor = tensor.normalize(MEAN, STD);

  // 5. Adiciona a dimensão do 'batch' (lote)
  // A forma muda de [C, H, W] para [1, C, H, W], que é o
  // formato [N, C, H, W] esperado pelo modelo.
  return tensor.unsqueeze(0);
}

/**
 * Processa o tensor de saída (logits) do modelo.
 * Aplica Softmax, encontra a classe com maior probabilidade
 * e formata o resultado.
 *
 * Esta função substitui o 'STUB' de processOutputTensor.
 */
export async function processOutputTensor(outputTensor) {
  // 'outputTensor' (saída do modelo) tem a forma [1, N_CLASSES] (ex: [1, 7])

  // 1. Aplica Softmax para converter logits em probabilidades
  // A função softmax(-1) aplica na última dimensão
  const probsTensor = outputTensor.softmax(-1);

  // 2. Extrai os dados do tensor para um array JavaScript
  // O await é crucial aqui para sincronizar.
  const probabilities = await probsTensor.data(); // Ex: [0.1, 0.05, 0.05, 0.02, 0.7, 0.03, 0.05]

  // 3. Encontra a maior probabilidade e seu índice
  let maxProb = -1;
  let maxIndex = -1;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      maxIndex = i;
    }
  }

  // 4. Mapeia o índice para os nomes das classes
  const classificacao = CLASSES[maxIndex] || "Desconhecida";
  const confianca = `${(maxProb * 100).toFixed(2)}%`;

  // 5. Retorna o objeto formatado que 'HomeScreen' espera
  return {
    classificacao,
    confianca,
    prioridade: PRIORIDADE[classificacao] || "Baixa",
  };
}