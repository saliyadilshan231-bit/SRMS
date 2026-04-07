// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatePollGlassBackground } from '@/screens/CreateSessionPollScreen';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import {
  getSessionPollById,
  isPollVotingOpen,
  updateSessionPoll,
} from '@/services/sessionPollStorage';

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

export default function EditSessionPollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pollIdParam = paramStr(params.pollId);
  const moduleIdParam = paramStr(params.moduleId);

  const [loadingPoll, setLoadingPoll] = useState(true);
  const [title, setTitle] = useState('');
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [votingMinutes, setVotingMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [pollSnapshot, setPollSnapshot] = useState(null);

  const selectedMod = useMemo(() => {
    const mid = pollSnapshot?.moduleId || moduleIdParam;
    return mid ? TIMED_QUIZ_MODULES.find((m) => m.id === mid) : null;
  }, [moduleIdParam, pollSnapshot?.moduleId]);

  const loadPoll = useCallback(async () => {
    if (!pollIdParam) {
      setLoadingPoll(false);
      return;
    }
    setLoadingPoll(true);
    try {
      const p = await getSessionPollById(pollIdParam);
      if (!p) {
        Alert.alert('Poll not found', 'It may have been deleted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      setPollSnapshot(p);
      setTitle(p.title || '');
      const opts = p.options || [];
      setSlot1(opts[0]?.label || '');
      setSlot2(opts[1]?.label || '');
      setSlot3(opts[2]?.label || '');
      setVotingMinutes(p.votingDurationMinutes ?? 60);
    } catch (e) {
      Alert.alert('Could not load', e?.message || 'Try again.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoadingPoll(false);
    }
  }, [pollIdParam, router]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  const votingOpen = pollSnapshot ? isPollVotingOpen(pollSnapshot, Date.now()) : false;
  const finalized = !!pollSnapshot?.kuppiSession;

  const onSave = useCallback(async () => {
    const t = title.trim();
    const slots = [slot1, slot2, slot3].map((s) => s.trim()).filter(Boolean);
    if (!t) {
      Alert.alert('Title required', 'Enter a session name.');
      return;
    }
    if (slots.length < 2) {
      Alert.alert('Need at least 2 times', 'Fill at least two day/time options.');
      return;
    }
    setSaving(true);
    try {
      await updateSessionPoll(pollIdParam, {
        title: t,
        slotLabels: slots,
        ...(votingOpen && !finalized ? { votingDurationMinutes: votingMinutes } : {}),
      });
      Alert.alert('Poll updated', 'Students see these changes on Session scheduling.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [title, slot1, slot2, slot3, votingMinutes, votingOpen, finalized, pollIdParam, router]);

  if (!pollIdParam) {
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
          <Text style={styles.topTitle}>Edit session poll</Text>
          <View style={{ width: 40 }} />
        </View>

        {loadingPoll || !pollSnapshot ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.lead}>
                {finalized
                  ? 'A Kuppi session is already set. You can fix typos in the title and time labels only — keep the same number of options.'
                  : !votingOpen
                    ? 'Voting has closed. You can update the title and option text; vote counts and the closing time stay the same. Keep the same number of time options.'
                    : 'Changes save for everyone on this device. Saving resets the voting deadline from now using the window you pick below. Votes stay on each slot when you keep the same options in the same order; removing a slot drops its votes.'}
              </Text>

              {selectedMod ? (
                <>
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
                </>
              ) : null}

              {votingOpen && !finalized ? (
                <>
                  <Text style={[styles.label, styles.labelSpaced]}>Voting window</Text>
                  <Text style={styles.hint}>Deadline restarts from now when you save.</Text>
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
                </>
              ) : null}

              <Text style={[styles.label, styles.labelSpaced]}>Session title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Database Kuppi"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

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
                editable={!finalized || (pollSnapshot?.options?.length ?? 0) > 2}
              />
              {finalized && (pollSnapshot?.options?.length ?? 0) === 2 ? (
                <Text style={styles.inlineHint}>This poll has two options — leave option 3 empty.</Text>
              ) : null}

              <Pressable
                onPress={onSave}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, pressed && styles.savePressed, saving && styles.disabled]}>
                <LinearGradient
                  colors={[SKY, '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveGrad}>
                  {saving ? (
                    <ActivityIndicator color={NAVY} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={22} color={NAVY} />
                      <Text style={styles.saveText}>Save changes</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GLASS_BASE },
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  inlineHint: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
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
  saveBtn: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  savePressed: { opacity: 0.92 },
  disabled: { opacity: 0.6 },
  saveGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  saveText: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
});
