import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/style';
import ImageButton from '../components/ImageButton';
import * as FileSystem from 'expo-file-system';

// --- Funções Auxiliares (Mantidas) ---

const formatReportText = (result) => {
  const lines = [];
  lines.push('LAUDO DERMATOLÓGICO PRELIMINAR');
  lines.push('');
  if (result?.diagnostico) lines.push(`Diagnóstico: ${result.diagnostico}`);
  if (result?.prioridade) lines.push(`Prioridade: ${result.prioridade}`);
  if (result?.alternativas) lines.push(`Alternativas: ${result.alternativas}`);
  if (result?.modelo) lines.push(`Modelo: ${result.modelo}`);
  if (result?.descricao) {
    lines.push('');
    lines.push('Descrição da Lesão:');
    lines.push(result.descricao);
  }
  if (result?.laudo) {
    lines.push('');
    lines.push('Laudo Completo:');
    // Sanitiza quebras multiplas
    lines.push(String(result.laudo).replace(/\r\n/g, '\n'));
  }
  return lines.join('\n');
};

const PriorityBadge = ({ value, isDark }) => {
  if (!value) return null;
  const normalized = String(value).toUpperCase();
  const color = normalized.includes('URG') ? '#ef4444' : '#10b981';
  const bg = normalized.includes('URG') ? (isDark ? '#7f1d1d' : '#fee2e2') : (isDark ? '#064e3b' : '#d1fae5');
  const text = normalized.includes('URG') ? 'URGENTE' : value;
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }}>
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
};

