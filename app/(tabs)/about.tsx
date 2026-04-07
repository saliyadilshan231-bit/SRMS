import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Area */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <IconSymbol size={18} name="chevron.left" color="#0B173B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About App</Text>
          <View style={{ width: 45 }} /> {/* for balancing the back button */}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Logo & Info */}
        <View style={styles.brandingSection}>
          <View style={styles.logoContainer}>
            <IconSymbol size={50} name="graduationcap.fill" color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>SRMS</Text>
          <Text style={styles.appSubName}>Student Resource Management System</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Description Section */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionLabel}>About the App</Text>
          <Text style={styles.descriptionText}>
            SRMS is your ultimate companion for academic success. Built specifically to help students manage their time, track their progress, and stay focused.
          </Text>
          <Text style={styles.descriptionText}>
            Whether you are tracking assignments, analyzing your grades, or preparing for exams with the Pomodoro focus timer, SRMS has everything you need to stay on top of your studies.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionLabel}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <IconSymbol size={18} name="chart.bar.fill" color="#0B173B" />
            </View>
            <Text style={styles.featureText}>Detailed Progress Tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <IconSymbol size={18} name="timer" color="#0B173B" />
            </View>
            <Text style={styles.featureText}>Focus Mode & Pomodoro Timer</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <IconSymbol size={18} name="bell.fill" color="#0B173B" />
            </View>
            <Text style={styles.featureText}>Smart Notifications & Reminders</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <IconSymbol size={18} name="chart.pie.fill" color="#0B173B" />
            </View>
            <Text style={styles.featureText}>Advanced Grade Analytics</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Made with ❤️ for Students</Text>
          <Text style={styles.footerSubText}>© 2026 SRMS Team</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#F7FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBtn: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  brandingSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#0B173B',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#0B173B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0B173B',
    marginBottom: 5,
    letterSpacing: 1,
  },
  appSubName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 10,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0AEC0',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B173B',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '500',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B173B',
    marginBottom: 5,
  },
  footerSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
  },
});
