// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIB_REF } from '@/constants/libraryTheme';
import {
  LIBRARY_UPLOAD_CATEGORY,
  addTutorLibraryUpload,
  deleteTutorLibraryUpload,
  getTutorLibraryUploadsForModule,
  updateTutorLibraryUpload,
} from '@/services/tutorLibraryUploadStorage';
import { isImageLibraryUpload, libraryFileKindLabel } from '@/utils/libraryUploadDisplay';

const NAVY = '#0A0A5C';
const TITLE = LIB_REF.titleNavy;

/** One system picker: images, PDFs, Word, text, and other files on the device. */
const LIBRARY_FILE_PICK_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/*',
  '*/*',
];

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

export default function LibraryUploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleIdParam = paramStr(params.moduleId);
  const moduleTitleParam = paramStr(params.moduleTitle);

  const resolvedModuleTitle = useMemo(() => {
    if (!moduleTitleParam) return '';
    try {
      return decodeURIComponent(moduleTitleParam);
    } catch {
      return moduleTitleParam;
    }
  }, [moduleTitleParam]);

  /** Which category is opening the file picker (null = idle). Keeps "Opening…" on one button only. */
  const [pickingCategory, setPickingCategory] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [moduleUploads, setModuleUploads] = useState([]);

  useEffect(() => {
    if (!moduleIdParam || !resolvedModuleTitle) {
      router.replace('/tutor-library-module-select');
    }
  }, [moduleIdParam, resolvedModuleTitle, router]);

  const loadModuleUploads = useCallback(async () => {
    if (!moduleIdParam) return;
    const rows = await getTutorLibraryUploadsForModule(moduleIdParam);
    setModuleUploads(rows);
  }, [moduleIdParam]);

  useFocusEffect(
    useCallback(() => {
      void loadModuleUploads();
    }, [loadModuleUploads]),
  );

  const notesUploads = useMemo(
    () => moduleUploads.filter((x) => x.category === LIBRARY_UPLOAD_CATEGORY.NOTES),
    [moduleUploads],
  );
  const papersUploads = useMemo(
    () => moduleUploads.filter((x) => x.category === LIBRARY_UPLOAD_CATEGORY.PAPERS),
    [moduleUploads],
  );

  const pickDocumentsForCategory = useCallback(
    async (targetCategory) => {
      setPickingCategory(targetCategory);
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: LIBRARY_FILE_PICK_TYPES,
          multiple: Platform.OS === 'web' || Platform.OS === 'android',
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.length) return;
        const sectionLabel = targetCategory === LIBRARY_UPLOAD_CATEGORY.PAPERS ? 'Papers' : 'Notes';
        let saved = 0;
        for (const asset of result.assets) {
          const uri = asset?.uri;
          if (!uri) continue;
          try {
            await addTutorLibraryUpload({
              category: targetCategory,
              uri,
              moduleId: moduleIdParam,
              moduleTitle: resolvedModuleTitle,
              fileName: asset.name ?? null,
              mimeType: asset.mimeType ?? null,
            });
            saved += 1;
          } catch {
            /* skip */
          }
        }
        if (saved > 0) {
          await loadModuleUploads();
          Alert.alert(
            'Successfully uploaded',
            saved === 1
              ? `Your file was added under ${sectionLabel}. Students can open it from Library → Tutor notes & papers.`
              : `${saved} files were added under ${sectionLabel}. Students can open them from Library → Tutor notes & papers.`,
          );
        } else {
          Alert.alert('Could not save', 'No file was imported. Try again.');
        }
      } catch (e) {
        Alert.alert('Files', e?.message || 'Could not open the file picker. Try again.');
      } finally {
        setPickingCategory(null);
      }
    },
    [moduleIdParam, resolvedModuleTitle, loadModuleUploads],
  );

  const rowActionsLocked =
    pickingCategory !== null || updatingId !== null || deletingId !== null;

  const performDelete = useCallback(
    async (row) => {
      const id = row?.id != null ? String(row.id).trim() : '';
      if (!id) {
        Alert.alert('Could not delete', 'Missing file id. Try re-uploading the file.');
        return;
      }
      setDeletingId(id);
      try {
        await deleteTutorLibraryUpload(id);
        await loadModuleUploads();
        const msg = 'The file was removed from your library.';
        if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
          globalThis.alert(`Successfully deleted.\n\n${msg}`);
        } else {
          Alert.alert('Successfully deleted', msg);
        }
      } catch (e) {
        const errMsg = e?.message || 'Try again.';
        if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
          globalThis.alert(`Could not delete.\n\n${errMsg}`);
        } else {
          Alert.alert('Could not delete', errMsg);
        }
      } finally {
        setDeletingId(null);
      }
    },
    [loadModuleUploads],
  );

  const onDeleteUpload = useCallback(
    (row) => {
      const name = row.fileName || libraryFileKindLabel(row) || 'this file';
      const detail = `${name} will be removed from Notes & papers for this module.`;
      if (Platform.OS === 'web') {
        const ok =
          typeof globalThis.confirm === 'function' &&
          globalThis.confirm(`Delete this file?\n\n${detail}`);
        if (ok) void performDelete(row);
        return;
      }
      Alert.alert('Delete this file?', detail, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void performDelete(row),
        },
      ]);
    },
    [performDelete],
  );

  const replaceUploadWithFile = useCallback(
    async (row) => {
      const id = row?.id != null ? String(row.id) : '';
      if (!id) return;
      setUpdatingId(id);
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: LIBRARY_FILE_PICK_TYPES,
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const asset = result.assets[0];
        await updateTutorLibraryUpload(id, {
          uri: asset.uri,
          fileName: asset.name ?? null,
          mimeType: asset.mimeType ?? null,
        });
        await loadModuleUploads();
        Alert.alert('Updated', 'File replaced. Students will see the new version in the library.');
      } catch (e) {
        Alert.alert('Could not update', e?.message || 'Try again.');
      } finally {
        setUpdatingId(null);
      }
    },
    [loadModuleUploads],
  );

  const renderUploadRow = (row) => {
    const img = isImageLibraryUpload(row);
    const rowKey = row?.id != null ? String(row.id) : '';
    const isUpdating = updatingId != null && String(updatingId) === rowKey;
    const isDeleting = deletingId != null && String(deletingId) === rowKey;
    return (
      <View key={row.id} style={styles.uploadRow}>
        {img ? (
          <Image
            source={{ uri: row.uri }}
            style={styles.uploadThumb}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.uploadThumbDoc}>
            <Ionicons name="document-text-outline" size={26} color={NAVY} />
          </View>
        )}
        <View style={styles.uploadMeta}>
          <Text style={styles.uploadName} numberOfLines={2}>
            {row.fileName || libraryFileKindLabel(row)}
          </Text>
          <Text style={styles.uploadKind}>{libraryFileKindLabel(row)}</Text>
        </View>
        <View style={styles.rowActions}>
          <Pressable
            onPress={() => void replaceUploadWithFile(row)}
            disabled={rowActionsLocked}
            style={({ pressed }) => [
              styles.rowBtnUpdate,
              Platform.OS === 'web' && styles.rowBtnWeb,
              pressed && styles.rowBtnPressed,
              rowActionsLocked && styles.rowBtnDisabled,
            ]}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : (
              <Text style={styles.rowBtnUpdateText}>Update</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onDeleteUpload(row)}
            disabled={rowActionsLocked}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.rowBtnDelete,
              Platform.OS === 'web' && styles.rowBtnWeb,
              pressed && styles.rowBtnPressed,
              rowActionsLocked && styles.rowBtnDisabled,
            ]}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.rowBtnDeleteText}>Delete</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (!moduleIdParam || !resolvedModuleTitle) {
    return (
      <View style={styles.root}>
        <LibraryBlueBackground />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LibraryBlueBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={TITLE} />
          </Pressable>
          <Text style={styles.topTitle}>Upload library</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(232,240,255,0.92)']}
              style={styles.heroInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload-outline" size={36} color={NAVY} />
              </View>
              <Text style={styles.heroTitle}>Share materials with students</Text>
              <Text style={styles.heroBody}>
                Use Add file under Notes or Papers to browse your device — images, PDF, Word, .txt, and more. Students
                open them from Library → Tutor notes & papers.
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.label}>Module</Text>
          <View style={styles.moduleLockedCard}>
            <Ionicons name="library-outline" size={24} color="#0284C7" />
            <View style={styles.moduleLockedText}>
              <Text style={styles.moduleLockedTitle} numberOfLines={2}>
                {resolvedModuleTitle}
              </Text>
              <Text style={styles.moduleLockedSub} numberOfLines={2}>
                Uploads are tagged for this module for students.
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.replace('/tutor-library-module-select')}
            style={({ pressed }) => [styles.changeModuleRow, pressed && { opacity: 0.8 }]}>
            <Ionicons name="swap-horizontal-outline" size={18} color={NAVY} />
            <Text style={styles.changeModuleText}>Change module</Text>
          </Pressable>

          <View style={styles.manageSection}>
            <Text style={styles.manageTitle}>Notes & papers (this module)</Text>
            <Text style={styles.manageHint}>
              Notes first, then Papers. Use Update or Delete on each file, or Add file to upload more from your device.
            </Text>

            <View style={styles.categoriesRowStacked}>
              <View style={styles.categoryColumn}>
                <Text style={styles.manageSubhead}>Notes ({notesUploads.length})</Text>
                {notesUploads.length === 0 ? (
                  <Text style={styles.manageEmpty}>No notes yet.</Text>
                ) : (
                  notesUploads.map((row) => renderUploadRow(row))
                )}
                <Pressable
                  onPress={() => void pickDocumentsForCategory(LIBRARY_UPLOAD_CATEGORY.NOTES)}
                  disabled={pickingCategory !== null || updatingId !== null || deletingId !== null}
                  style={({ pressed }) => [
                    styles.sectionAddFileBtn,
                    pressed && styles.onlyBtnPressed,
                    (pickingCategory !== null || updatingId !== null || deletingId !== null) &&
                      styles.onlyBtnDisabled,
                  ]}>
                  <Ionicons name="folder-open-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.sectionAddFileBtnText} numberOfLines={2}>
                    {pickingCategory === LIBRARY_UPLOAD_CATEGORY.NOTES ? 'Opening…' : 'Add file — Notes'}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.categoryColumn, styles.categoryColumnBelow]}>
                <Text style={[styles.manageSubhead, styles.manageSubheadSpaced]}>
                  Papers ({papersUploads.length})
                </Text>
                {papersUploads.length === 0 ? (
                  <Text style={styles.manageEmpty}>No papers yet.</Text>
                ) : (
                  papersUploads.map((row) => renderUploadRow(row))
                )}
                <Pressable
                  onPress={() => void pickDocumentsForCategory(LIBRARY_UPLOAD_CATEGORY.PAPERS)}
                  disabled={pickingCategory !== null || updatingId !== null || deletingId !== null}
                  style={({ pressed }) => [
                    styles.sectionAddFileBtn,
                    pressed && styles.onlyBtnPressed,
                    (pickingCategory !== null || updatingId !== null || deletingId !== null) &&
                      styles.onlyBtnDisabled,
                  ]}>
                  <Ionicons name="folder-open-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.sectionAddFileBtnText} numberOfLines={2}>
                    {pickingCategory === LIBRARY_UPLOAD_CATEGORY.PAPERS ? 'Opening…' : 'Add file — Papers'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/library')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}>
            <Ionicons name="book-outline" size={20} color={NAVY} />
            <Text style={styles.secondaryBtnText}>Browse library</Text>
            <Ionicons name="chevron-forward" size={18} color={NAVY} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F4FC' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.75)',
  },
  topTitle: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: TITLE,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(147,197,253,0.65)',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  heroInner: {
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(10,10,92,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 8,
    paddingHorizontal: 2,
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
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(147,197,253,0.85)',
  },
  secondaryBtnPressed: { opacity: 0.88 },
  secondaryBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_500Medium',
    color: NAVY,
  },
  manageSection: {
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(10,10,92,0.14)',
  },
  manageTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    marginBottom: 6,
  },
  manageHint: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 14,
  },
  manageSubhead: {
    fontSize: 14,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 8,
  },
  manageSubheadSpaced: { marginTop: 16 },
  categoriesRowStacked: {
    flexDirection: 'column',
    gap: 0,
  },
  categoryColumn: {
    width: '100%',
    minWidth: 0,
  },
  categoryColumnBelow: {
    width: '100%',
  },
  manageEmpty: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#94A3B8',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sectionAddFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: NAVY,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionAddFileBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
  },
  onlyBtnPressed: { opacity: 0.88 },
  onlyBtnDisabled: { opacity: 0.55 },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.55)',
  },
  uploadThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  uploadThumbDoc: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMeta: { flex: 1, minWidth: 0 },
  uploadName: {
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: NAVY,
  },
  uploadKind: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
  },
  rowActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 6,
    marginLeft: 4,
  },
  rowBtnUpdate: {
    minWidth: 76,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  rowBtnUpdateText: {
    fontSize: 11,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    letterSpacing: 0.2,
  },
  rowBtnDelete: {
    minWidth: 76,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  rowBtnDeleteText: {
    fontSize: 11,
    fontFamily: 'Roboto_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  rowBtnPressed: { opacity: 0.88 },
  rowBtnDisabled: { opacity: 0.45 },
  rowBtnWeb: { cursor: 'pointer' },
});

