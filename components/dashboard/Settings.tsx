import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors as COLORS } from '../../constants/theme';

interface ToggleItem {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  recommended?: boolean;
}

interface Section {
  id: string;
  icon: string;
  title: string;
  items: ToggleItem[];
}

const INITIAL_SECTIONS: Section[] = [
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Notifications',
    items: [
      { id: 'mood_reminder', title: 'Daily mood check-in reminders', subtitle: '', value: true },
      { id: 'wellbeing_alerts', title: 'Proactive wellbeing alerts', subtitle: '', value: true },
    ],
  },
  {
    id: 'data_sharing',
    icon: '👁️',
    title: 'Data Sharing',
    items: [
      { id: 'share_mood', title: 'Share mood scores with counselor', subtitle: 'Your counselor can see mood trends to prepare for sessions.', value: true },
      { id: 'share_journal', title: 'Share journal entries', subtitle: 'Journal content is private by default. Enable to share with counselor.', value: false },
      { id: 'academic_context', title: 'Academic context in alerts', subtitle: 'Allow the system to correlate academic events with mood data.', value: true },
    ],
  },
  {
    id: 'safety',
    icon: '🛡️',
    title: 'Safety',
    items: [
      { id: 'analytics', title: 'Contribute to anonymous analytics', subtitle: 'Aggregated, de-identified data to improve university support programs.', value: true },
      { id: 'crisis', title: 'Crisis escalation protocol', subtitle: 'Allow the system to notify counselors if crisis-level indicators are detected.', value: true, recommended: true },
    ],
  },
];

export default function Settings() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);

  const toggle = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, value: !item.value } : item
              ),
            }
          : section
      )
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>⚙️ Privacy & Settings</Text>
      <Text style={styles.sub}>Control what data is shared and how the system supports you.</Text>

      {sections.map((section) => (
        <View key={section.id} style={styles.card}>
          <Text style={styles.sectionTitle}>
            {section.icon} {section.title}
          </Text>
          {section.items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  {item.subtitle ? (
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Switch
                  value={item.value}
                  onValueChange={() => toggle(section.id, item.id)}
                  trackColor={{ false: '#CBD5E0', true: COLORS.light.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {index < section.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.light.text, marginBottom: 8 },
  sub: { fontSize: 13, color: COLORS.light.text, lineHeight: 20, marginBottom: 20 },
  card: { backgroundColor: COLORS.light.background, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.light.text, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  rowText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '500', color: COLORS.light.text, flex: 1 },
  itemSubtitle: { fontSize: 12, color: COLORS.light.text, marginTop: 3, lineHeight: 18 },
  recommendedBadge: { backgroundColor: '#F0FFF4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#68D391' },
  recommendedText: { fontSize: 10, color: '#276749', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
});