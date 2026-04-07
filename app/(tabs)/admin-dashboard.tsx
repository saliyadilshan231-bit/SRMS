import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import {
  CounselorDoc,
  BookingDoc,
  getCounselorByUserId,
  getBookingsByCounselor,
  updateCounselorAvailability,
  updateBookingStatus,
  createCounselorProfile,
  getMoodLogsByStudentIds
} from '@/lib/appwrite';

// ── Colour Palette ─────────────────────
const C = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  cardLight: '#EEF2F6',
  accent: '#0A0A5C', // Navy blue from the screener
  accentGlow: '#0a7ea4', // Teal/blue for contrast
  text: '#0A0A5C', // Navy text for primary headings
  textSub: '#4A5568',
  danger: '#E53E3E',
  success: '#38A169',
  warning: '#DD6B20',
  divider: '#E2E8F0',
};

// Helper to determine mood emoji/color
const getMoodDetails = (level: number | string) => {
  const lbl = String(level);
  switch (lbl) {
    case '1': return { emoji: '😭', color: '#EF4444', label: 'Awful' };
    case '2': return { emoji: '😔', color: '#F97316', label: 'Bad' };
    case '3': return { emoji: '😐', color: '#EAB308', label: 'Okay' };
    case '4': return { emoji: '🙂', color: '#84CC16', label: 'Good' };
    case '5': return { emoji: '🤩', color: '#22C55E', label: 'Awesome' };
    default: return { emoji: '😐', color: C.textSub, label: 'Unknown' };
  }
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [counselor, setCounselor] = useState<CounselorDoc | null>(null);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [patientMoods, setPatientMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle view between Sessions and Patient Check-ins
  const [viewMode, setViewMode] = useState<'sessions' | 'moods'>('sessions');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const profile = await getCounselorByUserId(user!.$id);
      setCounselor(profile);

      if (profile?.userId) {
        const b = await getBookingsByCounselor(profile.userId);
        setBookings(b);

        // Fetch mood logs ONLY for students that have booked with this counselor
        const studentIds = Array.from(new Set(b.map(session => session.studentId)));
        if (studentIds.length > 0) {
          const moods = await getMoodLogsByStudentIds(studentIds);
          setPatientMoods(moods);
        } else {
          setPatientMoods([]);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function forceCreateProfile() {
    try {
      await createCounselorProfile({
        userId: user!.$id,
        name: user!.name || 'Counselor',
        specialty: 'General Wellbeing',
        availability: ['9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM'],
        avatar: '👩‍⚕️'
      });
      Alert.alert("Success", "Counselor document was created correctly in the database!");
      loadData();
    } catch (e: any) {
      Alert.alert("Failed to Create", e.message);
    }
  }

  async function handleAction(bookingId: string | undefined, action: 'completed' | 'cancelled') {
    if (!bookingId) return;
    try {
      await updateBookingStatus(bookingId, action);
      await loadData();
    } catch (err) {
      Alert.alert("Error", "Could not update session.");
    }
  }

  async function toggleAvailability(time: string) {
    if (!counselor || !counselor.$id) return;

    let currentAvail: string[] = [];
    try {
      currentAvail = JSON.parse(counselor.availability);
      if (!Array.isArray(currentAvail)) currentAvail = [];
    } catch {
      currentAvail = [];
    }

    const isAvailable = currentAvail.includes(time);
    let newAvail = [...currentAvail];

    if (isAvailable) {
      newAvail = newAvail.filter(t => t !== time);
    } else {
      newAvail.push(time);
      newAvail.sort((a, b) => {
        const parseTime = (t: string) => {
          const [match, h, m, period] = t.match(/(\d+):(\d+)\s*(AM|PM)/) || [];
          if (!match) return 0;
          let hour = parseInt(h);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return hour * 60 + parseInt(m);
        };
        return parseTime(a) - parseTime(b);
      });
    }

    try {
      await updateCounselorAvailability(counselor.$id, newAvail);
      setCounselor({ ...counselor, availability: JSON.stringify(newAvail) });
    } catch (err) {
      Alert.alert("Error", "Could not update availability.");
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.textSub, marginTop: 12 }}>Loading dashboard…</Text>
      </View>
    );
  }

  const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const totalCount = bookings.length;

  let parsedAvailability: string[] = [];
  try {
    if (counselor?.availability) {
      parsedAvailability = JSON.parse(counselor.availability);
    }
  } catch { }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.greeting}>Counselor Portal</Text>
          <Text style={styles.name}>{counselor?.name ?? user?.name ?? 'Counselor'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {counselor?.specialty && <Text style={styles.specialty}>{counselor.specialty}</Text>}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🛡️ ADMIN</Text>
        </View>
      </View>

      {!counselor && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>You don't have a Counselor profile in the database.</Text>
          <TouchableOpacity style={[styles.btnConfirm, { marginTop: 14 }]} onPress={forceCreateProfile}>
            <Text style={styles.btnConfirmText}>Create My Profile Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Stats Grid ─────────────────────────────────────── */}
      {counselor && (
        <>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderTopColor: '#0a7ea4' }]}>
              <Text style={styles.statValue}>{upcomingCount}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#38A169' }]}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#8B5CF6' }]}>
              <Text style={styles.statValue}>{patientMoods.length}</Text>
              <Text style={styles.statLabel}>Total Mood Logs</Text>
            </View>
          </View>

          {/* ── Toggle Navbar ────────────────────────────────── */}
          <View style={styles.toggleNav}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'sessions' && styles.toggleBtnActive]}
              onPress={() => setViewMode('sessions')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'sessions' && styles.toggleBtnTextActive]}>📅 Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'moods' && styles.toggleBtnActive]}
              onPress={() => setViewMode('moods')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'moods' && styles.toggleBtnTextActive]}>🧠 Patient Logs</Text>
            </TouchableOpacity>
          </View>

          {/* ── Sessions View ───────────────────────────────── */}
          {viewMode === 'sessions' && (
            <View style={styles.sectionContainer}>
              {bookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No sessions found.</Text>
                </View>
              ) : (
                bookings.map((session, idx) => (
                  <View key={session.$id || idx} style={[styles.logCard, session.status !== 'upcoming' && { opacity: 0.6 }]}>
                    <View style={styles.logHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logStudent}>Student ID: {session.studentId}</Text>
                        <Text style={styles.logDate}>
                          🕐 {session.date} at {session.time} • {session.mode}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, session.status === 'upcoming' ? { backgroundColor: C.accent } : { backgroundColor: C.cardLight }]}>
                        <Text style={styles.statusBadgeText}>{session.status.toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={styles.journal} numberOfLines={2}>
                      Reason: {session.reason}
                    </Text>

                    {session.status === 'upcoming' && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => handleAction(session.$id, 'completed')} style={styles.btnConfirm}>
                          <Text style={styles.btnConfirmText}>Mark Completed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAction(session.$id, 'cancelled')} style={styles.btnCancel}>
                          <Text style={styles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}

              {/* Manage Availability */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>⏱️ Manage Availability</Text>
              <View style={styles.availabilitySection}>
                {['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(time => {
                  const isAvail = parsedAvailability.includes(time);
                  return (
                    <View key={time} style={styles.availRow}>
                      <Text style={styles.availTime}>{time}</Text>
                      <Switch
                        value={isAvail}
                        onValueChange={() => toggleAvailability(time)}
                        trackColor={{ false: C.cardLight, true: C.accent }}
                        thumbColor={isAvail ? '#fff' : '#A0AEC0'}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Moods View ───────────────────────────────── */}
          {viewMode === 'moods' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.subText}>Private mood entries strictly for your assigned patients.</Text>
              {patientMoods.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Your patients haven't logged any moods yet.</Text>
                </View>
              ) : (
                patientMoods.map((log, i) => {
                  const mood = getMoodDetails(log.moodLevel);
                  return (
                    <View key={i} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <View style={[styles.emojiBox, { backgroundColor: mood.color + '20' }]}>
                          <Text style={styles.emojiText}>{mood.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.moodLabel}>{mood.label}</Text>
                          <Text style={styles.logStudent}>Patient ID: <Text style={{ fontWeight: '400', color: C.textSub }}>{log.studentId}</Text></Text>
                          <Text style={styles.logDate}>📅 {new Date(log.date).toLocaleDateString()}</Text>
                        </View>
                      </View>

                      {log.factors && (
                        <View style={styles.factorsRow}>
                          {(() => {
                            try {
                              const arr = JSON.parse(log.factors);
                              return arr.map((f: string, j: number) => (
                                <View key={j} style={styles.factorChip}>
                                  <Text style={styles.factorText}>{f}</Text>
                                </View>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </View>
                      )}

                      {log.journal && log.journal.length > 0 && (
                        <View style={styles.journalBox}>
                          <Text style={styles.journalTitle}>Journal Entry</Text>
                          <Text style={styles.journalText}>{log.journal}</Text>
                        </View>
                      )}
                    </View>
                  )
                })
              )}
            </View>
          )}

        </>
      )}

      {/* ── Logout ─────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },
  // Full-width navy header banner
  headerBanner: {
    backgroundColor: '#0A0A5C',
    marginHorizontal: -20,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 28,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingHorizontal: 20 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  name: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  specialty: { fontSize: 13, color: '#93C5FD', marginTop: 4, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A5C', marginBottom: 14, marginTop: 8, paddingHorizontal: 20 },
  subText: { color: C.textSub, fontSize: 13, marginBottom: 16, marginTop: -8, paddingHorizontal: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24, paddingHorizontal: 20 },
  statCard: { flex: 1, minWidth: '30%', backgroundColor: '#0A0A5C', borderRadius: 14, padding: 16, borderTopWidth: 4 },
  statValue: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '500' },
  toggleNav: { flexDirection: 'row', backgroundColor: '#E8EEF7', borderRadius: 14, padding: 5, marginBottom: 20, marginHorizontal: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#0A0A5C', shadowColor: '#0A0A5C', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  toggleBtnText: { color: C.textSub, fontWeight: '600', fontSize: 14 },
  toggleBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionContainer: { marginTop: 4, paddingHorizontal: 20 },
  logCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0A0A5C', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  logHeader: { flexDirection: 'row', alignItems: 'center' },
  logStudent: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: 4 },
  logDate: { fontSize: 12, color: C.textSub, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: C.text, fontSize: 10, fontWeight: '700' },
  journal: { color: C.textSub, fontSize: 13, marginTop: 10, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnConfirm: { backgroundColor: '#0A0A5C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, shadowColor: '#0A0A5C', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  btnConfirmText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  btnCancel: { backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnCancelText: { color: '#C53030', fontSize: 13, fontWeight: '700' },
  emptyCard: { backgroundColor: C.card, borderRadius: 14, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: C.divider, shadowColor: '#0A0A5C', shadowOpacity: 0.06, shadowRadius: 15, elevation: 3 },
  emptyText: { color: C.textSub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  availabilitySection: { backgroundColor: C.card, borderRadius: 14, padding: 8, marginBottom: 24 },
  availRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.cardLight },
  availTime: { fontSize: 15, color: C.text, fontWeight: '500' },
  logoutBtn: { backgroundColor: '#0A0A5C', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20, shadowColor: '#0A0A5C', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: {width: 0, height: 4} },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emojiBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  emojiText: { fontSize: 26 },
  moodLabel: { color: C.text, fontSize: 16, fontWeight: '700' },
  factorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  factorChip: { backgroundColor: C.cardLight, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  factorText: { color: C.textSub, fontSize: 12, fontWeight: '500' },
  journalBox: { marginTop: 16, backgroundColor: '#FAFCFF', padding: 14, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#0a7ea4', borderWidth: 1, borderColor: '#EDF2F7' },
  journalTitle: { color: C.textSub, fontSize: 11, textTransform: 'uppercase', fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  journalText: { color: '#2D3748', fontSize: 14, lineHeight: 22, fontStyle: 'italic' }
});
