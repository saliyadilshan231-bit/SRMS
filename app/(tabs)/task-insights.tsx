import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TaskInsightsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topStripWrap}>
        <View style={styles.topStripCard}>
          <TouchableOpacity
            style={styles.topStripIconBtn}
            activeOpacity={0.85}
            onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.left" color="#65707D" />
          </TouchableOpacity>

          <Text style={styles.topStripTitle}>Quick Access</Text>

          <TouchableOpacity
            style={styles.topStripIconBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/notifications')}>
            <IconSymbol size={22} name="bell.fill" color="#18326E" />
            <View style={styles.notifyDot} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/tasks')}>
          <IconSymbol size={42} name="checkmark.circle.fill" color="#2E5578" />
          <View style={styles.textWrap}>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>Create, organize, and manage your tasks list.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/progress')}>
          <IconSymbol size={42} name="chart.bar.fill" color="#2E5578" />
          <View style={styles.textWrap}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track completion, submissions, and analytics.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/focus')}>
          <IconSymbol size={42} name="timer" color="#2E5578" />
          <View style={styles.textWrap}>
            <Text style={styles.title}>Focus</Text>
            <Text style={styles.subtitle}>Start Pomodoro sessions and monitor study time.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/grade-analyst')}>
          <IconSymbol size={42} name="chart.bar.fill" color="#2E5578" />
          <View style={styles.textWrap}>
            <Text style={styles.title}>Grade Analyst</Text>
            <Text style={styles.subtitle}>Calculate GPA and plan target performance smartly.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDE7B5',
  },
  topStripWrap: {
    height: 84,
    marginBottom: 8,
    backgroundColor: '#FDE7B5',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  topStripCard: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  topStripIconBtn: {
    padding: 10,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topStripTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A38',
    letterSpacing: 0.3,
  },
  notifyDot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#FF5A5A',
  },
  content: {
    padding: 14,
    gap: 12,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#5E7D97',
    backgroundColor: '#F4F5EF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1D1D1D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#1F2E3A',
    fontWeight: '500',
  },
});
