
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PasswordInput from '@/components/PasswordInput';
import { COLORS } from '@/constants/colors';
import { signIn } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/validation';

const PROFILE_TIMEOUT_MS = 10000;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const loginLock = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError(null);
    setStatus(null);
  };

  // LOGIN
  const handleLogin = async () => {
    if (loginLock.current) return;

    clearMessages();
    Keyboard.dismiss();

    const cleanEmail = email.trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    loginLock.current = true;
    setLoading(true);
    setStatus('Signing in...');

    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const { data, error: authError } = await signIn(
        cleanEmail,
        password
      );

      if (authError) {
        setError(
          authError.message || 'Unable to sign in. Please try again.'
        );
        return;
      }

      const userId = data?.session?.user?.id ?? data?.user?.id;

      if (!userId) {
        setError('No user session found. Please sign in again.');
        return;
      }

      setStatus('Loading your profile...');

      const profile = await Promise.race([
        getProfile(userId),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(
              new Error(
                'Profile loading timed out. Please check your connection and try again.'
              )
            );
          }, PROFILE_TIMEOUT_MS);
        }),
      ]);

      if (!profile) {
        setError(
          'Your profile could not be found. Please contact the administrator.'
        );
        return;
      }

      if (!profile.role) {
        setError('Your account has no assigned role. Please contact the administrator.');
        return;
      }

      setStatus('Login successful! Opening your dashboard...');

      router.replace(
        profile.role === 'admin' ? '/admin' : '/(tabs)'
      );
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('[LOGIN ERROR]', err);
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      if (timer) clearTimeout(timer);

      loginLock.current = false;
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async () => {
    if (loading) return;

    const cleanEmail = email.trim();

    clearMessages();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError(
        'Please enter a valid email address first.'
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setStatus('Sending password reset email...');

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (resetError) {
        setError(resetError.message);
        setStatus(null);
        return;
      }

      setStatus(null);

      Alert.alert(
        'Check your email',
        `If an account exists for ${cleanEmail}, a password reset link has been sent.`
      );
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('[PASSWORD RESET ERROR]', err);
      }

      setStatus(null);
      setError('Unable to send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top }
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 20 }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            {/* WELCOME */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>
                Welcome Back!
              </Text>

              <Text style={styles.subtitle}>
                Sign in to record your attendance
                and access your dashboard.
              </Text>
            </View>

            {/* LOGIN FORM */}
            <View style={styles.form}>
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearMessages();
                }}
                placeholder="your.email@school.edu"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                editable={!loading}
                accessibilityLabel="Email address"
              />

              <Text style={styles.label}>Password</Text>

              <PasswordInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearMessages();
                }}
                placeholder="Enter your password"
                textContentType="password"
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              {/* FORGOT PASSWORD */}
              <Pressable
                onPress={handleForgotPassword}
                disabled={loading}
                style={styles.forgot}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.forgotText,
                    loading && styles.disabledText
                  ]}
                >
                  Forgot Password?
                </Text>
              </Pressable>

              {/* STATUS MESSAGE */}
              {status && (
                <View style={styles.statusContainer}>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                  />
                  <Text style={styles.status}>
                    {status}
                  </Text>
                </View>
              )}

              {/* ERROR MESSAGE */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>!</Text>
                  <Text style={styles.error}>
                    {error}
                  </Text>
                </View>
              )}

              {/* SIGN IN BUTTON */}
              <View style={styles.buttonContainer}>
                {loading ? (
                  <View style={styles.loadingButton}>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                    <Text style={styles.loadingText}>
                      Please wait...
                    </Text>
                  </View>
                ) : (
                  <AppButton
                    theme="primary"
                    title="Sign In"
                    icon="log-in-outline"
                    onPress={handleLogin}
                  />
                )}
              </View>
            </View>

            {/* REGISTER LINK */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account?{' '}
              </Text>

              <Link
                href="/register"
                style={styles.registerLink}
              >
                Sign Up
              </Link>
            </View>

            {/* FOOTER */}
            <Text style={styles.footer}>
              QR-ATT • QR Attendance System
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 35,
  },

  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  form: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 18,
  },

  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    marginTop: -8,
    marginBottom: 12,
  },

  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  disabledText: {
    opacity: 0.5,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 14,
  },

  status: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    flexShrink: 1,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },

  errorIcon: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '800',
    width: 22,
    height: 22,
    textAlign: 'center',
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#F8D4D4',
  },

  error: {
    flex: 1,
    fontSize: 13,
    color: '#B71C1C',
    lineHeight: 19,
  },

  buttonContainer: {
    marginTop: 5,
  },

  loadingButton: {
    backgroundColor: COLORS.primary,
    minHeight: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 25,
  },

  registerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },

  footer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
});
