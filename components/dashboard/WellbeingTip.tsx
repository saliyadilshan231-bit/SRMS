import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const TIPS = [
  { emoji: '🧘', tip: 'Take 5 deep breaths before your next class. It helps reset your focus.' },
  { emoji: '💧', tip: 'Have you had enough water today? Hydration affects mood and concentration.' },
  { emoji: '🌿', tip: 'A 10-minute walk outside can reduce stress levels significantly.' },
  { emoji: '😴', tip: 'Aim for 7-8 hours of sleep. It directly impacts your academic performance.' },
  { emoji: '📝', tip: 'Break big tasks into smaller steps. Progress feels better than perfection.' },
  { emoji: '🤝', tip: 'Reach out to a friend today. Social connection boosts wellbeing.' },
];

export default function WellbeingTip() {
  const [index, setIndex] = useState(0);
  const tip = TIPS[index];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 Daily Wellbeing Tip</Text>
        <TouchableOpacity onPress={() => setIndex((index + 1) % TIPS.length)}>
          <Text style={styles.next}>Next →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tipRow}>
        <Text style={styles.emoji}>{tip.emoji}</Text>
        <Text style={styles.tipText}>{tip.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  next: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  emoji: { fontSize: 28 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});