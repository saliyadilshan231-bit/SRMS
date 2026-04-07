import { useAuth } from '@/context/auth';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onLogMood: () => void;
  onViewSessions: () => void;
}

export default function WelcomeBanner({ onLogMood, onViewSessions }: Props) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  return (
    <LinearGradient colors={['#0A0A5C', '#1a1a8c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
      <Text style={styles.greeting}>{getGreeting()}</Text>
      <Text style={styles.name}>{firstName} 👋</Text>
      <Text style={styles.subtitle}>Your wellbeing score is looking good this week. You have a counseling session scheduled for tomorrow.</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onLogMood}>
          <Text style={styles.btnText}>Log Mood</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnSecondary} onPress={onViewSessions}>
          <Text style={styles.btnText}>View Sessions</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, padding: 20, marginBottom: 16 },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 12 },
  btnPrimary: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});