const SectionCard = ({ icon, title, children, isDark }) => (
  <View style={{ padding: 16, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      {icon ? <Ionicons name={icon} size={18} color={isDark ? '#f3f4f6' : '#374151'} style={{ marginRight: 8 }} /> : null}
      <Text style={{ color: isDark ? '#f9fafb' : '#1f2937', fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </View>
    {children}
  </View>
);

const renderLaudoPretty = (raw, isDark) => {
  if (!raw) return null;
  const lines = String(raw).split(/\r?\n/);
  return (
    <View>
      {lines.map((line, idx) => {
        const headingMatch = line.match(/^\s*\*\*(.+?)\*\*:?\s*$/);
        if (headingMatch) {
          return (
            <Text key={idx} style={{ color: isDark ? '#f9fafb' : '#1f2937', fontWeight: '700', marginTop: idx === 0 ? 0 : 10 }}>
              {headingMatch[1]}
            </Text>
          );
        }
        return (
          <Text key={idx} style={{ color: isDark ? '#f3f4f6' : '#374151', lineHeight: 22 }}>{line || ' '}</Text>
        );
      })}
    </View>
  );
};

// --- Componente: Laudo Simplificado (Summary e Descrição) ---

const ReportSummary = ({ result, isDark }) => {
  if (!result.laudo) {
    return (
      <Text style={{ color: isDark ? '#f3f4f6' : '#374151', textAlign: 'center', marginTop: 20 }}>
        O laudo completo não foi fornecido pela análise.
      </Text>
    );
  }

  // Função para extrair o texto de uma seção específica (ex: DESCRIÇÃO CLÍNICA)
  const extractSectionText = (fullText, sectionTitle) => {
    // Escapa caracteres especiais para usar como regex
    const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Regex: Busca o título, ignora quebras de linha/espaços, e captura o texto
    // até encontrar o próximo cabeçalho em negrito (**SECAO:**) ou o fim do texto.
    const regex = new RegExp(`\\*\\*${escapedTitle}:\\*\\*\\s*\\n?([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i');
    
    const match = fullText.match(regex);
    
    // O texto capturado está no primeiro grupo (índice 1) da correspondência.
    if (match && match[1]) {
        // Limpa espaços em branco extras no início e fim
        return match[1].trim();
    }
    return 'Conteúdo da Descrição Clínica não encontrado no laudo.';
  };

  const clinicalDescription = extractSectionText(result.laudo, 'DESCRIÇÃO CLÍNICA');

  return (
    <SectionCard isDark={isDark} icon="clipboard-outline" title="DESCRIÇÃO CLÍNICA">
      {/* Exibe o texto extraído, usando a função de formatação */}
      {renderLaudoPretty(clinicalDescription, isDark)}
    </SectionCard>
  );
};

// --- Componente: Laudo Completo ---

const ReportFull = ({ result, isDark }) => (
  <View>
    {/* Resumo da Análise */}
    <SectionCard isDark={isDark} icon="document-text-outline" title="Resumo da Análise">
      {!!result.diagnostico && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: isDark ? '#f9fafb' : '#1f2937', fontWeight: '700' }}>{result.diagnostico}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {!!result.alternativas && (
          <Text style={{ color: isDark ? '#f3f4f6' : '#374151', marginRight: 12, flex: 1 }}>
            Alternativas: {result.alternativas}
          </Text>
        )}
        <PriorityBadge value={result.prioridade} isDark={isDark} />
      </View>
      {!!result.modelo && (
        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', marginTop: 8, fontSize: 12 }}>
          Modelo: {result.modelo}
        </Text>
      )}
    </SectionCard>

    {/* Descrição da Lesão */}
    {!!result.descricao && (
      <SectionCard isDark={isDark} icon="color-palette-outline" title="Descrição da Lesão">
        <Text style={{ color: isDark ? '#f3f4f6' : '#374151', lineHeight: 22 }}>{result.descricao}</Text>
      </SectionCard>
    )}
    <SectionCard isDark={isDark} icon="clipboard-outline" title="Laudo Completo">
      {renderLaudoPretty(result.laudo, isDark)}
    </SectionCard>
  </View>
);

// --- Componente Principal Refatorado com Abas ---

const ReportScreen = ({ route }) => {
  const { isDark } = useTheme();
  const result = route?.params?.result ?? null;
  // Estado para controlar a aba ativa: 'summary' ou 'full'
  const [activeTab, setActiveTab] = useState('summary'); 

  const reportText = useMemo(() => formatReportText(result), [result]);

  const handleDownload = async () => {
    // ... Lógica de download (mantida) ...
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = `laudo_${timestamp}.txt`;

      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const fileUri = `${dir}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, reportText, { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert('Laudo salvo', `Arquivo salvo em: ${fileUri}`);
    } catch (e) {
      Alert.alert('Erro', `Falha ao salvar laudo: ${e.message || e}`);
    }
  };

  // Estilos da Barra de Abas
  const tabContainerStyle = { 
    flexDirection: 'row', 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: isDark ? '#374151' : '#e5e7eb' 
  };
  const tabButtonStyle = (isActive) => ({
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: isActive ? 3 : 0,
    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
  });
  const tabTextStyle = (isActive) => ({
    color: isActive ? (isDark ? '#f9fafb' : '#1f2937') : (isDark ? '#9ca3af' : '#6b7280'),
    fontWeight: isActive ? '700' : '500',
    fontSize: 14,
  });


  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111827' : '#f3f4f6', alignItems: 'stretch' },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#1f2937' }]}>Laudo</Text>

        {!result ? (
          <Text style={{ color: isDark ? '#f3f4f6' : '#374151', textAlign: 'center' }}>
            Nenhum resultado disponível. Volte e gere uma análise.
          </Text>
        ) : (
          <View>
            {/* Barra de Abas */}
            <View style={tabContainerStyle}>
              <TouchableOpacity 
                onPress={() => setActiveTab('summary')}
                style={tabButtonStyle(activeTab === 'summary')}
              >
                <Text style={tabTextStyle(activeTab === 'summary')}>Laudo Simplificado</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setActiveTab('full')}
                style={tabButtonStyle(activeTab === 'full')}
              >
                <Text style={tabTextStyle(activeTab === 'full')}>Laudo Completo</Text>
              </TouchableOpacity>
            </View>

            {/* Conteúdo da Aba */}
            {activeTab === 'summary' && <ReportSummary result={result} isDark={isDark} />}
            {activeTab === 'full' && <ReportFull result={result} isDark={isDark} />}

          </View>
        )}

        <View style={{ marginTop: 8 }}>
          <ImageButton label="Baixar Laudo" onPress={handleDownload} color="analyze" />
        </View>
      </View>
    </ScrollView>
  );
};

export default ReportScreen;