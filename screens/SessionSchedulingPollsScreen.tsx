// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginGlassBackground from '@/components/LoginGlassBackground';
import { sessionSchedulingBrowseModulesParams } from '@/constants/sessionSchedulingFaculties';
import { PT } from '@/constants/peerTutorTheme';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import {
  canFinalizeKuppiSession,
  castVoteOnPoll,
  deleteSessionPoll,
  finalizeKuppiSession,
  getLeadingOptionId,
  getSessionPollsForModule,
  isPollVotingOpen,
} from '@/services/sessionPollStorage';
import {
  getTutorKuppiMeetingLink,
  getTutorKuppiMeetingLinkForModule,
  setTutorKuppiMeetingLinkForModule,
} from '@/services/tutorKuppiLinkStorage';

const NAVY = '#0A0A5C';
const MUTED = '#5B6B7C';
/** Tutor login card — frosted panel + sky border */
const CARD_GLASS = 'rgba(255,255,255,0.52)';
const CARD_BORDER = 'rgba(147,197,253,0.75)';
const INPUT_SURFACE = 'rgba(255,255,255,0.72)';
const INPUT_BORDER = 'rgba(147,197,253,0.85)';

function paramStr(v) {
  if (v == null) return '';
  const s = Array.isArray(v) ? v[0] : v;
  return String(s);
}

