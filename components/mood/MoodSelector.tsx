import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveMoodLog } from '../../lib/appwrite';

const COLORS = {
  navy: '#0A0A5C',
  navyMid: '#1E3A8A',
  navyLight: '#DBEAFE',
  textPrimary: '#0A0A5C',
  textSecondary: '#4A5568',
  white: '#FFFFFF',
  accent: '#0a7ea4',
};

const MOODS = [
  { id: '5', emoji: '😄', label: 'Great', level: 5 },
  { id: '4', emoji: '😊', label: 'Good', level: 4 },
  { id: '3', emoji: '😐', label: 'Okay', level: 3 },
  { id: '2', emoji: '😔', label: 'Low', level: 2 },
  { id: '1', emoji: '😢', label: 'Struggling', level: 1 },
];

const FACTORS = ['Academic Stress', 'Sleep Deprivation', 'Financial', 'Social/Relationships', 'Health/Diet', 'Exhaustion', 'Other'];

interface Props {
  onComplete: () => void;
}

export default function MoodSelector({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleFactor = (factor: string) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter(f => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedMood) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      await saveMoodLog({
        moodLevel: selectedMood.level,
        factors: selectedFactors,
        journal: journal.trim() === '' ? null : journal,
      });
      onComplete();
    } catch (error: any) {
      console.error('Failed to save mood log:', error);
      Alert.alert('Error', 'Failed to save your mood check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Navy Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerEmoji}>{step === 1 ? '😊' : step === 2 ? '🧠' : '✍️'}</Text>
        <Text style={styles.headerTitle}>Mood Check-in</Text>
        <Text style={styles.stepIndicator}>Step {step} of 3</Text>
      </View>

      <View style={styles.innerContent}>
        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>

      {/* STEP 1 */}
      {step === 1 && (
        <View>
          <Text style={styles.question}>How are you feeling right now?</Text>
          <FlatList
            data={MOODS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.moodBtn, selectedMood?.id === item.id && styles.moodBtnActive]}
                onPress={() => setSelectedMood(item)}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.moodLabel, selectedMood?.id === item.id && styles.moodLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={[styles.btn, !selectedMood && styles.btnDisabled]}
            disabled={!selectedMood}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>Next: Context →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <View>
          <Text style={styles.question}>What's influencing your mood?</Text>
          <Text style={styles.subQuestion}>Select all that apply.</Text>

          <View style={styles.factorsGrid}>
            {FACTORS.map(f => {
              const isActive = selectedFactors.includes(f);
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.factorBtn, isActive && styles.factorBtnActive]}
                  onPress={() => toggleFactor(f)}
                >
                  <Text style={[styles.factorText, isActive && styles.factorTextActive]}>{f}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={handleNext}>
              <Text style={styles.btnText}>Next: Journal →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <View>
          <Text style={styles.question}>Any additional thoughts? (Optional)</Text>
          <Text style={styles.subQuestion}>Journals are fully encrypted and only visible to you unless explicitly shared.</Text>

          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="I'm feeling..."
            placeholderTextColor="#94A3B8"
            value={journal}
            onChangeText={setJournal}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleSubmit}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Check-in ✅</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBanner: {
    backgroundColor: COLORS.navy,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: 32, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  innerContent: { padding: 24 },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: 6, backgroundColor: COLORS.navyMid, borderRadius: 3 },
  stepIndicator: { fontSize: 13, color: '#DBEAFE', fontWeight: '600', marginTop: 4, opacity: 0.9 },
  question: { fontSize: 19, fontWeight: '800', color: COLORS.navy, marginBottom: 8, textAlign: 'center' },
  subQuestion: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  row: { gap: 12, paddingHorizontal: 4 },
  moodBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F8FAFC',
    backgroundColor: '#F8FAFC',
    width: 76,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  moodBtnActive: { borderColor: COLORS.navy, backgroundColor: COLORS.navyLight },
  emoji: { fontSize: 34, marginBottom: 6 },
  moodLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  moodLabelActive: { color: COLORS.navy, fontWeight: '700' },

  factorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28 },
  factorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  factorBtnActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  factorText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  factorTextActive: { color: COLORS.white },

  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 18,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    color: '#1E2937',
  },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  backText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },

  btn: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
    minWidth: 160,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});