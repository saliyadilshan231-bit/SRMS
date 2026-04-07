import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors as COLORS } from '../../constants/theme';
import { ModuleItem } from '../../expo/types/router';

const MODULES: ModuleItem[] = [
  { id: '1', icon: '✅', title: 'Task Manager', subtitle: '3 overdue tasks' },
  { id: '2', icon: '🗓️', title: 'Attendance',   subtitle: '92% this month' },
  { id: '3', icon: '📈', title: 'Grades',        subtitle: 'GPA 3.2 — stable' },
  { id: '4', icon: '📋', title: 'Schedule',      subtitle: 'Heavy week ahead' },
];

export default function SRMSModules() {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>SRMS Module Integration</Text>
      <FlatList
        data={MODULES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.subtitle}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.light.text, marginBottom: 12 },
  row: { gap: 12 },
  card: { backgroundColor: '#EBF8FF', borderRadius: 12, padding: 14, width: 120, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  icon: { fontSize: 20, marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.light.text },
  cardSub: { fontSize: 11, color: COLORS.light.text, marginTop: 3, opacity: 0.6 },
});