import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ALERTS = [
  { id: '1', type: 'warning', title: 'Deadline Approaching', body: 'CS301 assignment due in 2 days. Your stress levels have been higher this week.', linkText: 'View support plan →', action: 'recovery' },
  { id: '2', type: 'info', title: 'Mood Pattern Detected', body: '3 consecutive low mood check-ins detected. Would you like to talk to someone?', linkText: 'Book a session →', action: 'booking' },
  { id: '3', type: 'success', title: 'Recovery Milestone', body: 'You completed step 2 of your recovery plan. Keep going!', linkText: 'View recovery plan →', action: 'recovery' },
];

const ALERT_COLORS: any = { warning: '#FC8181', info: '#9F7AEA', success: '#68D391' };

interface Props { onNavigate: (screen: string) => void; }

export default function SmartAlerts({ onNavigate }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>⚠️ Smart Alerts</Text>
      <FlatList
        data={ALERTS}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={[styles.alert, { borderLeftColor: ALERT_COLORS[item.type] }]}>
            <Text style={[styles.alertTitle, { color: ALERT_COLORS[item.type] }]}>{item.title}</Text>
            <Text style={styles.alertBody}>{item.body}</Text>
            {item.linkText ? (
              <TouchableOpacity onPress={() => onNavigate(item.action)}>
                <Text style={[styles.alertLink, { color: ALERT_COLORS[item.type] }]}>{item.linkText}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#EBF8FF', borderRadius: 12, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 14, fontWeight: '600', color: '#1A202C', marginBottom: 12 },
  alert: { borderLeftWidth: 3, paddingLeft: 10 },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  alertBody: { fontSize: 12, color: '#718096', lineHeight: 18 },
  alertLink: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});