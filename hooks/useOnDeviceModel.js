// hooks/useOnDeviceModel.js
import { useState, useEffect } from 'react';
import { Model } from 'react-native-executorch';

export function useOnDeviceModel(modelName) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function loadModel() {
      if (!modelName) {
        setError(new Error("Nome do modelo não fornecido."));
        return;
      }
      try {
        const loadedModel = await Model.load(modelName);
        setModel(loadedModel);
        setIsReady(true);
      } catch (e) {
        setError(e);
        console.error(`Erro ao carregar modelo ${modelName}:`, e);
      }
    }
    loadModel();
  }, [modelName]);

  return { isReady, model, error };
}