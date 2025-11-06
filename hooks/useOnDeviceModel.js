import { useState, useEffect } from 'react';
import { Module } from 'react-native-executorch';

export function useOnDeviceModel(modelName) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadModel() {
      if (!modelName) {
        setError(new Error("Nome do modelo não fornecido"));
        return;
      }

      try {
        console.log(`[Model] Carregando modelo: ${modelName}`);
        const loadedModel = await Module.load(modelName);
        
        if (mounted) {
          setModel(loadedModel);
          setIsReady(true);
          console.log(`[Model] Modelo ${modelName} carregado com sucesso`);
        }
      } catch (e) {
        if (mounted) {
          setError(e);
          console.error(`[Model] Erro ao carregar ${modelName}:`, e);
        }
      }
    }

    loadModel();

    return () => {
      mounted = false;
    };
  }, [modelName]);

  return { isReady, model, error };
}