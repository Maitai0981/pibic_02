// screens/ReportScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLLM, LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch';
import { useTheme } from '../context/ThemeContext'; // Reutiliza seu contexto

const ReportScreen = ({ route }) => {
  const { result, isLlmReady: isLlmReadyFromHome, llmError: llmErrorFromHome } = route.params;
  const { isDark } = useTheme();

  const [laudoGerado, setLaudoGerado] = useState("");
  const [estaGerando, setEstaGerando] = useState(false);
  
  // Inicializa o hook do LLM para interagir com ele
  const llm = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

  const gerarLaudo = useCallback(async () => {
    if (llm.isGenerating || !llm.isReady) return;
    
    setEstaGerando(true);
    setLaudoGerado(""); // Limpa o laudo anterior

    // --- 1. PREPARAÇÃO DOS DADOS ---
    // Extrai "Melanoma (90%)" de "Classificação: Melanoma (90%)"
    const diag_principal = result.diagnostico.replace("Classificação: ", "");
    
    // Como o LLaVA não está implementado, informamos ao LLM
    const desc_laudo = "[Descrição morfológica não fornecida. Basear-se apenas na classificação da IA.]";
    const diag_alt = "Nenhuma hipótese alternativa identificada";

    // --- 2. DEFINIÇÃO DOS PROMPTS (Conforme solicitado) ---

    // SYSTEM PROMPT MAIS ESPECÍFICO E DETALHADO
    const systemPrompt = `IDENTIDADE: Você é DermAI, um sistema especializado em gerar laudos dermatológicos preliminares padronizados.

DIRETRIZES OBRIGATÓRIAS:
1. Use EXCLUSIVAMENTE terminologia médica dermatológica precisa
2. Mantenha estrutura EXATA conforme especificado
3. Seja CONCISO: máximo 2-3 frases por seção
4. SEMPRE enfatize natureza preliminar e necessidade de avaliação médica
5. NÃO faça diagnósticos definitivos
6. Use linguagem técnica mas acessível
7. NUNCA omita seções obrigatórias

FORMATO DE SAÍDA OBRIGATÓRIO:
- Usar exatamente os cabeçalhos especificados
- Cada seção deve ter conteúdo substantivo
- Manter consistência terminológica
- Incluir todas as limitações e disclaimers`;

    // USER PROMPT MAIS ESTRUTURADO E ESPECÍFICO (Adaptado)
    const userPrompt = `DADOS PARA ANÁLISE:

**DESCRIÇÃO MORFOLÓGICA DA LESÃO:**
${desc_laudo}

**RESULTADO DA CLASSIFICAÇÃO IA:**
• Hipótese Principal: ${diag_principal}
• Hipóteses Alternativas: ${diag_alt}

GERE UM LAUDO SEGUINDO EXATAMENTE ESTA ESTRUTURA:

**DESCRIÇÃO CLÍNICA:**
[Baseado na hipótese principal, descreva brevemente as características clínicas esperadas da lesão. Máximo 3 frases.]

**ANÁLISE COMPUTACIONAL:**
[Apresente os resultados da IA de forma técnica, incluindo a hipótese principal (${diag_principal}). Mencione que é análise preliminar. Máximo 3 frases.]

**CORRELAÇÃO CLÍNICO-PATOLÓGICA:**
[Relacione a hipótese diagnóstica com o prognóstico geral e diagnósticos diferenciais relevantes. Máximo 3 frases.]

**RECOMENDAÇÕES MÉDICAS:**
[Especifique encaminhamentos necessários (dermatologista) e a urgência baseada na hipótese (${diag_principal}). Máximo 3 frases.]

**LIMITAÇÕES E DISCLAIMER:**
[Enfatize que é análise de IA para triagem, não substitui avaliação médica, necessidade de confirmação diagnóstica presencial. Máximo 2 frases.]

INSTRUÇÕES ESPECÍFICAS:
- Use terminologia dermatológica precisa (ex: mácula, pápula, nódulo, etc.)
- Inclua sempre a expressão "análise preliminar por IA"
- Mencione "confirmação diagnóstica requer avaliação médica presencial"
- Mantenha tom profissional e técnico
- NÃO use bullet points dentro das seções`;

    // --- 3. EXECUÇÃO DA GERAÇÃO ---
    try {
      llm.configure({
        chatConfig: {
          systemPrompt: systemPrompt,
        },
      });
      
      llm.clearHistory();
      await llm.sendMessage(userPrompt.trim());
      
    } catch (e) {
      setLaudoGerado(`Erro ao gerar descrição: ${e.message}`);
    }
    // 'estaGerando' será controlado por 'useEffect' ouvindo 'llm.isGenerating'
  }, [llm.isReady, llm.isGenerating, result.diagnostico]);

  // Dispara a geração do laudo quando o LLM estiver pronto
  useEffect(() => {
    if (isLlmReadyFromHome && llm.isReady && !estaGerando && !laudoGerado && !llm.isGenerating) {
      gerarLaudo();
    }
  }, [isLlmReadyFromHome, llm.isReady, gerarLaudo, estaGerando, laudoGerado, llm.isGenerating]);

  // Atualiza o laudo em tempo real (streaming)
  useEffect(() => {
    if (llm.response) {
      setLaudoGerado(llm.response);
    }
  }, [llm.response]);

  // Controla o estado de 'loading'
  useEffect(() => {
    setEstaGerando(llm.isGenerating);
  }, [llm.isGenerating]);

  const styles = getStyles(isDark);
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Resultado da Análise (CNN)</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Diagnóstico:</Text>
          <Text style={styles.value}>{result.diagnostico}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Prioridade:</Text>
          <Text style={styles.value}>{result.prioridade}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Modelo:</Text>
          <Text style={styles.value}>{result.modelo}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Laudo Preliminar (LLM)</Text>
        {
          !isLlmReadyFromHome ? (
            <View>
              <ActivityIndicator color={isDark ? "#fff" : "#000"} />
              <Text style={styles.value}>Carregando modelo LLM...</Text>
              {llmErrorFromHome && <Text style={styles.error}>{llmErrorFromHome}</Text>}
            </View>
          ) : (estaGerando || llm.isGenerating) ? ( // Simplificado
            <View>
              <ActivityIndicator color={isDark ? "#fff" : "#000"} />
              <Text style={styles.value}>{laudoGerado || "Gerando laudo..."}</Text>
            </View>
          ) : (
            <Text style={styles.value}>{laudoGerado || "Não foi possível gerar o laudo."}</Text>
          )
        }
      </View>
    </ScrollView>
  );
};

// Use seu 'styles/style.js' ou adicione estes estilos
const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#111827" : "#f3f4f6",
    padding: 16,
  },
  card: {
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.8)',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? "#f9fafb" : "#1f2937",
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? "#d1d5db" : "#4b5563",
    width: 100,
  },
  value: {
    fontSize: 14,
    color: isDark ? "#f3f4f6" : "#1f2937",
    flex: 1,
    lineHeight: 20,
    // Para renderizar quebras de linha do LLM
    whiteSpace: 'pre-wrap', 
  },
  error: {
    color: '#ef4444',
    marginTop: 8,
  }
});

export default ReportScreen;