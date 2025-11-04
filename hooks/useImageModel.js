import { useState, useEffect } from 'react';
import { Model } from 'react-native-executorch';

// Hook simplificado para carregar um modelo de imagem
export function useImageModel(modelName) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await Model.load(modelName);
        setModel(loadedModel);
        setIsReady(true);
      } catch (e) {
        setError(e);
        console.error('Erro ao carregar modelo:', e);
      }
    }
    loadModel();
  }, [modelName]);

  return { isReady, model, error };
}