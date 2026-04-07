// @ts-nocheck
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSavedKuppiModuleLinks } from '@/services/tutorKuppiLinkStorage';

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

function openZoomWithShareDoneAlert(url) {
  const u = String(url || '').trim();
  if (!u) return;
  Alert.alert(
    'Share link done',
    'Your meeting link is ready. Tap OK to open it in your browser.',
    [{ text: 'OK', onPress: () => Linking.openURL(u) }],
  );
}

export default function StudentZoomLinksListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSavedKuppiModuleLinks();
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
            <Text style={styles.heroLabel}>Zoom links</Text>
            <Text style={styles.heroTitle}>All modules</Text>
            <Text style={styles.heroSub}>
              {loading ? 'Loading…' : rows.length === 0 ? 'No saved links yet' : `${rows.length} meeting link${rows.length === 1 ? '' : 's'}`}
            </Text>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={NAVY} />
          ) : rows.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Ionicons name="videocam-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No meeting links</Text>
              <Text style={styles.emptyBody}>
                When a peer tutor saves a Zoom or Teams URL for a module, every link for this device will show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {rows.map((row) => (
                <View key={row.moduleId} style={styles.linkCard}>
                  <Text style={styles.moduleName} numberOfLines={2}>
                    {row.moduleTitle}
                  </Text>
                  <Text style={styles.urlPreview} numberOfLines={1} ellipsizeMode="middle">
                    {row.url}
                  </Text>
                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() => openZoomWithShareDoneAlert(row.url)}
                      style={({ pressed }) => [styles.btnNavy, pressed && styles.btnPressed]}>
                      <Text style={styles.btnNavyText}>Save link</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/student-zoom-link-detail',
                          params: { moduleId: row.moduleId },
                        })
                      }
                      style={({ pressed }) => [styles.btnOutline, pressed && styles.btnPressed]}>
                      <Text style={styles.btnOutlineText}>Details</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36 },
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
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.78)',
  },
  loader: { marginVertical: 28 },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  list: { gap: 10 },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 40, 72, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#0F2847',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  moduleName: {
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    letterSpacing: -0.2,
    lineHeight: 17,
    marginBottom: 4,
  },
  urlPreview: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  btnNavy: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: NAVY,
  },
  btnOutline: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(10, 10, 92, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  btnPressed: { opacity: 0.88 },
  btnNavyText: {
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  btnOutlineText: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
  },
});

