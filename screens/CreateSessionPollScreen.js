import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionSchedulingCreateModulesParams } from '@/constants/sessionSchedulingFaculties';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import { createSessionPoll } from '@/services/sessionPollStorage';
import { appendSessionPollNotification } from '@/services/studentNotificationsStorage';

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

const NAVY = '#0A0A5C';
const SKY = '#7DD3FC';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#475569';
const GLASS_BASE = '#F0F7FF';

const VOTE_MINUTE_PRESETS = [15, 30, 60, 120, 240, 1440];

export function CreatePollGlassBackground() {
  const blurIntensity = Platform.OS === 'android' ? 26 : 38;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFFFFF', '#F5FAFF', '#E8F4FC', '#F0F9FF']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.88)', 'rgba(224,242,254,0.42)', 'rgba(255,255,255,0.78)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView
        intensity={blurIntensity}
        tint="light"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.45)', 'transparent', 'rgba(147,197,253,0.12)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function CreateSessionPollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const moduleIdParam = paramStr(params.moduleId);
  const facultyIdParam = paramStr(params.facultyId);
  const facultyTitleParam = paramStr(params.facultyTitle);

  const [title, setTitle] = useState('');
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [votingMinutes, setVotingMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');

  const selectedMod = useMemo(
    () => (moduleIdParam ? TIMED_QUIZ_MODULES.find((m) => m.id === moduleIdParam) : null),
    [moduleIdParam]
  );

  // Redirect if no module selected
  useEffect(() => {
    if (!moduleIdParam || !selectedMod) {
      router.replace({
        pathname: '/session-scheduling-modules',
        params: sessionSchedulingCreateModulesParams,
      });
    }
  }, [moduleIdParam, selectedMod, router]);

  const closeSuccessAndLeave = useCallback(() => {
    setSuccessVisible(false);
    router.back();
  }, [router]);

  const openPublishedPoll = useCallback(() => {
    if (!moduleIdParam || !selectedMod) return;

    setSuccessVisible(false);
    router.replace({
      pathname: '/session-scheduling-polls',
      params: {
        moduleId: moduleIdParam,
        moduleTitle: encodeURIComponent(selectedMod.title || ''),
        ...(facultyIdParam && { facultyId: facultyIdParam }),
        ...(facultyTitleParam && { facultyTitle: facultyTitleParam }),
      },
    });
  }, [router, moduleIdParam, selectedMod, facultyIdParam, facultyTitleParam]);

  const onPublish = useCallback(async () => {
    const t = title.trim();
    if (!t) {
      Alert.alert('Title required', 'Please enter a session name (e.g. Database Kuppi).');
      return;
    }

    const slots = [slot1, slot2, slot3].map((s) => s.trim()).filter(Boolean);
    if (slots.length < 2) {
      Alert.alert('Need at least 2 options', 'Please fill at least two day/time options.');
      return;
    }

    const mod = TIMED_QUIZ_MODULES.find((m) => m.id === moduleIdParam);
    if (!mod) {
      Alert.alert('Module error', 'Module not found. Please go back and select again.');
      return;
    }

    setLoading(true);

    try {
      const created = await createSessionPoll({
        title: t,
        slotLabels: slots,                    // Must be array - matches your table
        moduleId: mod.id,
        moduleTitle: mod.title,
        votingDurationMinutes: votingMinutes, // Must match attribute name
      });

      await appendSessionPollNotification({
        pollId: created.$id || created.id,
        moduleId: mod.id,
        moduleTitle: mod.title,
        pollTitle: t,
      });

      setPublishedTitle(t);
      setSuccessVisible(true);
    } catch (e) {
      console.error('Failed to create poll:', e);
      Alert.alert(
        'Failed to publish poll',
        e?.message || e?.response?.message || 'Please check your internet and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [title, slot1, slot2, slot3, votingMinutes, moduleIdParam]);

  if (!selectedMod) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <CreatePollGlassBackground />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <CreatePollGlassBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={NAVY} />
          </Pressable>
          <Text style={styles.topTitle}>Create Session Poll</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <Text style={styles.lead}>
              Create a poll for students to vote on the best time for the session.
              Add a clear title and at least two time options.
            </Text>

            {/* Module Info */}
            <Text style={styles.label}>Module</Text>
            <View style={styles.moduleLockedCard}>
              <Ionicons name="library-outline" size={24} color="#0284C7" />
              <View style={styles.moduleLockedText}>
                <Text style={styles.moduleLockedTitle} numberOfLines={2}>
                  {selectedMod.title}
                </Text>
                <Text style={styles.moduleLockedSub} numberOfLines={2}>
                  {selectedMod.subtitle}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.changeModuleRow, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={NAVY} />
              <Text style={styles.changeModuleText}>Change module</Text>
            </Pressable>

            {/* Voting Duration */}
            <Text style={[styles.label, styles.labelSpaced]}>Voting window</Text>
            <Text style={styles.hint}>
              Students can vote for the next {votingMinutes >= 1440 ? '24 hours' : `${votingMinutes} minutes`} after publishing.
            </Text>

            <View style={styles.presetRow}>
              {VOTE_MINUTE_PRESETS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setVotingMinutes(m)}
                  style={({ pressed }) => [
                    styles.presetChip,
                    votingMinutes === m && styles.presetChipOn,
                    pressed && styles.presetChipPressed,
                  ]}>
                  <Text style={[styles.presetChipText, votingMinutes === m && styles.presetChipTextOn]}>
                    {m >= 1440 ? '24h' : `${m}m`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Session Title */}
            <Text style={[styles.label, styles.labelSpaced]}>Session title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Database Kuppi Session"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            {/* Time Slots */}
            <Text style={[styles.label, styles.labelSpaced]}>Option 1 — day & time</Text>
            <TextInput
              value={slot1}
              onChangeText={setSlot1}
              placeholder="e.g. Monday 3:00 PM"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={[styles.label, styles.labelSpaced]}>Option 2 — day & time</Text>
            <TextInput
              value={slot2}
              onChangeText={setSlot2}
              placeholder="e.g. Wednesday 5:00 PM"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={[styles.label, styles.labelSpaced]}>Option 3 — optional</Text>
            <TextInput
              value={slot3}
              onChangeText={setSlot3}
              placeholder="e.g. Friday 10:00 AM"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            {/* Publish Button */}
            <Pressable
              onPress={onPublish}
              disabled={loading}
              style={({ pressed }) => [
                styles.publishBtn,
                pressed && styles.publishPressed,
                loading && styles.disabled,
              ]}>
              <LinearGradient
                colors={[SKY, '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishGrad}>
                {loading ? (
                  <ActivityIndicator color={NAVY} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color={NAVY} />
                    <Text style={styles.publishText}>Publish Poll</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        <Modal
          visible={successVisible}
          transparent
          animationType="fade"
          onRequestClose={closeSuccessAndLeave}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closeSuccessAndLeave} />
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
              </View>
              <Text style={styles.modalTitle}>Poll Published Successfully!</Text>
              <Text style={styles.modalPollName} numberOfLines={2}>
                “{publishedTitle}”
              </Text>
              <Text style={styles.modalBody}>
                Students can now vote for their preferred time. After the voting ends,
                you can confirm the final session using the saved meeting link for this module.
              </Text>

              <Pressable
                onPress={openPublishedPoll}
                style={({ pressed }) => [styles.modalOk, pressed && styles.modalOkPressed]}>
                <Text style={styles.modalOkText}>View Poll</Text>
              </Pressable>

              <Pressable
                onPress={closeSuccessAndLeave}
                style={({ pressed }) => [styles.modalSecondary, pressed && styles.modalSecondaryPressed]}>
                <Text style={styles.modalSecondaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GLASS_BASE },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  lead: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
    lineHeight: 21,
    marginBottom: 22,
  },
  moduleLockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.45)',
    marginBottom: 10,
  },
  moduleLockedText: { flex: 1, minWidth: 0 },
  moduleLockedTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    lineHeight: 22,
  },
  moduleLockedSub: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  changeModuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 6,
  },
  changeModuleText: {
    fontSize: 14,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 8,
  },
  labelSpaced: { marginTop: 14 },
  hint: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
    marginBottom: 10,
    lineHeight: 17,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.65)',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  presetChipOn: {
    borderColor: NAVY,
    backgroundColor: 'rgba(10,10,92,0.08)',
  },
  presetChipPressed: { opacity: 0.88 },
  presetChipText: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: TEXT_MUTED,
  },
  presetChipTextOn: { color: NAVY },
  input: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_DARK,
  },
  publishBtn: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  publishPressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
  publishGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  publishText: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,30,66,0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto_900Black',
    color: NAVY,
    textAlign: 'center',
  },
  modalPollName: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#2563EB',
    textAlign: 'center',
  },
  modalBody: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#334155',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalOk: {
    marginTop: 22,
    backgroundColor: NAVY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalOkPressed: { opacity: 0.9 },
  modalOkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  modalSecondary: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,10,92,0.25)',
  },
  modalSecondaryPressed: { opacity: 0.88 },
  modalSecondaryText: {
    color: NAVY,
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
});