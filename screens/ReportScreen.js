import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/style';
import ImageButton from '../components/ImageButton';
import * as FileSystem from 'expo-file-system';

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

const ReportScreen = ({ route }) => {
  const { isDark } = useTheme();
  const result = route?.params?.result ?? null;

  const reportText = useMemo(() => formatReportText(result), [result]);

  const handleDownload = async () => {
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

            {!!result.descricao && (
              <SectionCard isDark={isDark} icon="color-palette-outline" title="Descrição da Lesão">
                <Text style={{ color: isDark ? '#f3f4f6' : '#374151', lineHeight: 22 }}>{result.descricao}</Text>
              </SectionCard>
            )}

            {!!result.laudo && (
              <SectionCard isDark={isDark} icon="clipboard-outline" title="Laudo Completo">
                {renderLaudoPretty(result.laudo, isDark)}
              </SectionCard>
            )}
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


