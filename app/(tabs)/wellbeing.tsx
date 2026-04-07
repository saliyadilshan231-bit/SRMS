import { useState } from 'react';
import { useAuth } from '@/context/auth';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal } from 'react-native';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner';
import StatsRow from '../../components/dashboard/StatsRow';
import MoodTrendChart from '../../components/dashboard/MoodTrendChart';
import SmartAlerts from '../../components/dashboard/SmartAlerts';
import SRMSModules from '../../components/dashboard/SRMSModules';
import MoodSelector from '../../components/mood/MoodSelector';
import RecoveryPlan from '../../components/dashboard/RecoveryPlan';
import Counseling from '../../components/dashboard/Counseling';
import { MoodOption } from '../../types';
import { Colors } from '../../constants/theme';
import Insights from '../../components/dashboard/Insights';
import Settings from '../../components/dashboard/Settings';
import WellbeingTip from '../../components/dashboard/WellbeingTip';
import ZenFlow from '../../components/dashboard/ZenFlow';
import ClinicalHealthScreener from '../../components/dashboard/ClinicalHealthScreener';

type ViewType = 'dashboard' | 'mood' | 'booking' | 'recovery' | 'insights' | 'settings' | 'zenflow' | 'screener';

interface BookingData {
  reason: string;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'mood', label: 'Mood Check-in', icon: '😊' },
  { id: 'booking', label: 'Counseling', icon: '💬' },
  { id: 'recovery', label: 'Recovery Plan', icon: '🛡️' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'screener', label: 'Clinical Screener', icon: '🩺' },
  { id: 'zenflow', label: 'ZenFlow Calm', icon: '🧘' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Wellbeing() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [initialBookingData, setInitialBookingData] = useState<BookingData | null>(null);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const navigate = (view: ViewType, data: BookingData | null = null) => {
    setInitialBookingData(data);
    setActiveView(view);
    setSidebarOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <WelcomeBanner
              onLogMood={() => setActiveView('mood')}
              onViewSessions={() => setActiveView('booking')}
            />
            <WellbeingTip />
            <StatsRow />
            <MoodTrendChart />
            <SmartAlerts onNavigate={(screen) => setActiveView(screen as any)} />
            <SRMSModules />
          </ScrollView>
        );

      case 'mood':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Daily Mood Check-in</Text>
            <Text style={styles.sub}>Take a moment to reflect on how you're feeling.</Text>
            <MoodSelector onComplete={() => setActiveView('dashboard')} />
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Cancel and Return to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'booking':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Counseling 
              initialBookingData={initialBookingData} 
              onClearData={() => setInitialBookingData(null)}
            />
            <TouchableOpacity onPress={() => navigate('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'recovery':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <RecoveryPlan />
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );


      case 'insights':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Insights />
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'settings':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Settings />
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'zenflow':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <ZenFlow />
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'screener':
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <ClinicalHealthScreener
              onComplete={() => navigate('dashboard')}
              onNavigate={(view, data) => navigate(view as any, data)}
            />
          </ScrollView>
        );
    }

  };


  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar with hamburger */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.hamburger}>
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>SRMS Wellbeing</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Main content */}
      {renderView()}

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sidebar}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Text>💚</Text>
              </View>
              <View>
                <Text style={styles.brandName}>SRMS Wellbeing</Text>
                <Text style={styles.brandSub}>Support Portal</Text>
              </View>
            </View>

            {/* Nav Items */}
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, activeView === item.id && styles.navItemActive]}
                onPress={() => navigate(item.id as ViewType)}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, activeView === item.id && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Footer */}
            <View style={styles.sidebarFooter}>
              <View style={styles.footerAvatar}>
                <Text style={styles.footerAvatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.footerName}>{user?.name || 'Student'}</Text>
                <Text style={styles.footerSub}>Wellbeing Portal</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.light.background, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  hamburger: { padding: 4 },
  hamburgerText: { fontSize: 22, color: Colors.light.text },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.light.text },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  sub: { fontSize: 13, color: '#A0AEC0', lineHeight: 20, marginBottom: 20 },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 24 },
  progressFill: { height: 6, backgroundColor: Colors.light.tint, borderRadius: 3 },
  card: { backgroundColor: '#EBF8FF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  btn: { backgroundColor: Colors.light.tint, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24, alignSelf: 'flex-end', paddingHorizontal: 28 },
  btnDisabled: { backgroundColor: '#CBD5E0' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  backText: { color: Colors.light.tint, fontSize: 14, fontWeight: '600' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  placeholderText: { fontSize: 18, color: '#A0AEC0' },
  overlay: { flex: 1, flexDirection: 'row' },
  overlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { width: 260, backgroundColor: '#0A0A5C', paddingTop: 50, paddingBottom: 30 },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', gap: 10, marginBottom: 8 },
  brandIcon: { width: 36, height: 36, backgroundColor: Colors.light.tint, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brandSub: { color: '#A0AEC0', fontSize: 11 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 8, marginVertical: 2, borderRadius: 8, gap: 12 },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  navIcon: { fontSize: 16 },
  navLabel: { color: '#A0AEC0', fontSize: 14 },
  navLabelActive: { color: '#fff', fontWeight: '600' },
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', marginTop: 'auto', gap: 10 },
  footerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },
  footerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  footerName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  footerSub: { color: '#A0AEC0', fontSize: 11 },

  validationMsg: { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#FC8181' },
  validationText: { color: '#C53030', fontSize: 13, textAlign: 'center' },
});