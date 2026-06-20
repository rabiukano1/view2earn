import { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';


import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';

const GREEN = '#2ECC71';
const GREEN_DARK = '#27ae60';

export default function SignIn() {
  const { signIn, signInWithGoogle, signInWithBiometrics, biometricsAvailable, hasBiometricHardware } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);



  const handleSignIn = async () => {
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBiometric = useCallback(async () => {
    try {
      if (!biometricsAvailable) {
        Alert.alert('Not Set Up', 'Enable biometric login from your Profile settings first.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your account',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await signInWithBiometrics();
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      if (e?.message !== 'Options canceled by user') {
        setError('Biometric sign-in failed. Sign in manually.');
      }
    }
  }, [signInWithBiometrics, biometricsAvailable]);

  const showBioButton = hasBiometricHardware;

  return (
    <LinearGradient colors={['#000000', '#0a0a0f', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={styles.header}>
          <LinearGradient colors={[GREEN, GREEN_DARK]} style={styles.logoBg}>
            <Ionicons name="thunderstorm" size={32} color="#000" />
          </LinearGradient>
          <ThemedText style={styles.title}>Welcome Back</ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to continue earning</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={styles.form}>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#8B949E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8B949E"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B949E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8B949E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#8B949E"
              />
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotPassword}>
            <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
          </Pressable>

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <LinearGradient
            colors={submitting ? ['#555', '#444'] : [GREEN, GREEN_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Pressable onPress={handleSignIn} disabled={submitting} style={styles.buttonInner}>
              <ThemedText style={styles.buttonText}>{submitting ? 'Signing in...' : 'Sign In'}</ThemedText>
            </Pressable>
          </LinearGradient>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={async () => { setGoogleLoading(true); await signInWithGoogle(); setGoogleLoading(false); }}
            disabled={googleLoading}
            style={styles.googleButton}
          >
            <Ionicons name="logo-google" size={22} color="#fff" />
            <ThemedText style={styles.googleText}>
              {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
            </ThemedText>
          </Pressable>

          {showBioButton && (
            <Pressable onPress={handleBiometric} style={styles.bioButton}>
              <Ionicons name="finger-print" size={24} color={GREEN} />
              <ThemedText style={styles.bioText}>Unlock with biometrics</ThemedText>
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800).springify()} style={styles.footer}>
          <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#fff',
  },
  googleText: { color: '#fff', fontSize: 16, fontWeight: 600 },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotText: {
    color: '#8B949E',
    fontSize: 14,
  },
  button: {
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 700,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#8B949E',
    fontSize: 14,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN,
  },
  bioText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: 600,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 15,
  },
  footerLink: {
    color: GREEN,
    fontSize: 15,
    fontWeight: 600,
  },
});