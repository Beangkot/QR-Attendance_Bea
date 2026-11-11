
import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { SHADOW } from '@/constants/theme';
import { useAuth, signOut } from '@/lib/auth';
import {
  getProfile,
  Profile,
  updateProfile,
} from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Load profile whenever the screen becomes active
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        if (!user) {
          setProfile(null);
          setProfileLoading(false);
          return;
        }

        setProfileLoading(true);

        try {
          const data = await getProfile(user.id);

          if (!isActive) return;

          setProfile(data);
          setDraftName(data?.full_name ?? '');
        } catch (error) {
          if (isActive) {
            Alert.alert(
              'Error',
              error instanceof Error
                ? error.message
                : 'Unable to load your profile.'
            );
          }
        } finally {
          if (isActive) {
            setProfileLoading(false);
          }
        }
      };

      void loadProfile();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  // Generate user initials
  const fullName = profile?.full_name?.trim() || 'User';

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isTeacher = profile?.role === 'teacher';

  // Save updated name
  const handleSaveName = async () => {
    if (!user || saving) return;

    const newName = draftName.trim();

    if (!newName) {
      Alert.alert(
        'Invalid Name',
        'Please enter your full name.'
      );
      return;
    }

    if (newName.length > 80) {
      Alert.alert(
        'Invalid Name',
        'Your name must not exceed 80 characters.'
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile(user.id, {
        full_name: newName,
      });

      if (error) {
        Alert.alert('Update Failed', error);
        return;
      }

      setProfile((previous) =>
        previous
          ? { ...previous, full_name: newName }
          : previous
      );

      setDraftName(newName);
      setEditing(false);

      Alert.alert(
        'Success',
        'Your profile name has been updated successfully.'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setDraftName(profile?.full_name ?? '');
    setEditing(false);
  };

  // Sign out
  const handleSignOut = () => {
    if (signingOut) return;

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (signingOut) return;

            setSigningOut(true);

            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert(
                'Sign Out Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to sign out. Please try again.'
              );
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // Loading screen
  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          Manage your personal information and account settings.
        </Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials || 'U'}
          </Text>
        </View>

        <Text style={styles.name}>{fullName}</Text>

        <View
          style={[
            styles.roleBadge,
            isTeacher
              ? styles.teacherBadge
              : styles.studentBadge,
          ]}
        >
          <Text style={styles.roleBadgeText}>
            {isTeacher ? 'TEACHER' : 'STUDENT'}
          </Text>
        </View>

        <Text style={styles.profileCaption}>
          QR Attendance Account
        </Text>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account Information
        </Text>

        <View style={styles.infoCard}>
          {/* Full Name */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>FULL NAME</Text>

            {editing ? (
              <View style={styles.editContainer}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={80}
                  editable={!saving}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />

                <View style={styles.editButtons}>
                  <Pressable
                    onPress={handleCancelEdit}
                    style={styles.cancelButton}
                    disabled={saving}
                  >
                    <Text style={styles.cancelText}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveName}
                    style={[
                      styles.saveButton,
                      saving && styles.disabledButton,
                    ]}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text style={styles.saveText}>
                        Save Changes
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {fullName}
                </Text>

                <Pressable
                  onPress={() => setEditing(true)}
                  style={styles.editButton}
                  accessibilityRole="button"
                  accessibilityLabel="Edit full name"
                >
                  <Text style={styles.editText}>
                    Edit
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <Text style={styles.value}>
              {profile?.email || user?.email || 'Not available'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Account Type */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>ACCOUNT TYPE</Text>
            <Text style={styles.value}>
              {isTeacher ? 'Teacher Account' : 'Student Account'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* User ID */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>USER ID</Text>
            <Text
              style={styles.userId}
              selectable
            >
              {profile?.id || user?.id || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account Settings
        </Text>

        <View style={styles.actionCard}>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              Sign Out
            </Text>
            <Text style={styles.actionSubtitle}>
              Sign out from your QR Attendance account.
            </Text>
          </View>

          <AppButton
            title={signingOut ? 'Signing Out...' : 'Sign Out'}
            icon="log-out-outline"
            onPress={handleSignOut}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footer}>
          QR Attendance App
        </Text>
        <Text style={styles.footerSubtext}>
          Your account information is securely managed.
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 45,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 21,
  },

  profileCard: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 28,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.background,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },

  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },

  roleBadge: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },

  teacherBadge: {
    backgroundColor: '#DCEBFA',
  },

  studentBadge: {
    backgroundColor: '#E8E1CF',
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },

  profileCaption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 12,
  },

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  infoCard: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  infoItem: {
    paddingVertical: 17,
  },

  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.8,
  },

  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  userId: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },

  editText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  editContainer: {
    marginTop: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },

  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  disabledButton: {
    opacity: 0.6,
  },

  actionCard: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 18,
    gap: 16,
  },

  actionInfo: {
    gap: 5,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  footerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  footer: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  footerSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
});
