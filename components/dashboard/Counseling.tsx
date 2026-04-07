import { useAuth } from '@/context/auth';
import {
    BookingDoc,
    CounselorDoc,
    createBooking,
    getBookingsByStudent,
    listCounselors,
    updateBookingStatus
} from '@/lib/appwrite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  navy: '#0A0A5C',
  navyMid: '#1E3A8A',
  navyLight: '#DBEAFE',
  accent: '#0a7ea4',
  textPrimary: '#0A0A5C',
  textSecondary: '#4A5568',
  white: '#FFFFFF',
  cardBg: '#F8FAFC',
  bg: '#F5F7FA',
};

interface CounselingProps {
  initialBookingData?: { reason: string } | null;
  onClearData?: () => void;
}

export default function Counseling({ initialBookingData, onClearData }: CounselingProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'virtual' | 'inperson'>('virtual');

  const [counselors, setCounselors] = useState<CounselorDoc[]>([]);
  const [bookedSessions, setBookedSessions] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCounselor, setSelectedCounselor] = useState<CounselorDoc | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingReason, setBookingReason] = useState('General Check-in');

  // ── Date picker state ─────────────────────────────────────
  const getNext14Days = () => {
    const days = [];
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        label: DAY_LABELS[d.getDay()],
        dateNum: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
      });
    }
    return days;
  };
  const AVAILABLE_DATES = getNext14Days();
  const [selectedDate, setSelectedDate] = useState<string>(AVAILABLE_DATES[0].dateStr);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const cData = await listCounselors();
      const bData = await getBookingsByStudent(user!.$id);
      setCounselors(cData);
      setBookedSessions(bData);
    } catch (err) {
      console.warn('Error loading counseling data', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle initial booking data (Deep link from Screener)
  useEffect(() => {
    if (initialBookingData && counselors.length > 0) {
      const counselor = counselors[0]; // Auto-select first counselor
      setSelectedCounselor(counselor);
      setBookingReason(initialBookingData.reason);
      setShowModal(true);
      
      // Clear the data so it doesn't re-open if the user stays on the page
      if (onClearData) onClearData();
    }
  }, [initialBookingData, counselors]);

  const handleBookSession = async (slot: string) => {
    if (!selectedCounselor || !user) return;

    const existing = bookedSessions.find(s => s.counselorId === selectedCounselor.userId && s.status === 'upcoming');
    if (existing) {
      Alert.alert('Conflict', `You already have an upcoming session with ${selectedCounselor.name}.`);
      return;
    }

    const [date, time] = slot.split(', ');

    try {
      await createBooking({
        counselorId: selectedCounselor.userId,
        studentId: user.$id,
        date: date,
        time: time,
        reason: bookingReason,
        mode: mode === 'inperson' ? 'In-Person' : 'Virtual'
      });

      setShowModal(false);
      setSelectedCounselor(null);
      Alert.alert('Session Booked! ✅', `Your session with ${selectedCounselor.name} is confirmed.`);
      loadStudentData(); // refresh
    } catch (err: any) {
      Alert.alert('Appwrite Booking Error', err?.message || 'Could not book the session. Please check permissions and database attributes.');
    }
  };

  const handleCancelBooking = async (bookingId: string | undefined) => {
    if (!bookingId) return;
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this appointment?', [
      { text: 'No, keep it', style: 'cancel' },
      {
        text: 'Yes, cancel', onPress: async () => {
          try {
            await updateBookingStatus(bookingId, 'cancelled');
            loadStudentData();
          } catch (err) {
            Alert.alert("Error", "Could not cancel booking.");
          }
        }, style: 'destructive'
      }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navy Header Banner */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.headerEyebrow}>WELLBEING PORTAL</Text>
          <Text style={styles.heading}>Counseling Center</Text>
          <Text style={styles.sub}>Connect with a counselor matched to your needs.</Text>
        </View>
        <Text style={{ fontSize: 36 }}>🩺</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.navy} />
      ) : (
        <>
          {/* Toggle Virtual / In Person */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'virtual' && styles.toggleBtnActive]}
              onPress={() => setMode('virtual')}
            >
              <Text style={[styles.toggleText, mode === 'virtual' && styles.toggleTextActive]}>📹 Virtual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'inperson' && styles.toggleBtnActive]}
              onPress={() => setMode('inperson')}
            >
              <Text style={[styles.toggleText, mode === 'inperson' && styles.toggleTextActive]}>📍 In-Person</Text>
            </TouchableOpacity>
          </View>

          {/* Booked Sessions */}
          {bookedSessions.length > 0 && (
            <View style={styles.bookedSection}>
              <Text style={styles.sectionTitle}>📅 Your Sessions</Text>
              {bookedSessions.map((session, idx) => {
                const c = counselors.find(c => c.userId === session.counselorId);
                return (
                  <View key={session.$id || idx} style={[styles.bookedCard, session.status !== 'upcoming' && { opacity: 0.6 }]}>
                    <View style={styles.bookedAvatar}>
                      <Text style={styles.bookedAvatarText}>{c?.avatar ?? '🧑‍⚕️'}</Text>
                    </View>
                    <View style={styles.bookedInfo}>
                      <Text style={styles.bookedName}>{c?.name ?? 'Counselor'}</Text>
                      <Text style={styles.bookedSlot}>🕐 {session.date} at {session.time}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.bookedMode}>Status: {session.status.toUpperCase()}</Text>
                        {session.status === 'upcoming' && (
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelBooking(session.$id)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Counselor Grid */}
          <Text style={styles.sectionTitle}>Available Counselors</Text>
          {counselors.length === 0 ? (
            <Text style={styles.sub}>No counselors available right now.</Text>
          ) : (
            <FlatList
              data={counselors}
              keyExtractor={(item) => item.$id ?? item.userId}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => {
                const isBooked = bookedSessions.some(s => s.counselorId === item.userId && s.status === 'upcoming');
                return (
                  <TouchableOpacity
                    style={[styles.card, isBooked && styles.cardUnavailable]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isBooked) return;
                      setSelectedCounselor(item);
                      setShowModal(true);
                    }}
                  >
                    <View style={styles.avatarRing}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.avatar ?? '👩‍⚕️'}</Text>
                      </View>
                    </View>
                    {isBooked && (
                      <View style={styles.bookedBadge}>
                        <Text style={styles.bookedBadgeText}>✅ Booked</Text>
                      </View>
                    )}
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.specialty}>{item.specialty}</Text>
                    {!isBooked && (
                      <View style={styles.bookHint}>
                        <Text style={styles.bookHintText}>Tap to book →</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </>
      )}

      {/* Booking Modal (STUDENT ONLY) */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Navy top accent strip */}
            <View style={styles.modalStrip} />
            {selectedCounselor && (
              <>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{selectedCounselor.avatar ?? '👩‍⚕️'}</Text>
                </View>
                <Text style={styles.modalName}>{selectedCounselor.name}</Text>
                <View style={styles.modalSpecialtyBadge}>
                  <Text style={styles.modalSpecialty}>{selectedCounselor.specialty}</Text>
                </View>

                <Text style={styles.modalSectionTitle}>Choose a date:</Text>
                {/* Horizontal date strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.datePicker}
                >
                  {AVAILABLE_DATES.map((d) => {
                    const isSelected = d.dateStr === selectedDate;
                    return (
                      <TouchableOpacity
                        key={d.dateStr}
                        style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                        onPress={() => setSelectedDate(d.dateStr)}
                      >
                        <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>{d.label}</Text>
                        <Text style={[styles.dateChipNum, isSelected && styles.dateChipTextSelected]}>{d.dateNum}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.modalSectionTitle}>Select a time slot:</Text>
                {(() => {
                  let times: string[] = [];
                  try {
                    times = JSON.parse(selectedCounselor.availability);
                    if (!Array.isArray(times)) times = [];
                  } catch { }

                  if (times.length === 0) {
                    return <Text style={styles.sub}>No available slots.</Text>;
                  }

                  return times.map((time: string) => {
                    const slot = `${selectedDate}, ${time}`;
                    const dateObj = AVAILABLE_DATES.find(d => d.dateStr === selectedDate);
                    const displayDate = dateObj ? `${dateObj.label} ${dateObj.dateNum}` : selectedDate;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={styles.slotBtn}
                        onPress={() => handleBookSession(slot)}
                      >
                        <Text style={styles.slotBtnText}>🕐 {displayDate} · {time}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40, backgroundColor: COLORS.bg },

  // Navy header banner
  headerBanner: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingHorizontal: 20 },
  heading: { fontSize: 26, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginTop: 4 },

  toggle: { flexDirection: 'row', backgroundColor: COLORS.navyLight, borderRadius: 16, padding: 5, marginBottom: 24, marginHorizontal: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.navy, shadowColor: COLORS.navy, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  toggleText: { fontSize: 14, color: COLORS.navyMid, fontWeight: '700' },
  toggleTextActive: { color: COLORS.white },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy, marginBottom: 14, paddingHorizontal: 20, letterSpacing: -0.3 },

  bookedSection: { backgroundColor: '#EFF6FF', borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE', marginHorizontal: 20 },
  bookedCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: COLORS.navy, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, borderWidth: 1, borderColor: '#EFF6FF' },
  bookedAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bookedAvatarText: { fontSize: 24 },
  bookedInfo: { flex: 1 },
  bookedName: { fontSize: 15, fontWeight: '700', color: COLORS.navy, letterSpacing: -0.2 },
  bookedSlot: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
  bookedMode: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  cancelBtnText: { color: '#991B1B', fontSize: 12, fontWeight: '700' },

  row: { gap: 14, paddingHorizontal: 20 },
  card: { flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 18, shadowColor: COLORS.navy, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4, borderWidth: 1, borderColor: COLORS.navyLight, alignItems: 'center' },
  cardUnavailable: { opacity: 0.5 },
  avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28 },
  bookedBadge: { backgroundColor: '#F0FFF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, position: 'absolute', top: 12, right: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  bookedBadgeText: { fontSize: 10, color: '#065F46', fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 4, letterSpacing: -0.2, textAlign: 'center' },
  specialty: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 18, textAlign: 'center' },
  bookHint: { marginTop: 'auto', backgroundColor: COLORS.navy, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  bookHintText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 10, 92, 0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 48, overflow: 'hidden' },
  modalStrip: { height: 6, backgroundColor: COLORS.navy, width: '100%', marginBottom: 24 },
  modalAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14, alignSelf: 'center', borderWidth: 3, borderColor: COLORS.navy },
  modalAvatarText: { fontSize: 36 },
  modalName: { fontSize: 22, fontWeight: '800', color: COLORS.navy, textAlign: 'center', marginBottom: 8, letterSpacing: -0.4, paddingHorizontal: 24 },
  modalSpecialtyBadge: { backgroundColor: COLORS.navyLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 24, alignSelf: 'center', borderWidth: 1, borderColor: '#93C5FD' },
  modalSpecialty: { fontSize: 13, color: COLORS.navyMid, fontWeight: '600', textAlign: 'center' },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 14, paddingHorizontal: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotBtn: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: COLORS.navyLight, marginHorizontal: 24 },
  slotBtnText: { color: COLORS.navy, fontWeight: '700', fontSize: 15 },
  closeBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 15, backgroundColor: COLORS.navyLight, borderRadius: 14, marginHorizontal: 24 },
  closeBtnText: { color: COLORS.navyMid, fontSize: 15, fontWeight: '700' },

  // Date picker strip
  datePicker: { paddingHorizontal: 24, paddingBottom: 20, gap: 8 },
  dateChip: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.navyLight, backgroundColor: '#F8FAFC', minWidth: 52 },
  dateChipSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  dateChipDay: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateChipNum: { fontSize: 18, fontWeight: '800', color: COLORS.navy, marginTop: 2 },
  dateChipTextSelected: { color: COLORS.white },
});