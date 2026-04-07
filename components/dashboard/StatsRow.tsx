import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors as COLORS } from '../../constants/theme';

const STATS = [
  { icon: '🩷', value: '72/100',   label: 'Wellbeing Score',  subtitle: '+5 from last week',  iconColor: '#FC8181' },
  { icon: '📈', value: '12 days',  label: 'Mood Streak',      subtitle: 'Longest: 18 days',   iconColor: '#68D391' },
  { icon: '📅', value: 'Tomorrow', label: 'Next Session',     subtitle: '2:00 PM — Dr. Chen', iconColor: '#76E4F7' },
  { icon: '⚡', value: 'Active',   label: 'Recovery Status',  subtitle: '2 of 4 steps done',  iconColor: '#F6AD55' },
];

export default function StatsRow() {
  return (
    <FlatList
      data={STATS}
      keyExtractor={(item) => item.label}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={[styles.icon, { color: item.iconColor }]}>{item.icon}</Text>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      )}
    />
  );
}

const theme = COLORS.light;

const styles = StyleSheet.create({
  row: { gap: 12, marginBottom: 16 },
  card: { backgroundColor: '#EBF8FF', borderRadius: 12, padding: 14, width: 130, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  icon: { fontSize: 22, marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '700', color: theme.text },
  label: { fontSize: 12, color: theme.tint, marginTop: 2 },
  subtitle: { fontSize: 11, color: theme.icon, marginTop: 4 },
});