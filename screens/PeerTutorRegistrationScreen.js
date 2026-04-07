import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import SectionHeader from '@/components/peer-tutor/SectionHeader';
import { isAppwriteConfigured } from '@/constants/appwriteConfig';
import { PT } from '@/constants/peerTutorTheme';
import { submitTutorApplication } from '@/services/tutorApplicationService';

/** ~7 cm width (mdpi: 160 dp ≈ 1 in, 2.54 cm per in). */
const PROOF_BUTTON_WIDTH_DP = PixelRatio.roundToNearestPixel((7 / 2.54) * 160);
const FIELD_GAP = 14;

const F = {
  reg: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const SEMESTERS = [
  '1st Year 1st Semester',
  '1st Year 2nd Semester',
  '2nd Year 1st Semester',
  '2nd Year 2nd Semester',
  '3rd Year 1st Semester',
  '3rd Year 2nd Semester',
  '4th Year 1st Semester',
  '4th Year 2nd Semester',
];

const STUDY_BG_URI =
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80&auto=format&fit=crop';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidContact(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** GPA on 4.0 scale */
function isValidGpa(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  if (Number.isNaN(n)) return false;
  return n >= 0 && n <= 4.0;
}

function parseModuleExpertise(text) {
  return text
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const PREFERRED_TEACHING_INITIAL = {
  programming: false,
  database: false,
  networking: false,
  mathematics: false,
  other: false,
};

function buildPreferredTeachingLabels(preferred, otherText) {
  const out = [];
  if (preferred.programming) out.push('Programming');
  if (preferred.database) out.push('Database Systems');
  if (preferred.networking) out.push('Networking');
  if (preferred.mathematics) out.push('Mathematics');
  if (preferred.other) {
    const t = (otherText || '').trim();
    out.push(t ? `Other: ${t}` : 'Other');
  }
  return out;
}

function TextField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  error,
  showError,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputPop,
          focused && styles.inputPopFocused,
          showError && error ? styles.inputShellError : null,
        ]}>
        <Ionicons
          name={icon}
          size={18}
          color={focused ? PT.accent : '#7BA7C7'}
          style={styles.inputIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={[styles.textInput, multiline && styles.textInputMulti]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {showError && error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function PeerTutorRegistrationScreen() {
  const router = useRouter();
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [degreeProgram, setDegreeProgram] = useState('');
  const [semester, setSemester] = useState('');
  const [gpa, setGpa] = useState('');
  const [moduleText, setModuleText] = useState('');
  const [preferredTeaching, setPreferredTeaching] = useState(() => ({ ...PREFERRED_TEACHING_INITIAL }));
  const [otherPreferredText, setOtherPreferredText] = useState('');
  const [proofUri, setProofUri] = useState(null);
  const [proofMime, setProofMime] = useState(null);

  const [semesterModal, setSemesterModal] = useState(false);
  const [semesterRowFocused, setSemesterRowFocused] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
    if (!contact.trim()) e.contact = 'Contact number is required.';
    else if (!isValidContact(contact)) e.contact = 'Use 7–15 digits.';
    if (!degreeProgram.trim()) e.degreeProgram = 'Degree program is required.';
    if (!semester) e.semester = 'Select your year & semester.';
    if (!gpa.trim()) e.gpa = 'GPA is required.';
    else if (!isValidGpa(gpa)) e.gpa = 'Enter GPA from 0 to 4.0.';
    const preferredLabels = buildPreferredTeachingLabels(preferredTeaching, otherPreferredText);
    const anyPreferredChecked =
      preferredTeaching.programming ||
      preferredTeaching.database ||
      preferredTeaching.networking ||
      preferredTeaching.mathematics ||
      preferredTeaching.other;
    if (!anyPreferredChecked) {
      e.preferredTeaching = 'Select at least one preferred teaching module.';
    }
    if (preferredTeaching.other && !otherPreferredText.trim()) {
      e.otherPreferred = 'Please describe the other module.';
    }
    const mods = parseModuleExpertise(moduleText);
    if (!preferredLabels.length && !mods.length) {
      e.modules = 'Select preferred modules above or list additional modules below.';
    }
    if (!proofUri) e.proof = 'Upload your result sheet.';
    return e;
  }, [
    fullName,
    email,
    contact,
    degreeProgram,
    semester,
    gpa,
    moduleText,
    preferredTeaching,
    otherPreferredText,
    proofUri,
  ]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const show = (key) => (touched ? errors[key] : null);

  const pickProof = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload your result sheet.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setProofUri(a.uri);
      setProofMime(a.mimeType || 'image/jpeg');
    }
  }, []);

  const clearForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setContact('');
    setDegreeProgram('');
    setSemester('');
    setGpa('');
    setModuleText('');
    setPreferredTeaching({ ...PREFERRED_TEACHING_INITIAL });
    setOtherPreferredText('');
    setProofUri(null);
    setProofMime(null);
    setTouched(false);
  }, []);

  const onSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;

    if (!isAppwriteConfigured()) {
      Alert.alert(
        'Appwrite not configured',
        'Add to app.json → expo.extra:\n• appwriteEndpoint\n• appwriteProjectId\n• appwriteDatabaseId\n• appwriteTutorCollectionId\n• appwriteProofBucketId',
      );
      return;
    }

    setLoading(true);
    try {
      await submitTutorApplication({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        contact: contact.replace(/\D/g, ''),
        degreeProgram: degreeProgram.trim(),
        year: semester,
        gpa: parseFloat(String(gpa).replace(',', '.')),
        moduleExpertise: [
          ...buildPreferredTeachingLabels(preferredTeaching, otherPreferredText),
          ...parseModuleExpertise(moduleText),
        ],
        proofImageUri: proofUri,
        proofMimeType: proofMime,
      });
      Alert.alert('Success', 'Application submitted. Waiting for approval.', [
        {
          text: 'OK',
          onPress: () => {
            clearForm();
            router.back();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Submit failed', err?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={PT.pageGradient}
        locations={PT.pageLocations}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Image
        source={{ uri: STUDY_BG_URI }}
        style={styles.bgPhoto}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={PT.wash}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color="#0A1628" />
            </Pressable>
            <Text style={styles.topBarTitle}>Tutor signup</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Become a Peer Tutor</Text>
            <Text style={styles.pageDesc}>
              Apply in a few steps. We’ll review your details and notify you after approval.
            </Text>

            {/* Personal */}
            <View style={styles.sectionCard}>
              <SectionHeader
                title="Personal information"
                titleStyle={styles.sectionTitle}
                subtitleStyle={styles.sectionSubtitle}
              />
              <TextField
                label="Full name"
                icon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                error={errors.fullName}
                showError={touched}
              />
              <TextField
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="you@university.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                showError={touched}
              />
              <TextField
                label="Contact number"
                icon="call-outline"
                value={contact}
                onChangeText={setContact}
                placeholder="Digits only"
                keyboardType="phone-pad"
                error={errors.contact}
                showError={touched}
              />
            </View>

            {/* Academic */}
            <View style={styles.sectionCard}>
              <SectionHeader
                title="Academic details"
                subtitle="Programme and current semester."
                titleStyle={styles.sectionTitle}
                subtitleStyle={styles.sectionSubtitle}
              />
              <TextField
                label="Degree program"
                icon="school-outline"
                value={degreeProgram}
                onChangeText={setDegreeProgram}
                placeholder="e.g. BSc Information Technology"
                error={errors.degreeProgram}
                showError={touched}
              />

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Year & semester</Text>
                <Pressable
                  onPress={() => {
                    setSemesterModal(true);
                    setSemesterRowFocused(true);
                  }}
                  style={[
                    styles.inputPop,
                    styles.rowPick,
                    semesterRowFocused && styles.inputPopFocused,
                    show('semester') ? styles.inputShellError : null,
                  ]}>
                  <Ionicons name="calendar-outline" size={18} color="#7BA7C7" style={styles.inputIcon} />
                  <Text style={[styles.pickText, !semester && styles.pickPlaceholder]} numberOfLines={2}>
                    {semester || 'Select semester'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={PT.accentDeep} />
                </Pressable>
                {show('semester') ? <Text style={styles.fieldError}>{errors.semester}</Text> : null}
              </View>

              <TextField
                label="GPA (max 4.0)"
                icon="stats-chart-outline"
                value={gpa}
                onChangeText={setGpa}
                placeholder="0.0 – 4.0"
                keyboardType="decimal-pad"
                error={errors.gpa}
                showError={touched}
              />
            </View>

            {/* Preferred teaching modules — checkboxes */}
            <View style={styles.sectionCard}>
              <SectionHeader
                title="Preferred Teaching Module"
                subtitle="Select all areas you are comfortable teaching."
                titleStyle={styles.preferredModuleHeading}
                subtitleStyle={styles.preferredModuleHeadingSubtitle}
              />
              <View style={styles.checkboxList}>
                <Pressable
                  onPress={() =>
                    setPreferredTeaching((p) => ({ ...p, programming: !p.programming }))
                  }
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && styles.checkboxRowPressed,
                  ]}>
                  <Ionicons
                    name={preferredTeaching.programming ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={preferredTeaching.programming ? PT.accent : '#64748B'}
                  />
                  <Text style={styles.checkboxLabel}>Programming</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setPreferredTeaching((p) => ({ ...p, database: !p.database }))
                  }
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && styles.checkboxRowPressed,
                  ]}>
                  <Ionicons
                    name={preferredTeaching.database ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={preferredTeaching.database ? PT.accent : '#64748B'}
                  />
                  <Text style={styles.checkboxLabel}>Database Systems</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setPreferredTeaching((p) => ({ ...p, networking: !p.networking }))
                  }
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && styles.checkboxRowPressed,
                  ]}>
                  <Ionicons
                    name={preferredTeaching.networking ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={preferredTeaching.networking ? PT.accent : '#64748B'}
                  />
                  <Text style={styles.checkboxLabel}>Networking</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setPreferredTeaching((p) => ({ ...p, mathematics: !p.mathematics }))
                  }
                  style={({ pressed }) => [
                    styles.checkboxRow,
                    pressed && styles.checkboxRowPressed,
                  ]}>
                  <Ionicons
                    name={preferredTeaching.mathematics ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={preferredTeaching.mathematics ? PT.accent : '#64748B'}
                  />
                  <Text style={styles.checkboxLabel}>Mathematics</Text>
                </Pressable>
                <View style={styles.otherRow}>
                  <Pressable
                    onPress={() =>
                      setPreferredTeaching((p) => ({ ...p, other: !p.other }))
                    }
                    style={({ pressed }) => [
                      styles.otherCheckbox,
                      pressed && styles.checkboxRowPressed,
                    ]}>
                    <Ionicons
                      name={preferredTeaching.other ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={preferredTeaching.other ? PT.accent : '#64748B'}
                    />
                    <Text style={styles.otherCheckboxLabel}>Other</Text>
                  </Pressable>
                  <TextInput
                    value={otherPreferredText}
                    onChangeText={setOtherPreferredText}
                    placeholder="Specify module"
                    placeholderTextColor="#94A3B8"
                    editable={preferredTeaching.other}
                    style={[
                      styles.otherInput,
                      !preferredTeaching.other && styles.otherInputDisabled,
                    ]}
                  />
                </View>
              </View>
              {touched && errors.preferredTeaching ? (
                <Text style={styles.fieldError}>{errors.preferredTeaching}</Text>
              ) : null}
              {touched && errors.otherPreferred ? (
                <Text style={styles.fieldError}>{errors.otherPreferred}</Text>
              ) : null}
            </View>

            {/* Modules — typed */}
            <View style={styles.sectionCard}>
              <SectionHeader
                title="Module expertise"
                subtitle="Optional: list extra modules or details. Separate with commas."
                titleStyle={styles.sectionTitle}
                subtitleStyle={styles.sectionSubtitle}
              />
              <TextField
                label="Additional modules"
                icon="library-outline"
                value={moduleText}
                onChangeText={setModuleText}
                placeholder="OOP, DBMS, Networking"
                error={errors.modules}
                showError={touched}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Proof + actions */}
            <View style={styles.sectionCard}>
              <SectionHeader
                title="Proof"
                subtitle="Recent result sheet (JPG or PNG)."
                titleStyle={styles.sectionTitle}
                subtitleStyle={styles.sectionSubtitle}
              />

              <View style={styles.proofActionsColumn}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={pickProof}
                  activeOpacity={0.85}
                  hitSlop={8}>
                  <Ionicons name="image-outline" size={18} color={PT.uploadGold} style={styles.uploadBtnIcon} />
                  <Text style={styles.uploadBtnText} numberOfLines={2}>
                    Upload Result Sheet
                  </Text>
                </TouchableOpacity>

                {proofUri ? (
                  <View style={styles.previewBlock}>
                    <Image source={{ uri: proofUri }} style={styles.previewThumb} contentFit="cover" />
                    <TouchableOpacity onPress={() => setProofUri(null)} hitSlop={10} style={styles.removeBtn}>
                      <Text style={styles.removeLink}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {show('proof') ? (
                  <Text style={[styles.fieldError, styles.proofFieldError]}>{errors.proof}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitOuter, { opacity: loading ? 0.85 : 1 }]}
                  onPress={onSubmit}
                  disabled={loading}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={PT.submitGrad}
                    locations={PT.submitLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitText} numberOfLines={2}>
                        Submit application
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={semesterModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSemesterModal(false);
          setSemesterRowFocused(false);
        }}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setSemesterModal(false);
              setSemesterRowFocused(false);
            }}
          />
          <View style={styles.modalCenter}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Select year & semester</Text>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {SEMESTERS.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.modalRow}
                    onPress={() => {
                      setSemester(s);
                      setSemesterModal(false);
                      setSemesterRowFocused(false);
                    }}>
                    <Text style={styles.modalRowText} numberOfLines={2}>
                      {s}
                    </Text>
                    {semester === s ? <Ionicons name="checkmark-circle" size={22} color={PT.accent} /> : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C4A6E',
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  bgPhoto: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.8)',
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: F.semi,
    color: '#0A1628',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: F.bold,
    color: '#0A1628',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  pageDesc: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: F.reg,
    color: '#1E293B',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: PT.label,
    fontSize: 17,
    fontFamily: F.semi,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    color: PT.textMuted,
  },
  /** Preferred Teaching Module — same heading/subtitle treatment as “Academic details” */
  preferredModuleHeading: {
    color: PT.label,
    fontSize: 17,
    fontFamily: F.semi,
    letterSpacing: 0.2,
  },
  preferredModuleHeadingSubtitle: {
    color: PT.textMuted,
  },
  sectionCard: {
    backgroundColor: PT.sectionBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: FIELD_GAP,
    borderWidth: 1.5,
    borderColor: PT.sectionBorder,
    shadowColor: PT.sectionShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  fieldBlock: {
    marginBottom: FIELD_GAP,
  },
  checkboxList: {
    marginTop: 4,
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: PT.popRadius,
    backgroundColor: PT.popBg,
    borderWidth: 1.5,
    borderColor: PT.popBorder,
    minHeight: 48,
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  checkboxRowPressed: {
    opacity: 0.92,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  otherCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: PT.popRadius,
    backgroundColor: PT.popBg,
    borderWidth: 1.5,
    borderColor: PT.popBorder,
    marginRight: 8,
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  otherCheckboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: F.reg,
    color: PT.textPrimary,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: F.reg,
    color: PT.textPrimary,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 0,
  },
  otherInput: {
    flex: 1,
    minWidth: 160,
    fontSize: 16,
    fontFamily: F.reg,
    color: PT.textPrimary,
    backgroundColor: PT.popBg,
    borderRadius: PT.popRadius,
    borderWidth: 1.5,
    borderColor: PT.popBorder,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: 48,
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otherInputDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 13,
    fontFamily: F.med,
    color: PT.label,
    marginBottom: 8,
  },
  /** Raised “pop-up” field row — mobile-friendly tap height */
  inputPop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PT.popBg,
    borderRadius: PT.popRadius,
    borderWidth: 1.5,
    borderColor: PT.popBorder,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    minHeight: 52,
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  inputPopFocused: {
    borderColor: PT.popBorderFocus,
    borderWidth: 2,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 7,
  },
  inputShellError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: F.reg,
    color: PT.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: 48,
  },
  textInputMulti: {
    minHeight: 88,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
  },
  rowPick: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickText: {
    flex: 1,
    fontSize: 16,
    fontFamily: F.reg,
    color: PT.textPrimary,
    paddingVertical: 6,
  },
  pickPlaceholder: {
    color: '#94A3B8',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: F.med,
    color: '#DC2626',
  },
  proofActionsColumn: {
    width: '100%',
    alignItems: 'center',
  },
  proofFieldError: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  uploadBtn: {
    alignSelf: 'flex-start',
    width: PROOF_BUTTON_WIDTH_DP,
    maxWidth: '100%',
    minHeight: 52,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: PT.popRadius,
    borderWidth: 1.5,
    borderColor: PT.uploadGold,
    backgroundColor: 'rgba(253,224,71,0.14)',
    shadowColor: PT.popShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  uploadBtnIcon: {
    marginBottom: 4,
  },
  uploadBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.semi,
    color: '#B45309',
    textAlign: 'center',
  },
  previewBlock: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  previewThumb: {
    width: 104,
    height: 104,
    borderRadius: PT.popRadius,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: PT.popBorder,
  },
  removeBtn: {
    marginTop: 8,
  },
  removeLink: {
    fontSize: 13,
    fontFamily: F.med,
    color: '#DC2626',
  },
  submitOuter: {
    alignSelf: 'flex-start',
    width: PROOF_BUTTON_WIDTH_DP,
    maxWidth: '100%',
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: PT.submitShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtn: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: F.semi,
    textAlign: 'center',
  },
  modalRoot: { flex: 1 },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    maxHeight: '72%',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PT.popBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: F.semi,
    color: PT.label,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(147,197,253,0.45)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalScroll: {
    maxHeight: 360,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  modalRowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: F.reg,
    color: '#334155',
    paddingRight: 8,
  },
});
