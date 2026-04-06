import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Upeksha Methsarani');
  const [email, setEmail] = useState(user?.email || 'upeksamethsarani137@gmail.com');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Blue Header Section */}
        <LinearGradient
          colors={['#0B173B', '#0B173B']}
          style={styles.headerBackground}
        >
          <SafeAreaView>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>{name.charAt(0)}</Text>
                </View>
                <TouchableOpacity style={styles.editIconBadge}>
                   <IconSymbol size={14} name="pencil" color="#0B173B" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.userNameText}>{name}</Text>
              <Text style={styles.userSubText}>Student • SRMS</Text>
              
              <View style={styles.tagBadge}>
                 <Text style={styles.tagText}>🎓 Undergraduate • Year 3</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* White Content Section */}
        <View style={styles.whiteContent}>
          
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <View style={styles.card}>
              <InfoRow 
                icon="person.fill" 
                label="FULL NAME" 
                value={name} 
                isEditing={isEditing}
                onChangeText={setName}
              />
              <View style={styles.divider} />
              <InfoRow 
                icon="envelope.fill" 
                label="EMAIL" 
                value={email} 
                isEditing={isEditing}
                onChangeText={setEmail}
                showCopy
              />
              <View style={styles.divider} />
              <InfoRow 
                icon="person.crop.card.fill" 
                label="STUDENT ID" 
                value="upeksamethsarani137" 
                showCopy
              />
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STATISTICS</Text>
            <View style={styles.statsGrid}>
              <StatBox icon="checkmark.square.fill" value="8" label="Tasks Done" iconColor="#4CAF50" />
              <StatBox icon="person.2.fill" value="5" label="Kuppi Groups" iconColor="#673AB7" />
              <StatBox icon="heart.fill" value="Good" label="Wellbeing" iconColor="#F44336" />
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK LINKS</Text>
            <QuickLink icon="doc.fill" label="My Documents" color="#E3F2FD" iconC="#2196F3" />
            <QuickLink icon="tag.fill" label="Saved Items" color="#FCE4EC" iconC="#E91E63" />
            <QuickLink icon="chart.bar.fill" label="My Progress" color="#E8F5E9" iconC="#4CAF50" />
          </View>
        </View>
      </ScrollView>

      {/* Floating Edit Button (Optional) */}
      <TouchableOpacity 
        style={styles.floatingEditBtn} 
        onPress={() => setIsEditing(!isEditing)}
      >
        <IconSymbol size={24} name={isEditing ? 'checkmark' : 'pencil'} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// Reusable Components
interface InfoRowProps {
  icon: any;
  label: string;
  value: string;
  isEditing?: boolean;
  onChangeText?: (text: string) => void;
  showCopy?: boolean;
}

const InfoRow = ({ icon, label, value, isEditing, onChangeText, showCopy }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <IconSymbol size={20} name={icon} color="#0B173B" />
    </View>
    <View style={styles.infoTextContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} />
      ) : (
        <Text style={styles.infoValue}>{value}</Text>
      )}
    </View>
    {showCopy && <IconSymbol size={18} name="doc.on.doc" color="#CCC" />}
  </View>
);

interface StatBoxProps {
  icon: any;
  value: string | number;
  label: string;
  iconColor: string;
}

const StatBox = ({ icon, value, label, iconColor }: StatBoxProps) => (
  <View style={styles.statBox}>
    <IconSymbol size={28} name={icon} color={iconColor} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface QuickLinkProps {
  icon: any;
  label: string;
  color: string;
  iconC: string;
}

const QuickLink = ({ icon, label, color, iconC }: QuickLinkProps) => (
  <TouchableOpacity style={styles.linkRow}>
    <View style={[styles.linkIconBox, { backgroundColor: color }]}>
      <IconSymbol size={20} name={icon} color={iconC} />
    </View>
    <Text style={styles.linkText}>{label}</Text>
    <IconSymbol size={16} name="chevron.right" color="#CCC" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  headerBackground: {
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: { alignItems: 'center', marginTop: 20 },
  avatarWrapper: { position: 'relative' },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 15,
  },
  userNameText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 15 },
  userSubText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tagBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
  },
  tagText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  whiteContent: { marginTop: -25, paddingHorizontal: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#718096', marginBottom: 12, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F2FF', justifyContent: 'center', alignItems: 'center' },
  infoTextContent: { flex: 1, marginLeft: 15 },
  infoLabel: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  infoValue: { fontSize: 15, color: '#333', fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 5 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { 
    width: (width - 60) / 3, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 15, 
    alignItems: 'center',
    elevation: 2, shadowOpacity: 0.05
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  linkRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 15, 
    marginBottom: 10,
    elevation: 1 
  },
  linkIconBox: { padding: 10, borderRadius: 12 },
  linkText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#333' },
  floatingEditBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#0B173B',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  input: { borderBottomWidth: 1, borderBottomColor: '#0B173B', padding: 0, fontSize: 15 }
}); 