import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TaskInsightsScreen() {
  const router = useRouter();

  const accessItems = [
    {
      title: 'Tasks',
      subtitle: 'Create, organize, and manage your tasks list.',
      icon: 'checkmark.rectangle.fill',
      color: '#48BB78',
      route: '/(tabs)/tasks'
    },
    {
      title: 'Progress',
      subtitle: 'Track completion, submissions, and analytics.',
      icon: 'chart.bar.fill',
      color: '#6366F1',
      route: '/(tabs)/progress'
    },
    {
      title: 'Focus',
      subtitle: 'Start Pomodoro sessions and monitor study time.',
      icon: 'timer',
      color: '#805AD5',
      route: '/(tabs)/focus'
    },
    {
      title: 'Notification Hub',
      subtitle: 'View all your notifications and stay updated.',
      icon: 'bell.fill',
      color: '#5C6BC0',
      route: '/(tabs)/notificationHub'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Section */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol size={18} name="chevron.left" color="#8A9DBA" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Quick Access</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {accessItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}>

            {/* Icon container with light background */}
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
              <IconSymbol size={28} name={item.icon as any} color={item.color} />
            </View>

            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>

            <IconSymbol size={14} name="chevron.right" color="#CBD5E0" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0B173B',
  },
  backgroundImage: {
    opacity: 0.95,
    resizeMode: 'cover',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#1D2A51',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bellBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#1D2A51',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 1.5,
    borderColor: '#EBF4FF',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow for iOS and Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
    lineHeight: 18,
  },
});