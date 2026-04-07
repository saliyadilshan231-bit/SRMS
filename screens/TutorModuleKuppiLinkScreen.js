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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionSchedulingCreateModulesParams } from '@/constants/sessionSchedulingFaculties';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import {
  getTutorKuppiMeetingLinkForModule,
  setTutorKuppiMeetingLinkForModule,
} from '@/services/tutorKuppiLinkStorage';

/** Pull the first http(s) URL from pasted invite text. */
function extractFirstHttpUrl(text) {
  const s = String(text || '').trim();
  const re = /https?:\/\/[^\s"'<>]+/gi;
  const m = s.match(re);
  if (!m?.[0]) return '';
  return m[0].replace(/[),.]+$/g, '');
}

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

export default function TutorModuleKuppiLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleId = paramStr(params.moduleId);
  const moduleTitleParam = paramStr(params.moduleTitle);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedMod = useMemo(
    () => (moduleId ? TIMED_QUIZ_MODULES.find((m) => m.id === moduleId) : null),
    [moduleId],
  );

  const moduleTitleDecoded = useMemo(() => {
    if (!moduleTitleParam) return selectedMod?.title || '';
    try {
      return decodeURIComponent(moduleTitleParam);
    } catch {
      return moduleTitleParam;
    }
  }, [moduleTitleParam, selectedMod]);

  const load = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    try {
      const v = await getTutorKuppiMeetingLinkForModule(moduleId);
      setUrl(v);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (!moduleId || !selectedMod) {
      router.replace({
        pathname: '/session-scheduling-modules',
        params: sessionSchedulingCreateModulesParams,
      });
    }
  }, [moduleId, selectedMod, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSave = useCallback(async () => {
    if (!moduleId) return;
    const rawInput = String(url || '').trim();
    const extracted = extractFirstHttpUrl(rawInput);
    const toSave =
      extracted ||
      (rawInput && /^https?:\/\//i.test(rawInput) ? rawInput.replace(/[),.]+$/g, '') : '');
    if (!toSave) {
      Alert.alert(
        'No link found',
        'Paste a message that includes a link starting with http:// or https://.',
      );
      return;
    }
    const title = (moduleTitleDecoded || selectedMod?.title || '').trim();
    setSaving(true);
    try {
      await setTutorKuppiMeetingLinkForModule(moduleId, toSave, title);
      setUrl(toSave);
      Alert.alert('Saved', 'This link will be used for this module when you confirm a Kuppi session.');
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [moduleId, url, moduleTitleDecoded, selectedMod?.title]);

  if (!moduleId || !selectedMod) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SCREEN_BG} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
              <View style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#1E293B" />
              </View>
            </Pressable>

            <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
              <Text style={styles.heroLabel}>Kuppi meeting link</Text>
              <Text style={styles.heroModule} numberOfLines={2}>
                {moduleTitleDecoded || selectedMod.title}
              </Text>
            </LinearGradient>

            <Text style={styles.lead}>
              Paste your Zoom, Teams, or other meeting URL for this module. Students see it after you confirm the
              session when voting ends.
            </Text>

            <View style={styles.urlForm}>
              <Text style={styles.label}>Meeting URL</Text>
              {loading ? (
                <ActivityIndicator style={styles.loader} color={NAVY} />
              ) : (
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.input}
                />
              )}

              <Pressable
                onPress={onSave}
                disabled={saving || loading}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed,
                  (saving || loading) && styles.saveBtnDisabled,
                ]}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save link</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  backRow: { marginBottom: 12, alignSelf: 'flex-start' },
  backBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  hero: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 6,
  },
  heroModule: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  lead: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    lineHeight: 21,
    marginBottom: 18,
  },
  /** Compact column, left-aligned with the lead text above */
  urlForm: {
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 328,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
  },
  loader: { marginVertical: 16 },
  saveBtn: {
    marginTop: 16,
    width: '100%',
    backgroundColor: NAVY,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
});
