import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';

import DashboardCard from '@/components/DashboardCard';
import StudentZoomLinkHubCard from '@/components/StudentZoomLinkHubCard';
import DashboardSupportFooter from '@/components/DashboardSupportFooter';
import COLORS from '@/constants/colors';
import { KUPPI_CYAN, KUPPI_GOLD } from '@/constants/kuppiPalette';
import {
  sessionSchedulingBrowseModulesParams,
  sessionSchedulingCreateModulesParams,
} from '@/constants/sessionSchedulingFaculties';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import {
  formatNotificationAgo,
  getStudentNotifications,
  markAllSessionPollNotificationsRead,
  markStudentNotificationRead,
} from '@/services/studentNotificationsStorage';
import { getSavedKuppiModuleLinks } from '@/services/tutorKuppiLinkStorage';
import { displayNameFromEmail, stripRoleSuffixFromDisplayName } from '@/utils/displayNameFromEmail';

/**
 * Light, calm study-themed photo (books / learning). Cached by expo-image.
 * Replace with a local asset in `assets/` if you need fully offline support.
 */
const STUDY_BACKGROUND_URI =
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&q=80&auto=format&fit=crop';
const UNIFIED_CARD_COLORS = ['#FFFFFF', '#E8E8F4'];

/** Light frosted backdrop (books photo + soft blue-grey wash) — top & bottom of scroll. */
function DashboardLiquidGlassBackdrop() {
  const blurIntensity = Platform.OS === 'android' ? 36 : 56;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#DDE7F0', '#E4E9F2', '#E8ECF3', '#DFE6EF', '#D8E2ED']}
        locations={[0, 0.22, 0.48, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(148,163,184,0.35)', 'transparent', 'rgba(191,219,254,0.28)', 'transparent']}
        locations={[0, 0.38, 0.64, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={{ uri: STUDY_BACKGROUND_URI }}
        style={styles.liquidBackdropPhoto}
        contentFit="cover"
        transition={400}
        cachePolicy="memory-disk"
      />
      <BlurView
        intensity={blurIntensity}
        tint="light"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(248,250,252,0.35)', 'rgba(226,232,240,0.25)']}
        locations={[0, 0.3, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const [welcomeName, setWelcomeName] = useState('Student');
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileStudentId, setProfileStudentId] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ top: 0, left: 0, width: 200 });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loginRole, setLoginRole] = useState('student');
  const [kuppiLinks, setKuppiLinks] = useState([]);
  const [studentNotifs, setStudentNotifs] = useState([]);

  const userMenuTriggerRef = useRef(null);

  const dummyNotifications = useMemo(
    () => [
      {
        id: 'n1',
        title: 'Kuppi reminder: OOP revision session tomorrow 3:00 PM — Lab 2',
        ago: '2 hours ago',
        unread: true,
      },
      {
        id: 'n2',
        title: 'New peer tutor slot: Database Systems group study — Friday 5:00 PM (open seats)',
        ago: 'Yesterday',
        unread: true,
      },
      {
        id: 'n3',
        title: 'Session update: Your booking for Probability & Statistics Kuppi was confirmed',
        ago: '3 days ago',
        unread: false,
      },
    ],
    [],
  );
  const sessionPollUnreadCount = useMemo(
    () => studentNotifs.filter((n) => n.kind === 'session_poll' && !n.read).length,
    [studentNotifs],
  );
  const unreadCount = useMemo(
    () =>
      loginRole === 'peerTutor'
        ? dummyNotifications.filter((n) => n.unread).length
        : sessionPollUnreadCount,
    [loginRole, dummyNotifications, sessionPollUnreadCount],
  );

  const refreshStudentNotifs = useCallback(async () => {
    const list = await getStudentNotifications();
    setStudentNotifs(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emailStored, photoStored, fullNameStored, idStored, roleStored] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.studentEmail),
        AsyncStorage.getItem(STORAGE_KEYS.profileImageUri),
        AsyncStorage.getItem(STORAGE_KEYS.studentFullName),
        AsyncStorage.getItem(STORAGE_KEYS.studentId),
        AsyncStorage.getItem(STORAGE_KEYS.loginRole),
      ]);
      if (!cancelled) {
        if (roleStored === 'peerTutor') setLoginRole('peerTutor');
        else setLoginRole('student');
        if (photoStored) setProfileImageUri(photoStored);
        if (fullNameStored) setProfileFullName(fullNameStored);
        if (idStored) setProfileStudentId(idStored);

        const nameFromEmail = displayNameFromEmail(emailStored || '');
        if (fullNameStored?.trim()) {
          const cleaned = stripRoleSuffixFromDisplayName(fullNameStored.trim());
          const first = cleaned.split(/\s+/).filter(Boolean)[0] || cleaned;
          const cap = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
          setWelcomeName(cap.replace(/,\s*$/, ''));
        } else if (nameFromEmail) {
          setWelcomeName(stripRoleSuffixFromDisplayName(nameFromEmail) || nameFromEmail);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const rows = await getSavedKuppiModuleLinks();
          if (!cancelled) setKuppiLinks(rows);
        } catch {
          if (!cancelled) setKuppiLinks([]);
        }
        try {
          const notifs = await getStudentNotifications();
          if (!cancelled) setStudentNotifs(notifs);
        } catch {
          if (!cancelled) setStudentNotifs([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [loginRole]),
  );

  const headerIdentityLine = useMemo(() => {
    const idPart = profileStudentId.trim();
    const displayName = stripRoleSuffixFromDisplayName(profileFullName.trim() || welcomeName);
    const nameUpper = displayName.toUpperCase();
    return idPart ? `${idPart} ${nameUpper}` : nameUpper;
  }, [profileStudentId, profileFullName, welcomeName]);

  const greetingFirstName = useMemo(
    () => stripRoleSuffixFromDisplayName(welcomeName) || welcomeName,
    [welcomeName],
  );

  const persistProfileUri = useCallback(async (uri) => {
    if (uri) {
      await AsyncStorage.setItem(STORAGE_KEYS.profileImageUri, uri);
      setProfileImageUri(uri);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.profileImageUri);
      setProfileImageUri(null);
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to set your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistProfileUri(result.assets[0].uri);
    }
  }, [persistProfileUri]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistProfileUri(result.assets[0].uri);
    }
  }, [persistProfileUri]);

  const openPhotoOptions = useCallback(() => {
    const galleryLabel = Platform.OS === 'web' ? 'Upload image' : 'Choose from gallery';
    const run = (fn) => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => fn());
      });
    };

    if (Platform.OS === 'ios') {
      const options = [galleryLabel, 'Take photo'];
      let removeIndex = -1;
      if (profileImageUri) {
        removeIndex = options.length;
        options.push('Remove photo');
      }
      options.push('Cancel');
      const cancelIndex = options.length - 1;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: removeIndex >= 0 ? removeIndex : undefined,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === cancelIndex) return;
          if (buttonIndex === 0) run(() => void pickFromLibrary());
          else if (buttonIndex === 1) run(() => void pickFromCamera());
          else if (buttonIndex === removeIndex) run(() => void persistProfileUri(null));
        },
      );
      return;
    }

    const buttons = [
      { text: galleryLabel, onPress: () => run(() => void pickFromLibrary()) },
      { text: 'Take photo', onPress: () => run(() => void pickFromCamera()) },
    ];
    if (profileImageUri) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => run(() => void persistProfileUri(null)),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Camera, gallery, or upload an image file', buttons);
  }, [pickFromLibrary, pickFromCamera, profileImageUri, persistProfileUri]);

  const runAfterMenuCloses = useCallback((action) => {
    setProfileMenuOpen(false);
    InteractionManager.runAfterInteractions(() => {
      const delay = Platform.OS === 'android' ? 240 : Platform.OS === 'ios' ? 100 : 80;
      setTimeout(action, delay);
    });
  }, []);

  const onProfileAvatarPress = useCallback(() => {
    openPhotoOptions();
  }, [openPhotoOptions]);

  const toggleUserMenu = useCallback(() => {
    if (profileMenuOpen) {
      setProfileMenuOpen(false);
      return;
    }
    userMenuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({
        top: y + height + 6,
        left: Math.max(12, x),
        width: Math.max(width, 168),
      });
      setProfileMenuOpen(true);
    });
  }, [profileMenuOpen]);

  const onNotificationsPress = useCallback(() => {
    setNotificationsOpen(true);
  }, []);

  const openSessionPollFromNotification = useCallback(
    async (n) => {
      if (n?.id) await markStudentNotificationRead(n.id);
      await refreshStudentNotifs();
      setNotificationsOpen(false);
      router.push({
        pathname: '/session-scheduling-polls',
        params: {
          moduleId: n.moduleId,
          moduleTitle: encodeURIComponent(n.moduleTitle || ''),
        },
      });
    },
    [router, refreshStudentNotifs],
  );

  const onMarkAllNotificationsRead = useCallback(async () => {
    if (loginRole === 'peerTutor') {
      Alert.alert('Marked', 'Sample notifications — nothing to sync yet.');
      return;
    }
    await markAllSessionPollNotificationsRead();
    await refreshStudentNotifs();
  }, [loginRole, refreshStudentNotifs]);

  const sessionPollBanner = useMemo(() => {
    if (loginRole === 'peerTutor') return null;
    const unread = studentNotifs.filter((x) => x.kind === 'session_poll' && !x.read);
    if (unread.length === 0) return null;
    const first = unread[0];
    const extra = unread.length > 1 ? ` (+${unread.length - 1} more)` : '';
    return { first, extra };
  }, [loginRole, studentNotifs]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const greeting = getGreetingByTime();

  const cards = useMemo(() => {
    const list = [];
    if (loginRole === 'peerTutor') {
      list.push({
        title: 'Create session scheduling',
        description: 'Create poll-based Kuppi slots (2–3 day/time options)',
        icon: 'create-outline',
        iconType: 'ionicons',
        colors: UNIFIED_CARD_COLORS,
        featured: true,
      });
      list.push({
        title: 'Session scheduling',
        description: 'Open your modules to see published polls and live vote counts (students vote; tutors view only)',
        icon: 'calendar-outline',
        iconType: 'ionicons',
        colors: UNIFIED_CARD_COLORS,
        featured: false,
      });
      list.push({
        title: 'Upload library',
        description: 'Pick a module, then upload notes or papers for students',
        icon: 'cloud-upload-outline',
        iconType: 'ionicons',
        colors: UNIFIED_CARD_COLORS,
        featured: false,
      });
    } else {
      list.push({
        title: 'Session scheduling',
        description: 'View polls and vote for your preferred session time',
        icon: 'calendar-outline',
        iconType: 'ionicons',
        colors: UNIFIED_CARD_COLORS,
        featured: true,
      });
    }
    list.push({
      title: 'Library (Notes)',
      description: 'Access and upload learning materials',
      icon: 'book-outline',
      iconType: 'ionicons',
      colors: UNIFIED_CARD_COLORS,
      featured: false,
    });
    if (loginRole !== 'peerTutor') {
      list.push({
        title: 'Timed Quizzes',
        description: 'Attempt quizzes with time limits',
        icon: 'timer-outline',
        iconType: 'ionicons',
        colors: UNIFIED_CARD_COLORS,
        featured: false,
      });
    }
    return list;
  }, [loginRole]);

  const handleCardPress = (title) => {
    if (title === 'Create session scheduling') {
      router.push({
        pathname: '/session-scheduling-modules',
        params: sessionSchedulingCreateModulesParams,
      });
      return;
    }
    if (title === 'Session scheduling') {
      router.push({
        pathname: '/session-scheduling-modules',
        params: sessionSchedulingBrowseModulesParams,
      });
      return;
    }
    if (title === 'Upload library') {
      router.push('/tutor-library-module-select');
      return;
    }
    if (title === 'Library (Notes)') {
      router.push('/library');
      return;
    }
    if (title === 'Timed Quizzes') {
      router.push('/timed-quiz');
      return;
    }
    Alert.alert(title, 'Feature page can be connected in the next step.');
  };

  return (
    <View style={styles.root}>
      <DashboardLiquidGlassBackdrop />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageFrame}>
            {/* Glass-style header */}
            <LinearGradient
              colors={['rgba(255,255,255,0.58)', 'rgba(248,250,252,0.42)', 'rgba(241,245,249,0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}>
              <View style={styles.headerGlassOrb} />
              <View style={styles.headerGlassShine} />
              <View style={styles.appBar}>
                <View style={styles.brandWrap}>
                  <Text
                    style={styles.brandTitleFull}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.68}>
                    {`KUPPI${'\n'}MANAGEMENT`}
                  </Text>
                </View>

                <View style={styles.rightCluster}>
                  <Pressable
                    onPress={onNotificationsPress}
                    style={({ pressed }) => [styles.notifButton, pressed && styles.notifButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications">
                    <Ionicons name="notifications" size={16} color="#FFFFFF" />
                    {unreadCount > 0 ? (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                      </View>
                    ) : null}
                  </Pressable>

                  <Pressable
                    ref={userMenuTriggerRef}
                    collapsable={false}
                    onPress={toggleUserMenu}
                    style={({ pressed }) => [styles.userMenuTrigger, pressed && styles.userMenuTriggerPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile menu">
                    <Text style={styles.userMenuText} numberOfLines={1} ellipsizeMode="tail">
                      {headerIdentityLine}
                    </Text>
                    <Ionicons
                      name={profileMenuOpen ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color="#374151"
                    />
                  </Pressable>

                  <View style={styles.avatarColumn}>
                    <View style={styles.avatarGlow} />
                    <Pressable
                      onPress={onProfileAvatarPress}
                      style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Upload or change profile photo">
                      {profileImageUri ? (
                        <Image
                          source={{ uri: profileImageUri }}
                          style={styles.avatarImage}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <Ionicons name="person" size={18} color={COLORS.darkNavy} />
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.greetingBlock}>
                <Text style={styles.greetingTime}>{greeting}!</Text>
                <Text style={styles.greetingHi}>Hi, {greetingFirstName}</Text>
              </View>
            </LinearGradient>

            <View style={styles.contentBody}>
              <View style={styles.contentBodyInner}>
                <View style={styles.pageTitleWrap}>
                  <Text style={styles.pageTitle}>Dashboard</Text>
                  <Text style={styles.pageSubtitle}>Pick a feature to continue your studies</Text>
                </View>

                {sessionPollBanner ? (
                  <Pressable
                    onPress={() => openSessionPollFromNotification(sessionPollBanner.first)}
                    style={({ pressed }) => [styles.pollAlertBanner, pressed && styles.pollAlertBannerPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open session scheduling poll">
                    <LinearGradient
                      colors={['rgba(125,211,252,0.55)', 'rgba(56,189,248,0.35)', 'rgba(14,165,233,0.25)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.pollAlertBannerGrad}>
                      <Ionicons name="calendar" size={22} color="#0A0A5C" />
                      <View style={styles.pollAlertBannerTextWrap}>
                        <Text style={styles.pollAlertBannerTitle} numberOfLines={2}>
                          {sessionPollBanner.first.moduleTitle}
                          {sessionPollBanner.extra}
                        </Text>
                        <Text style={styles.pollAlertBannerSub} numberOfLines={2}>
                          {sessionPollBanner.first.pollTitle
                            ? `“${sessionPollBanner.first.pollTitle}” — please open Session scheduling and vote on the poll.`
                            : 'Please open Session scheduling and vote on the new poll.'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#0A0A5C" />
                    </LinearGradient>
                  </Pressable>
                ) : null}

                <Animated.View
                  style={[
                    styles.featureSection,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                  ]}>
                  <View style={styles.cardStack}>
                    {cards.map((card) => (
                      <DashboardCard
                        key={card.title}
                        variant="list"
                        title={card.title}
                        description={card.description}
                        icon={card.icon}
                        iconType={card.iconType}
                        iconUri={card.iconUri}
                        colors={card.colors}
                        featured={card.featured}
                        onPress={() => handleCardPress(card.title)}
                      />
                    ))}
                    <StudentZoomLinkHubCard linkCount={kuppiLinks.length} />
                  </View>
                </Animated.View>

                <View style={styles.quoteCard}>
                  <Ionicons name="book-outline" size={22} color="#7DD3FC" style={styles.quoteIcon} />
                  <Text style={styles.quoteText}>
                    {`Small steps every day add up to big results — keep going, ${greetingFirstName}!`}
                  </Text>
                </View>
              </View>
            </View>

            <DashboardSupportFooter />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={profileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileMenuOpen(false)}>
        <View style={styles.menuModalRoot} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={() => setProfileMenuOpen(false)} />
          <View
            style={[
              styles.dropdownPanel,
              {
                top: menuAnchor.top,
                left: menuAnchor.left,
                minWidth: menuAnchor.width,
              },
            ]}>
            <Text style={styles.dropdownItemText}>Profile</Text>

            <Pressable
              onPress={() => runAfterMenuCloses(() => void pickFromCamera())}
              style={({ pressed }) => [
                styles.dropdownActionRow,
                pressed && styles.dropdownActionRowPressed,
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera">
              <Ionicons name="camera-outline" size={20} color="#4B5563" />
              <View style={styles.dropdownActionLabels}>
                <Text style={styles.dropdownActionTitle}>Take photo</Text>
                <Text style={styles.dropdownActionSub}>
                  {Platform.OS === 'web' ? 'Camera capture when your browser supports it' : 'Open the camera'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>

            <View style={styles.dropdownDivider} />

            <Pressable
              onPress={() => runAfterMenuCloses(() => void pickFromLibrary())}
              style={({ pressed }) => [
                styles.dropdownActionRow,
                pressed && styles.dropdownActionRowPressed,
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={
                Platform.OS === 'web'
                  ? 'Upload image from your computer or device'
                  : 'Choose photo from gallery'
              }>
              <Ionicons name="images-outline" size={20} color="#4B5563" />
              <View style={styles.dropdownActionLabels}>
                <Text style={styles.dropdownActionTitle}>
                  {Platform.OS === 'web' ? 'Upload image' : 'Photo gallery'}
                </Text>
                <Text style={styles.dropdownActionSub}>
                  {Platform.OS === 'web'
                    ? 'Browse files on this PC or device'
                    : 'Choose from your photos'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>

            {profileImageUri ? (
              <>
                <View style={styles.dropdownDivider} />
                <Pressable
                  onPress={() => runAfterMenuCloses(() => void persistProfileUri(null))}
                  style={({ pressed }) => [
                    styles.dropdownActionRow,
                    styles.dropdownActionRowDanger,
                    pressed && styles.dropdownActionRowDangerPressed,
                  ]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Remove profile picture">
                  <Ionicons name="trash-outline" size={20} color="#B91C1C" />
                  <View style={styles.dropdownActionLabels}>
                    <Text style={[styles.dropdownActionTitle, styles.dropdownActionTitleDanger]}>
                      Remove photo
                    </Text>
                    <Text style={styles.dropdownActionSub}>Clear your profile picture</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={notificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsOpen(false)}>
        <View style={styles.noticeModalRoot}>
          <Pressable style={styles.noticeBackdrop} onPress={() => setNotificationsOpen(false)} />
          <View style={styles.noticeSheet}>
            <View style={styles.noticeTopRow}>
              <Text style={styles.noticeTitle}>Notifications</Text>
              <View style={styles.noticeActions}>
                <Pressable
                  style={({ pressed }) => [styles.noticeActionBtn, pressed && styles.noticeActionBtnPressed]}
                  onPress={onMarkAllNotificationsRead}>
                  <Ionicons name="checkmark" size={18} color={KUPPI_CYAN} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.noticeActionBtn, pressed && styles.noticeActionBtnPressed]}
                  onPress={() => Alert.alert('Settings', 'Dummy action: notification settings.')}>
                  <Ionicons name="settings" size={16} color={KUPPI_GOLD} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.noticeActionBtn, pressed && styles.noticeActionBtnPressed]}
                  onPress={() => setNotificationsOpen(false)}>
                  <Ionicons name="close" size={18} color={KUPPI_GOLD} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.noticeList}
              contentContainerStyle={styles.noticeListContent}
              showsVerticalScrollIndicator={true}>
              {loginRole !== 'peerTutor' ? (
                studentNotifs.length === 0 ? (
                  <Text style={styles.noticeEmpty}>No notifications yet. When your tutor posts a session poll, it will show here.</Text>
                ) : (
                  studentNotifs.map((item) => {
                    const isPoll = item.kind === 'session_poll';
                    const titleLine = isPoll
                      ? `${item.moduleTitle}: new session poll`
                      : String(item.title || 'Notification');
                    const subLine = isPoll
                      ? item.pollTitle
                        ? `Please react to the poll (“${item.pollTitle}”) in Session scheduling.`
                        : 'Please open Session scheduling and vote on the poll.'
                      : '';
                    return (
                      <View
                        key={item.id}
                        style={[styles.noticeRow, !item.read && styles.noticeRowUnread]}>
                        <View style={styles.noticeLeftIcon}>
                          <Ionicons name="calendar-outline" size={18} color={KUPPI_CYAN} />
                        </View>
                        <View style={styles.noticeMain}>
                          <Text style={styles.noticeRowTitle}>{titleLine}</Text>
                          {subLine ? <Text style={styles.noticeRowSub}>{subLine}</Text> : null}
                          <Text style={styles.noticeRowAgo}>{formatNotificationAgo(item.createdAt)}</Text>
                        </View>
                        {isPoll ? (
                          <Pressable
                            onPress={() => openSessionPollFromNotification(item)}
                            style={({ pressed }) => [styles.noticeLinkWrap, pressed && styles.noticeLinkWrapPressed]}>
                            <Text style={styles.noticeLink}>Open poll</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => Alert.alert('Notification', titleLine)}
                            style={({ pressed }) => [styles.noticeLinkWrap, pressed && styles.noticeLinkWrapPressed]}>
                            <Text style={styles.noticeLink}>View</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                )
              ) : (
                dummyNotifications.map((item) => (
                  <View key={item.id} style={styles.noticeRow}>
                    <View style={styles.noticeLeftIcon}>
                      <Ionicons name="calendar-outline" size={18} color={KUPPI_CYAN} />
                    </View>
                    <View style={styles.noticeMain}>
                      <Text style={styles.noticeRowTitle}>{item.title}</Text>
                      <Text style={styles.noticeRowAgo}>{item.ago}</Text>
                    </View>
                    <Pressable
                      onPress={() => Alert.alert('Notification', item.title)}
                      style={({ pressed }) => [styles.noticeLinkWrap, pressed && styles.noticeLinkWrapPressed]}>
                      <Text style={styles.noticeLink}>View full notification</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E4E9F2',
  },
  liquidBackdropPhoto: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 0,
    alignItems: 'stretch',
  },
  pageFrame: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'visible',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  headerGlassOrb: {
    position: 'absolute',
    top: -78,
    right: -34,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerGlassShine: {
    position: 'absolute',
    top: -38,
    left: 22,
    width: '62%',
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.24)',
    paddingBottom: 8,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  brandTitleFull: {
    color: '#0A0A5C',
    fontSize: 22,
    fontFamily: 'Roboto_900Black',
    letterSpacing: 0.35,
    lineHeight: 24,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  brandPipe: {
    color: '#8B93A7',
    fontSize: 22,
    fontFamily: 'Roboto_400Regular',
    marginTop: -1,
  },
  brandSuite: {
    color: '#2E3A67',
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(39, 54, 88, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  notifButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    minWidth: 17,
    height: 15,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Roboto_700Bold',
  },
  userMenuTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 290,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  userMenuTriggerPressed: {
    opacity: 0.75,
  },
  userMenuText: {
    flexShrink: 1,
    textAlign: 'left',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#243452',
    letterSpacing: 0.2,
  },
  avatarColumn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.56)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greetingBlock: {
    marginTop: 12,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  greetingTime: {
    color: '#38BDF8',
    fontSize: 24,
    fontFamily: 'Roboto_600SemiBold',
    letterSpacing: -0.4,
    textAlign: 'left',
    textShadowColor: 'rgba(14, 116, 184, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  greetingHi: {
    marginTop: 8,
    color: '#0C1E3D',
    fontSize: 32,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: -0.6,
    textAlign: 'left',
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  featureSection: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  contentBody: {
    marginTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.35)',
    backgroundColor: '#0A0A5C',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  contentBodyInner: {
    paddingTop: 18,
    paddingBottom: 18,
    position: 'relative',
    zIndex: 1,
  },
  pageTitleWrap: {
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: 'Roboto_900Black',
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  pollAlertBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.45)',
  },
  pollAlertBannerPressed: { opacity: 0.92 },
  pollAlertBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  pollAlertBannerTextWrap: { flex: 1, minWidth: 0 },
  pollAlertBannerTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#0A0A5C',
    lineHeight: 20,
  },
  pollAlertBannerSub: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#1E3A5F',
    lineHeight: 18,
  },
  /** Single column for feature + meeting-link cards — uniform vertical gap */
  cardStack: {
    width: '100%',
    gap: 10,
  },
  quoteCard: {
    marginTop: 10,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 0.55)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quoteIcon: {
    marginTop: 2,
    opacity: 0.85,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Roboto_500Medium',
    color: 'rgba(241, 245, 249, 0.92)',
    fontStyle: 'italic',
  },
  menuModalRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
    marginHorizontal: 2,
  },
  dropdownPanel: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 2,
  },
  dropdownActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  dropdownActionRowDanger: {
    backgroundColor: '#FEF2F2',
  },
  dropdownActionRowDangerPressed: {
    backgroundColor: '#FEE2E2',
  },
  dropdownActionRowPressed: {
    opacity: 0.85,
    backgroundColor: '#E5E7EB',
  },
  dropdownActionLabels: {
    flex: 1,
    minWidth: 0,
  },
  dropdownActionTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#1F2937',
  },
  dropdownActionTitleDanger: {
    color: '#B91C1C',
  },
  dropdownActionSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
  },
  noticeModalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  noticeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.34)',
  },
  noticeSheet: {
    marginTop: Platform.OS === 'ios' ? 54 : 24,
    marginHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ECECEC',
    borderWidth: 1,
    borderColor: '#CFCFCF',
    maxHeight: '82%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  noticeTopRow: {
    minHeight: 48,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D5D5D5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F3F3',
  },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#555555',
  },
  noticeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  noticeActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeActionBtnPressed: {
    backgroundColor: 'rgba(234,179,8,0.14)',
  },
  noticeList: {
    flexGrow: 0,
  },
  noticeListContent: {
    paddingBottom: 10,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
    backgroundColor: '#ECECEC',
  },
  noticeLeftIcon: {
    width: 26,
    alignItems: 'center',
    paddingTop: 2,
  },
  noticeMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  noticeRowTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Roboto_700Bold',
    color: '#575757',
  },
  noticeRowSub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#4B5563',
  },
  noticeRowUnread: {
    backgroundColor: 'rgba(125,211,252,0.22)',
  },
  noticeEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#666666',
    lineHeight: 19,
    textAlign: 'center',
  },
  noticeRowAgo: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#666666',
  },
  noticeLinkWrap: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  noticeLinkWrapPressed: {
    opacity: 0.72,
  },
  noticeLink: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#B45309',
  },
});