function extractFirstHttpUrl(text) {
  const s = String(text || '').trim();
  const re = /https?:\/\/[^\s"'<>]+/gi;
  const m = s.match(re);
  if (!m?.[0]) return '';
  return m[0].replace(/[),.]+$/g, '');
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function formatRemaining(endsIso, nowMs = Date.now()) {
  const ms = new Date(endsIso).getTime() - nowMs;
  if (ms <= 0) return 'Voting closed';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min left`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m left`;
}

export default function SessionSchedulingPollsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleId = paramStr(params.moduleId);
  const moduleTitleParam = paramStr(params.moduleTitle);
  const facultyId = paramStr(params.facultyId);
  const facultyTitleParam = paramStr(params.facultyTitle);

  const resolvedModuleTitle = useMemo(() => {
    if (moduleTitleParam) {
      try {
        return decodeURIComponent(moduleTitleParam);
      } catch {
        return moduleTitleParam;
      }
    }
    const m = TIMED_QUIZ_MODULES.find((x) => x.id === moduleId);
    return m?.title || '';
  }, [moduleId, moduleTitleParam]);

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voterEmail, setVoterEmail] = useState('');
  const [isTutor, setIsTutor] = useState(false);
  /** Student draft selections per poll (option ids); undefined = use saved votes from server */
  const [draftByPoll, setDraftByPoll] = useState({});
  const [submittingPollId, setSubmittingPollId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [finalizePoll, setFinalizePoll] = useState(null);
  const [finalizeWinningId, setFinalizeWinningId] = useState('');
  const [finalizeWhenText, setFinalizeWhenText] = useState('');
  const [finalizeZoomText, setFinalizeZoomText] = useState('');
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [savingMeetingLink, setSavingMeetingLink] = useState(false);

  /** Tick often so voting locks exactly when the deadline passes (not up to 30s late). */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!moduleId) {
      if (facultyId) {
        router.replace({
          pathname: '/session-scheduling-modules',
          params: {
            facultyId,
            ...(facultyTitleParam ? { facultyTitle: facultyTitleParam } : {}),
          },
        });
      } else {
        router.replace({
          pathname: '/session-scheduling-modules',
          params: sessionSchedulingBrowseModulesParams,
        });
      }
    }
  }, [moduleId, facultyId, facultyTitleParam, router]);

  const load = useCallback(async () => {
    if (!moduleId) return;
    const [list, email, role] = await Promise.all([
      getSessionPollsForModule(moduleId),
      AsyncStorage.getItem(STORAGE_KEYS.studentEmail),
      AsyncStorage.getItem(STORAGE_KEYS.loginRole),
    ]);
    setPolls(list);
    setVoterEmail((email || '').trim().toLowerCase());
    setIsTutor(role === 'peerTutor');
    setNow(Date.now());
  }, [moduleId]);

  useFocusEffect(
    useCallback(() => {
      if (!moduleId) return undefined;
      let alive = true;
      (async () => {
        setLoading(true);
        await load();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [load, moduleId]),
  );

  /** Reload polls when app returns to foreground so another student’s saved votes show in totals. */
  useEffect(() => {
    if (!moduleId) return undefined;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void load();
      }
    });
    return () => sub.remove();
  }, [load, moduleId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDraftByPoll({});
    await load();
    setRefreshing(false);
  }, [load]);

  const openEditPoll = useCallback(
    (poll) => {
      router.push({
        pathname: '/edit-session-poll',
        params: {
          pollId: poll.id,
          moduleId,
          moduleTitle: encodeURIComponent(resolvedModuleTitle || poll.moduleTitle || ''),
          ...(facultyId ? { facultyId } : {}),
          ...(facultyTitleParam ? { facultyTitle: facultyTitleParam } : {}),
        },
      });
    },
    [router, moduleId, resolvedModuleTitle, facultyId, facultyTitleParam],
  );

  const onDeletePoll = useCallback(
    (poll) => {
      Alert.alert(
        'Delete this poll?',
        'Students will no longer see it. Polls stay here after voting ends until you delete them.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSessionPoll(poll.id);
                setDraftByPoll((prev) => {
                  const next = { ...prev };
                  delete next[poll.id];
                  return next;
                });
                await load();
              } catch (e) {
                Alert.alert('Could not delete', e?.message || 'Try again.');
              }
            },
          },
        ],
      );
    },
    [load],
  );

  const savedOptionIdsSet = useCallback(
    (poll) => {
      const v = voterEmail;
      if (!v || !poll?.options) return new Set();
      const out = new Set();
      for (const o of poll.options) {
        if ((o.votes || []).some((x) => String(x).toLowerCase() === v)) out.add(o.id);
      }
      return out;
    },
    [voterEmail],
  );

  const getWorkingSelectionSet = useCallback(
    (poll) => {
      const custom = draftByPoll[poll.id];
      if (custom !== undefined) return new Set(custom);
      return savedOptionIdsSet(poll);
    },
    [draftByPoll, savedOptionIdsSet],
  );

  const isPollDraftDirty = useCallback(
    (poll) => !setsEqual(getWorkingSelectionSet(poll), savedOptionIdsSet(poll)),
    [getWorkingSelectionSet, savedOptionIdsSet],
  );

  const toggleDraftSelection = useCallback(
    (pollId, optionId) => {
      setDraftByPoll((prev) => {
        const poll = polls.find((p) => p.id === pollId);
        if (!poll) return prev;
        const v = voterEmail;
        if (!v) return prev;
        const baseIds =
          prev[pollId] !== undefined ? [...prev[pollId]] : Array.from(savedOptionIdsSet(poll));
        const set = new Set(baseIds);
        if (set.has(optionId)) set.delete(optionId);
        else set.add(optionId);
        return { ...prev, [pollId]: Array.from(set) };
      });
    },
    [polls, voterEmail, savedOptionIdsSet],
  );

  const onSubmitPollVotes = useCallback(
    async (pollId) => {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll || !voterEmail) {
        Alert.alert('Sign in', 'No account email found to record your vote.');
        return;
      }
      if (!isPollVotingOpen(poll, Date.now())) {
        Alert.alert('Poll closed', 'The voting time has ended.');
        await load();
        return;
      }
      const target = getWorkingSelectionSet(poll);
      const saved = savedOptionIdsSet(poll);
      const toAdd = [...target].filter((id) => !saved.has(id));
      const toRemove = [...saved].filter((id) => !target.has(id));
      if (toAdd.length === 0 && toRemove.length === 0) return;

      setSubmittingPollId(pollId);
      try {
        for (const id of toAdd) {
          await castVoteOnPoll(pollId, id, voterEmail);
        }
        for (const id of toRemove) {
          await castVoteOnPoll(pollId, id, voterEmail);
        }
        setDraftByPoll((prev) => {
          const next = { ...prev };
          delete next[pollId];
          return next;
        });
        await load();
        Alert.alert('Votes saved', 'Your time choices were submitted.');
      } catch (e) {
        Alert.alert('Could not save votes', e?.message || 'Try again.');
      } finally {
        setSubmittingPollId(null);
      }
    },
    [polls, voterEmail, getWorkingSelectionSet, savedOptionIdsSet, load],
  );

  const openFinalizeModal = useCallback((poll) => {
    setFinalizePoll(poll);
    setFinalizeWinningId(getLeadingOptionId(poll) || poll.options[0]?.id || '');
    setFinalizeWhenText('');
    setFinalizeZoomText('');
  }, []);

  useEffect(() => {
    if (!finalizePoll) return undefined;
    let cancelled = false;
    (async () => {
      const fromPoll = String(finalizePoll.zoomLink || '').trim();
      if (fromPoll) {
        if (!cancelled) setFinalizeZoomText(fromPoll);
        return;
      }
      const modId = String(finalizePoll.moduleId || '').trim();
      let fromStore = modId ? (await getTutorKuppiMeetingLinkForModule(modId)).trim() : '';
      if (!fromStore) fromStore = (await getTutorKuppiMeetingLink()).trim();
      if (!cancelled) setFinalizeZoomText(fromStore);
    })();
    return () => {
      cancelled = true;
    };
  }, [finalizePoll]);

  const closeFinalizeModal = useCallback(() => {
    setFinalizePoll(null);
    setFinalizeLoading(false);
    setSavingMeetingLink(false);
  }, []);

  const onSaveMeetingLinkOnly = useCallback(async () => {
    if (!finalizePoll) return;
    const modId = String(finalizePoll.moduleId || moduleId || '').trim();
    if (!modId) {
      Alert.alert('Missing module', 'Cannot save a meeting link without a module.');
      return;
    }
    const rawInput = String(finalizeZoomText || '').trim();
    const extracted = extractFirstHttpUrl(rawInput);
    const toSave =
      extracted ||
      (rawInput && /^https?:\/\//i.test(rawInput) ? rawInput.replace(/[),.]+$/g, '') : '');
    if (!toSave) {
      Alert.alert(
        'No link found',
        'Paste a message or URL that includes a link starting with http:// or https://.',
      );
      return;
    }
    const modTitle =
      resolvedModuleTitle.trim() ||
      TIMED_QUIZ_MODULES.find((x) => String(x.id) === String(modId))?.title ||
      '';
    setSavingMeetingLink(true);
    try {
      await setTutorKuppiMeetingLinkForModule(modId, toSave, modTitle);
      setFinalizeZoomText(toSave);
      Alert.alert('Saved', 'Meeting link saved for this module. Students can see it on the dashboard.');
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSavingMeetingLink(false);
    }
  }, [finalizePoll, finalizeZoomText, moduleId, resolvedModuleTitle]);

  const onConfirmKuppi = useCallback(async () => {
    if (!finalizePoll) return;
    const when = finalizeWhenText.trim();
    const parsed = new Date(when);
    if (Number.isNaN(parsed.getTime())) {
      Alert.alert(
        'Date & time',
        'Enter when the Kuppi session runs (e.g. 2026-04-15 14:30 or paste an ISO date).',
      );
      return;
    }
    const pollHasZoom = String(finalizePoll.zoomLink || '').trim();
    setFinalizeLoading(true);
    try {
      await finalizeKuppiSession(finalizePoll.id, {
        winningOptionId: finalizeWinningId,
        sessionStartIso: parsed.toISOString(),
        ...(!pollHasZoom ? { zoomLink: finalizeZoomText.trim() || undefined } : {}),
      });
      closeFinalizeModal();
      await load();
      Alert.alert('Kuppi session saved', 'Students can see the time and meeting link on this screen.');
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setFinalizeLoading(false);
    }
  }, [finalizePoll, finalizeWhenText, finalizeWinningId, finalizeZoomText, closeFinalizeModal, load]);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LoginGlassBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={NAVY} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {resolvedModuleTitle ? resolvedModuleTitle : 'Session scheduling'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subHead}>
          {resolvedModuleTitle ? `polls for ${resolvedModuleTitle}. ` : ''}
          {isTutor
            ? 'Tutor view: you only see vote counts per time slot—you can’t vote or submit choices. Students pick slots and tap Submit votes. Totals on this device include every student account. After voting closes, use Create Kuppi session to confirm one time and share the link.'
            : 'Tap all times that work for you (you can pick several). Tap again to remove a choice. When you’re happy with your picks, tap Submit votes at the bottom of the poll. Totals update for everyone on this device. When your tutor confirms the session, the Kuppi time and Zoom link appear below the poll.'}
        </Text>

        {!moduleId ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
            showsVerticalScrollIndicator={false}>
            {polls.length === 0 ? (
              <View style={[styles.empty, styles.emptyCard]}>
                <Ionicons name="calendar-outline" size={36} color={MUTED} />
                <Text style={styles.emptyTitle}>No polls for this module</Text>
                <Text style={styles.emptyText}>
                  {isTutor
                    ? 'Use Create session scheduling on the dashboard and attach this module when you publish.'
                    : 'Your tutor has not posted session times for this module yet.'}
                </Text>
              </View>
            ) : (
              polls.map((poll) => {
                const votingOpen = isPollVotingOpen(poll, now);
                const canVote = !isTutor && votingOpen;
                return (
                  <View key={poll.id} style={styles.pollCard}>
                    <View style={styles.pollHeader}>
                      <Ionicons name="bar-chart-outline" size={18} color={NAVY} />
                      <Text style={styles.pollTitle} numberOfLines={2}>
                        {poll.title}
                      </Text>
                      {isTutor ? (
                        <View style={styles.tutorPollActions}>
                          <Pressable
                            onPress={() => openEditPoll(poll)}
                            style={({ pressed }) => [styles.tutorPollActionBtn, pressed && styles.tutorPollActionPressed]}
                            accessibilityLabel="Edit poll">
                            <Ionicons name="create-outline" size={20} color={NAVY} />
                          </Pressable>
                          <Pressable
                            onPress={() => onDeletePoll(poll)}
                            style={({ pressed }) => [
                              styles.tutorPollActionBtn,
                              styles.tutorPollActionBtnDanger,
                              pressed && styles.tutorPollActionPressed,
                            ]}
                            accessibilityLabel="Delete poll">
                            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                    {isTutor && !votingOpen && poll.votingEndsAt ? (
                      <View style={styles.tutorPollTimeSummary}>
                        <Text style={styles.tutorPollTimeLine}>
                          <Text style={styles.tutorPollTimeKey}>Poll posted </Text>
                          {formatDate(poll.createdAt)}
                        </Text>
                        <Text style={styles.tutorPollTimeLine}>
                          <Text style={styles.tutorPollTimeKey}>Voting ended </Text>
                          {formatDate(poll.votingEndsAt)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.pollMeta}>Posted {formatDate(poll.createdAt)}</Text>
                    )}
                    {poll.votingEndsAt ? (
                      !(isTutor && !votingOpen) ? (
                        <Text style={styles.votingWindowLine}>
                          {votingOpen ? (
                            <>
                              {isTutor ? 'Students can vote for' : 'Vote for'} the next{' '}
                              {poll.votingDurationMinutes ?? '—'} min from posting · ends{' '}
                              {formatDate(poll.votingEndsAt)} · {formatRemaining(poll.votingEndsAt, now)}
                            </>
                          ) : (
                            <>
                              Poll closed at {formatDate(poll.votingEndsAt)} — voting is locked; no one can change
                              votes.
                            </>
                          )}
                        </Text>
                      ) : null
                    ) : null}
                    {poll.options.map((opt) => {
                      const count = (opt.votes || []).length;
                      const selected = canVote
                        ? getWorkingSelectionSet(poll).has(opt.id)
                        : savedOptionIdsSet(poll).has(opt.id);
                      const busy = submittingPollId === poll.id;
                      const rowStyles = [
                        styles.optionRow,
                        selected && styles.optionRowSelected,
                        !votingOpen && styles.optionRowLocked,
                        !canVote && votingOpen && styles.optionRowDisabled,
                      ];
                      const rowBody = (
                        <>
                          <View style={styles.optionLeft}>
                            {selected ? (
                              <Ionicons name="checkbox" size={20} color={NAVY} />
                            ) : (
                              <Ionicons name="square-outline" size={20} color={MUTED} />
                            )}
                            <Text style={styles.optionLabel}>{opt.label}</Text>
                          </View>
                          <View
                            style={styles.countPill}
                            accessibilityLabel={`${count} vote${count === 1 ? '' : 's'} for this time slot`}>
                            {busy ? (
                              <ActivityIndicator size="small" color={NAVY} />
                            ) : (
                              <View style={styles.countPillInner}>
                                <Text style={styles.countText}>{count}</Text>
                                <Text style={styles.countVotesLabel}>
                                  vote{count === 1 ? '' : 's'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </>
                      );
                      if (canVote) {
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => toggleDraftSelection(poll.id, opt.id)}
                            disabled={busy || !voterEmail}
                            style={({ pressed }) => [
                              ...rowStyles,
                              pressed && !busy && voterEmail && styles.optionRowPressed,
                            ]}>
                            {rowBody}
                          </Pressable>
                        );
                      }
                      return (
                        <View key={opt.id} style={rowStyles} accessibilityState={{ disabled: true }}>
                          {rowBody}
                        </View>
                      );
                    })}
                    {canVote ? (
                      <View style={styles.submitBlock}>
                        <Text style={styles.submitHint}>
                          {isPollDraftDirty(poll)
                            ? 'Tap Submit votes to save your choices.'
                            : 'Change selections above, then submit when ready.'}
                        </Text>
                        <Pressable
                          onPress={() => onSubmitPollVotes(poll.id)}
                          disabled={!isPollDraftDirty(poll) || submittingPollId === poll.id || !voterEmail}
                          style={({ pressed }) => [
                            styles.submitVotesBtn,
                            pressed && isPollDraftDirty(poll) && submittingPollId !== poll.id && styles.submitVotesBtnPressed,
                            (!isPollDraftDirty(poll) || submittingPollId === poll.id || !voterEmail) &&
                              styles.submitVotesBtnDisabled,
                          ]}>
                          {submittingPollId === poll.id ? (
                            <ActivityIndicator color="#F8FAFC" />
                          ) : (
                            <Text style={styles.submitVotesBtnText}>Submit votes</Text>
                          )}
                        </Pressable>
                      </View>
                    ) : null}
                    {!votingOpen ? (
                      <Text style={styles.closedNote}>
                        {isTutor
                          ? 'This poll is closed — students can no longer vote. Final counts are shown above.'
                          : 'This poll is closed — you can’t change your vote anymore.'}
                      </Text>
                    ) : null}

                    {poll.kuppiSession ? (
                      <View style={styles.kuppiCard}>
                        <Text style={styles.kuppiTitle}>Kuppi session</Text>
                        <Text style={styles.kuppiLine}>
                          <Text style={styles.kuppiBold}>Winning slot: </Text>
                          {poll.kuppiSession.winningOptionLabel}
                        </Text>
                        <Text style={styles.kuppiLine}>
                          <Text style={styles.kuppiBold}>When: </Text>
                          {formatDate(poll.kuppiSession.sessionStartIso)}
                        </Text>
                        <Pressable
                          onPress={() => Linking.openURL(poll.kuppiSession.zoomLink)}
                          style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}>
                          <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.zoomBtnText}>Open Zoom / meeting link</Text>
                          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ) : null}

                    {isTutor && canFinalizeKuppiSession(poll, now) ? (
                      <Pressable
                        onPress={() => openFinalizeModal(poll)}
                        style={({ pressed }) => [styles.createKuppiBtn, pressed && styles.createKuppiBtnPressed]}>
                        <Ionicons name="link-outline" size={18} color={NAVY} />
                        <Text style={styles.createKuppiBtnText}>Create Kuppi session</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <Modal
          visible={!!finalizePoll}
          transparent
          animationType="fade"
          onRequestClose={closeFinalizeModal}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closeFinalizeModal} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Confirm Kuppi session</Text>
              <Text style={styles.modalSub}>
                Voting has closed. Pick the slot to run (defaults to the most votes) and set the real date and time.
              </Text>

              <Text style={styles.modalLabel}>Time option</Text>
              {finalizePoll?.options?.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setFinalizeWinningId(opt.id)}
                  style={[
                    styles.modalOption,
                    finalizeWinningId === opt.id && styles.modalOptionOn,
                  ]}>
                  <Ionicons
                    name={finalizeWinningId === opt.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={finalizeWinningId === opt.id ? NAVY : '#94A3B8'}
                  />
                  <Text style={styles.modalOptionText}>{opt.label}</Text>
                  <Text style={styles.modalVoteCount}>{(opt.votes || []).length} votes</Text>
                </Pressable>
              ))}

              <Text style={styles.modalLabel}>Session date & time</Text>
              <TextInput
                value={finalizeWhenText}
                onChangeText={setFinalizeWhenText}
                placeholder="e.g. 2026-04-15 14:30"
                placeholderTextColor="#94A3B8"
                style={styles.modalInput}
              />

              {finalizePoll && !String(finalizePoll.zoomLink || '').trim() ? (
                <>
                  <Text style={styles.modalLabel}>Meeting link</Text>
                  <Text style={styles.modalHint}>
                    Uses this module’s saved Kuppi link (Create session scheduling → module → Kuppi meeting link).
                    Edit here only if this session needs a different URL.
                  </Text>
                  <TextInput
                    value={finalizeZoomText}
                    onChangeText={setFinalizeZoomText}
                    placeholder="https://zoom.us/j/... (optional override)"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="url"
                    style={styles.modalInput}
                  />
                  <Pressable
                    onPress={onSaveMeetingLinkOnly}
                    disabled={savingMeetingLink || finalizeLoading}
                    style={({ pressed }) => [
                      styles.modalSaveLinkBtn,
                      pressed && styles.modalSaveLinkBtnPressed,
                      (savingMeetingLink || finalizeLoading) && styles.modalSaveDisabled,
                    ]}>
                    {savingMeetingLink ? (
                      <ActivityIndicator color="#F8FAFC" />
                    ) : (
                      <Text style={styles.modalSaveLinkBtnText}>Save link</Text>
                    )}
                  </Pressable>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable onPress={closeFinalizeModal} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmKuppi}
                  disabled={finalizeLoading}
                  style={[styles.modalSave, finalizeLoading && styles.modalSaveDisabled]}>
                  {finalizeLoading ? (
                    <ActivityIndicator color="#F8FAFC" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save session</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F4FC' },
  safe: { flex: 1, backgroundColor: 'transparent' },
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
    borderWidth: 1.2,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_SURFACE,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    letterSpacing: -0.2,
  },
  subHead: {
    marginHorizontal: 16,
    marginBottom: 10,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: MUTED,
    lineHeight: 19,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  /** Peer tutor login — frosted card */
  emptyCard: {
    backgroundColor: CARD_GLASS,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 32,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    width: '100%',
    maxWidth: 380,
    shadowColor: 'rgba(15,58,110,0.14)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  pollCard: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    backgroundColor: CARD_GLASS,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    shadowColor: 'rgba(15,58,110,0.14)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pollTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    minWidth: 0,
  },
  tutorPollActions: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 4,
  },
  tutorPollActionBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.85)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  tutorPollActionBtnDanger: {
    borderColor: 'rgba(185,28,28,0.35)',
    backgroundColor: 'rgba(254,242,242,0.85)',
  },
  tutorPollActionPressed: { opacity: 0.85 },
  pollMeta: {
    marginTop: 4,
    marginBottom: 6,
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: PT.textMuted,
  },
  /** Tutor view after voting deadline: compact posted / closed timestamps */
  tutorPollTimeSummary: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(10,10,92,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,10,92,0.12)',
    gap: 4,
  },
  tutorPollTimeLine: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: MUTED,
    lineHeight: 15,
  },
  tutorPollTimeKey: {
    fontFamily: 'Roboto_600SemiBold',
    color: PT.label,
  },
  votingWindowLine: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: PT.label,
    lineHeight: 15,
    marginBottom: 8,
  },
  closedNote: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Roboto_500Medium',
    color: '#B45309',
    marginBottom: 6,
  },
  submitBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(147,197,253,0.65)',
  },
  submitHint: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: MUTED,
    lineHeight: 17,
    marginBottom: 10,
  },
  submitVotesBtn: {
    backgroundColor: NAVY,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitVotesBtnPressed: { opacity: 0.92 },
  submitVotesBtnDisabled: {
    opacity: 0.45,
  },
  submitVotesBtnText: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#F8FAFC',
  },
  optionRowDisabled: {
    opacity: 0.55,
  },
  /** After deadline — not pressable; distinct from tutor view-only while voting is open. */
  optionRowLocked: {
    backgroundColor: 'rgba(241,245,249,0.65)',
    borderColor: 'rgba(148,163,184,0.55)',
  },
  kuppiCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: PT.sectionBg,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.55)',
  },
  kuppiTitle: {
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    color: '#047857',
    marginBottom: 8,
  },
  kuppiLine: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: PT.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  kuppiBold: {
    fontFamily: 'Roboto_700Bold',
    color: '#334155',
  },
  zoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: NAVY,
  },
  zoomBtnPressed: { opacity: 0.9 },
  zoomBtnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    color: '#F8FAFC',
  },
  createKuppiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(250,204,21,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.55)',
  },
  createKuppiBtnPressed: { opacity: 0.9 },
  createKuppiBtnText: {
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  modalHint: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
    marginTop: -2,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: 'Roboto_600SemiBold',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  modalOptionOn: {
    borderColor: NAVY,
    backgroundColor: 'rgba(10,10,92,0.06)',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: '#0F172A',
  },
  modalVoteCount: {
    fontSize: 11,
    fontFamily: 'Roboto_700Bold',
    color: '#64748B',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
  },
  modalSaveLinkBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: NAVY,
    alignItems: 'center',
  },
  modalSaveLinkBtnPressed: { opacity: 0.92 },
  modalSaveLinkBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Roboto_600SemiBold',
    color: '#64748B',
  },
  modalSave: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: NAVY,
    minWidth: 120,
    alignItems: 'center',
  },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#F8FAFC',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: INPUT_SURFACE,
    borderWidth: 1.2,
    borderColor: INPUT_BORDER,
  },
  optionRowSelected: {
    borderColor: PT.accent,
    backgroundColor: 'rgba(224,242,254,0.65)',
  },
  optionRowPressed: {
    opacity: 0.9,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  optionLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: '#111827',
  },
  countPill: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  countPillInner: {
    alignItems: 'center',
  },
  countText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    lineHeight: 18,
  },
  countVotesLabel: {
    fontSize: 9,
    fontFamily: 'Roboto_500Medium',
    color: MUTED,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

