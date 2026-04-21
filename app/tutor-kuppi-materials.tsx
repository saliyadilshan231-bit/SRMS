import type { KuppiMaterialDoc } from '@/lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import {
    createKuppiMaterialService,
    deleteKuppiMaterialService,
    getMyKuppiMaterials,
} from '@/services/kuppiMaterialsService';

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

export default function TutorKuppiMaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<KuppiMaterialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedModule, setSelectedModule] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyKuppiMaterials();
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

  const handleCreateMaterial = useCallback(async () => {
    if (!selectedModule || !title || !description) {
      Alert.alert('Missing Fields', 'Please fill in module, title, and description.');
      return;
    }

    setSaving(true);
    try {
      const mod = TIMED_QUIZ_MODULES.find((m) => m.id === selectedModule);
      await createKuppiMaterialService({
        moduleId: selectedModule,
        moduleTitle: mod?.title || moduleTitle,
        title,
        description,
        fileUrl,
        meetingLink,
      });
      
      // Reset form
      setSelectedModule('');
      setModuleTitle('');
      setTitle('');
      setDescription('');
      setFileUrl('');
      setMeetingLink('');
      
      Alert.alert('Success', 'Kuppi material created successfully.');
      loadMaterials();
    } catch (error) {
      Alert.alert('Error', 'Failed to create material. Please try again.');
      console.error('Error creating material:', error);
    } finally {
      setSaving(false);
    }
  }, [selectedModule, moduleTitle, title, description, fileUrl, meetingLink, loadMaterials]);

  const handleDeleteMaterial = useCallback(async (documentId: string) => {
    Alert.alert('Delete Material', 'Are you sure you want to delete this material?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKuppiMaterialService(documentId);
            Alert.alert('Deleted', 'Material deleted successfully.');
            loadMaterials();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete material.');
            console.error('Error deleting material:', error);
          }
        },
      },
    ]);
  }, [loadMaterials]);

  return (
    <View style={styles.root}>
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

            <LinearGradient colors={HERO_GRADIENT as any} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
              <Text style={styles.heroLabel}>Kuppi Materials</Text>
              <Text style={styles.heroSub}>Create and manage your kuppi materials</Text>
            </LinearGradient>

            {/* Create Material Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Create New Material</Text>
              
              <Text style={styles.label}>Module</Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.pickerInput}
                  placeholder="Select or enter module ID"
                  value={selectedModule}
                  onChangeText={setSelectedModule}
                />
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Material title"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Material description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>File URL (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/material.pdf"
                value={fileUrl}
                onChangeText={setFileUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.label}>Meeting Link (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChangeText={setMeetingLink}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Pressable
                onPress={handleCreateMaterial}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed,
                  saving && styles.saveBtnDisabled,
                ]}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Material</Text>
                )}
              </Pressable>
            </View>

            {/* Existing Materials */}
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Your Materials</Text>
              {loading ? (
                <ActivityIndicator style={styles.loader} color={NAVY} />
              ) : materials.length === 0 ? (
                <Text style={styles.emptyText}>No materials created yet.</Text>
              ) : (
                materials.map((item) => (
                  <View key={item.$id} style={styles.materialCard}>
                    <View style={styles.materialHeader}>
                      <Text style={styles.materialModule}>{item.moduleTitle || 'Unknown Module'}</Text>
                      <Pressable onPress={() => item.$id && handleDeleteMaterial(item.$id)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                    <Text style={styles.materialTitle}>{item.title}</Text>
                    <Text style={styles.materialDesc}>{item.description}</Text>
                    {item.fileUrl && (
                      <Text style={styles.materialLink}>📎 File available</Text>
                    )}
                    {item.meetingLink && (
                      <Text style={styles.materialLink}>🔗 Meeting link available</Text>
                    )}
                  </View>
                ))
              )}
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
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 16,
    fontFamily: 'Roboto_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    width: '100%',
  },
  pickerInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
  },
  saveBtn: {
    marginTop: 20,
    width: '100%',
    backgroundColor: NAVY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  loader: { marginVertical: 20 },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  materialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialModule: {
    fontSize: 12,
    fontFamily: 'Roboto_600SemiBold',
    color: '#6366F1',
  },
  materialTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  materialDesc: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    marginBottom: 8,
  },
  materialLink: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: '#3B82F6',
  },
});
