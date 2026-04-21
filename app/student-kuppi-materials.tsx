import type { KuppiMaterialDoc } from '@/lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllKuppiMaterialsForStudents } from '@/services/kuppiMaterialsService';

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

export default function StudentKuppiMaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<KuppiMaterialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('all');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllKuppiMaterialsForStudents();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleOpenLink = useCallback(async (url: string) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link.');
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  }, []);

  const filteredMaterials = filterModule === 'all' 
    ? materials 
    : materials.filter(m => m.moduleId === filterModule);

  const modules = [...new Set(materials.map(m => m.moduleId))];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <View style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </View>
          </Pressable>

          <LinearGradient colors={HERO_GRADIENT as any} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>Kuppi Materials</Text>
            <Text style={styles.heroSub}>Access study materials and meeting links</Text>
          </LinearGradient>

          {/* Module Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Module</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                onPress={() => setFilterModule('all')}
                style={[styles.filterChip, filterModule === 'all' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filterModule === 'all' && styles.filterChipTextActive]}>
                  All
                </Text>
              </Pressable>
              {modules.map((modId) => (
                <Pressable
                  key={modId}
                  onPress={() => setFilterModule(modId)}
                  style={[styles.filterChip, filterModule === modId && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, filterModule === modId && styles.filterChipTextActive]}>
                    {modId}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Materials List */}
          <View style={styles.listSection}>
            {loading ? (
              <ActivityIndicator style={styles.loader} color={NAVY} />
            ) : filteredMaterials.length === 0 ? (
              <Text style={styles.emptyText}>No materials available.</Text>
            ) : (
              filteredMaterials.map((item) => (
                <View key={item.$id} style={styles.materialCard}>
                  <View style={styles.materialHeader}>
                    <View style={styles.moduleBadge}>
                      <Text style={styles.moduleBadgeText}>{item.moduleTitle}</Text>
                    </View>
                    <Text style={styles.materialDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.materialTitle}>{item.title}</Text>
                  <Text style={styles.materialDesc}>{item.description}</Text>
                  
                  <View style={styles.actionsRow}>
                    {item.fileUrl && (
                      <Pressable
                        onPress={() => item.fileUrl && handleOpenLink(item.fileUrl)}
                        style={styles.actionBtn}>
                        <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                        <Text style={styles.actionBtnText}>Open File</Text>
                      </Pressable>
                    )}
                    {item.meetingLink && (
                      <Pressable
                        onPress={() => item.meetingLink && handleOpenLink(item.meetingLink)}
                        style={[styles.actionBtn, styles.meetingBtn]}>
                        <Ionicons name="videocam-outline" size={20} color="#10B981" />
                        <Text style={styles.actionBtnText}>Join Meeting</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
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
    padding: 18,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    flex: 1,
  },
  loader: { marginVertical: 40 },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 40,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moduleBadgeText: {
    fontSize: 11,
    fontFamily: 'Roboto_600SemiBold',
    color: '#6366F1',
  },
  materialDate: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#94A3B8',
  },
  materialTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  materialDesc: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  meetingBtn: {
    backgroundColor: '#ECFDF5',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: '#3B82F6',
  },
});
