import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch'; // Importar BackgroundFetch
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREDICT_URL as API_URL } from './api'; // Confirme se o caminho para api.js está correto

const UPLOAD_TASK_NAME = 'derma-upload-task';
const QUEUE_KEY = '@uploadQueue'; // Usar prefixo '@' é uma convenção para AsyncStorage

// Lógica isolada de upload (adaptada de HomeScreen)
async function performUpload(imageUri) {
  console.log('[Background Task] Iniciando upload para:', imageUri);
  const resizeStart = Date.now();
  const resizedImage = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 224, height: 224 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  console.log('[Background Task] Tempo redimensionar:', Date.now() - resizeStart, 'ms');

  const formData = new FormData();
  // Não precisamos mais verificar Platform.OS aqui, pois background tasks rodam nativamente
  formData.append('image', {
    uri: resizedImage.uri,
    name: 'lesao.jpg',
    type: 'image/jpeg',
  });
  formData.append('consent', 'true'); // Mantém o consentimento

  const apiStart = Date.now();
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
    // NOTA: Timeouts em background tasks podem ser mais longos ou gerenciados pelo SO.
    // O fetch padrão do React Native não tem um timeout configurável diretamente fácil,
    // mas a lógica de retentativa da tarefa em si ajuda a mitigar isso.
  });
  console.log('[Background Task] Tempo API:', Date.now() - apiStart, 'ms');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Background Task] Falha no upload:', response.status, errorText);
    throw new Error(`Falha no upload da imagem no background (Status: ${response.status})`);
  }

  const result = await response.json();
  console.log('[Background Task] Upload bem-sucedido, Classificação:', result.classificacao);
  // **Ação Opcional:** Aqui você poderia:
  // 1. Salvar o resultado localmente (AsyncStorage/DB) para exibir no app depois.
  // 2. Enviar uma notificação push para o usuário informando o resultado.
  // 3. Limpar o arquivo local da imagem redimensionada (resizedImage.uri) se não for mais necessário.
  //    await FileSystem.deleteAsync(resizedImage.uri, { idempotent: true });
}

// Definição da tarefa em background
TaskManager.defineTask(UPLOAD_TASK_NAME, async () => {
  console.log('[Background Task] Tarefa iniciada.');
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueData) {
      console.log('[Background Task] Fila vazia (sem dados).');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const queue = JSON.parse(queueData);
    if (queue.length === 0) {
      console.log('[Background Task] Fila vazia (array vazio).');
      // Limpa o storage para evitar leituras desnecessárias no futuro
      await AsyncStorage.removeItem(QUEUE_KEY);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Pega o item mais antigo da fila (FIFO)
    const itemToUpload = queue[0];
    console.log('[Background Task] Processando item:', itemToUpload.id);

    try {
      await performUpload(itemToUpload.uri);

      // Sucesso: remove o item da fila
      const newQueue = queue.slice(1);
      if (newQueue.length > 0) {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
        console.log('[Background Task] Item processado e removido. Itens restantes:', newQueue.length);
      } else {
        await AsyncStorage.removeItem(QUEUE_KEY); // Limpa se a fila ficou vazia
        console.log('[Background Task] Item processado. Fila agora está vazia.');
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;

    } catch (uploadError) {
      console.error('[Background Task] Falha ao processar item da fila:', uploadError.message);
      // O item permanece na fila. O SO tentará executar a tarefa novamente mais tarde.
      // Implementar lógica de N retentativas ou mover para fila de "falha" seria um próximo passo.
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

  } catch (error) {
    console.error('[Background Task] Erro geral na tarefa:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Função para registrar a tarefa (chamar no App.js)
export async function registerUploadTask() {
  try {
    await BackgroundFetch.registerTaskAsync(UPLOAD_TASK_NAME, {
      minimumInterval: 5 * 60, // Intervalo mínimo em segundos (ex: 5 minutos)
      stopOnTerminate: false, // Mantém a tarefa ativa mesmo se o app for fechado
      startOnBoot: true,      // Tenta executar a tarefa após o boot do dispositivo (Android)
    });
    console.log('[Background Task] Tarefa registrada com sucesso.');
  } catch (error) {
    console.error('[Background Task] Falha ao registrar tarefa:', error);
  }
   // Para testar: Descomente a linha abaixo para forçar a execução da tarefa (use com cuidado)
  // await BackgroundFetch.setMinimumIntervalAsync(1); // Força execução ~1s após registro
}

// Função auxiliar para adicionar um item à fila
export async function addToUploadQueue(uri) {
  if (!uri) return;

  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = queueData ? JSON.parse(queueData) : [];

    // Adiciona o novo item com um ID e o URI original
    const newItem = { id: Date.now().toString(), uri: uri };
    queue.push(newItem);

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[Queue] Item adicionado à fila:', newItem.id, 'Total:', queue.length);

    // Opcional: Iniciar manualmente a tarefa logo após adicionar (útil para feedback rápido se online)
    // Se a tarefa já estiver rodando ou agendada, isso pode não ter efeito imediato.
    // BackgroundFetch.scheduleTaskAsync(UPLOAD_TASK_NAME, { minimumInterval: 1 });

  } catch (error) {
    console.error('[Queue] Erro ao adicionar item à fila:', error);
    // Lançar o erro permite que a UI mostre uma falha no agendamento
    throw new Error('Não foi possível agendar o upload.');
  }
}