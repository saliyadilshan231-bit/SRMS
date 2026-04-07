import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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

import { getSavedKuppiModuleLink } from '@/services/tutorKuppiLinkStorage';

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

export default function StudentZoomLinkDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleId = paramStr(params.moduleId);

  const [loading, setLoading] = useState(true);
  const [moduleTitle, setModuleTitle] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!moduleId) router.back();
  }, [moduleId, router]);

  const load = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    try {
      const row = await getSavedKuppiModuleLink(moduleId);
      if (row) {
        setModuleTitle(row.moduleTitle);
        setUrl(row.url);
      } else {
        setModuleTitle('');
        setUrl('');
      }
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openMeeting = useCallback(() => {
    const u = String(url || '').trim();
    if (!u) return;
    Alert.alert(
      'Share link done',
      'Your meeting link is ready. Tap OK to open it in your browser.',
      [{ text: 'OK', onPress: () => Linking.openURL(u) }],
    );
  }, [url]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SCREEN_BG} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            <Text style={styles.heroLabel}>Zoom link</Text>
            <Text style={styles.heroModule} numberOfLines={3}>
              {loading ? '…' : moduleTitle || 'Meeting link'}
            </Text>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={NAVY} />
          ) : url ? (
            <>
              <Text style={styles.lead}>
                Paste your Zoom, Teams, or other meeting link for this module. Students see it after you confirm the
                session when voting ends.
              </Text>
              <View style={styles.urlForm}>
                <Text style={styles.label}>Meeting URL</Text>
                <TextInput
                  value={url}
                  editable={false}
                  selectTextOnFocus
                  multiline
                  scrollEnabled
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
                <Pressable
                  onPress={openMeeting}
                  accessibilityRole="button"
                  accessibilityLabel="Save link, then confirm to open meeting in browser"
                  style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}>
                  <Text style={styles.saveBtnText}>Save link</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.missing}>
              This meeting link is no longer available. Ask your tutor to save it again.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1 },
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Roboto_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroModule: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  loader: { marginVertical: 24 },
  lead: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    lineHeight: 21,
    marginBottom: 18,
  },
  /** Same layout as TutorModuleKuppiLinkScreen */
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
    minHeight: 52,
    maxHeight: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 16,
    width: '100%',
    backgroundColor: NAVY,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  missing: {
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 22,
  },
});
