import { useState } from 'react';
import { StyleSheet, View, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

const GREEN = '#2ECC71';
const GREEN_DARK = '#27ae60';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0a0a0f', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={styles.header}>
          <LinearGradient colors={[GREEN, GREEN_DARK]} style={styles.logoBg}>
            <Ionicons name="lock-open-outline" size={32} color="#000" />
          </LinearGradient>
          <ThemedText style={styles.title}>Reset Password</ThemedText>
          <ThemedText style={styles.subtitle}>
            {sent ? 'Check your email for the reset link' : 'Enter your email and we\'ll send you a reset link'}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={styles.form}>
          {!sent ? (
            <>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color="#8B949E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8B949E"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

              <LinearGradient
                colors={submitting ? ['#555', '#444'] : [GREEN, GREEN_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Pressable onPress={handleReset} disabled={submitting} style={styles.buttonInner}>
                  <ThemedText style={styles.buttonText}>
                    {submitting ? 'Sending...' : 'Send Reset Link'}
                  </ThemedText>
                </Pressable>
              </LinearGradient>
            </>
          ) : (
            <LinearGradient
              colors={[GREEN, GREEN_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.buttonInner}>
                <ThemedText style={styles.buttonText}>Back to Sign In</ThemedText>
              </Pressable>
            </LinearGradient>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800).springify()} style={styles.footer}>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.footerLink}>Back</ThemedText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoBg: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 700, color: '#fff' },
  subtitle: { fontSize: 16, color: '#8B949E', marginTop: 8, textAlign: 'center' },
  form: { gap: 16 },
  errorText: { color: '#ff4444', fontSize: 14, textAlign: 'center' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  button: { borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  buttonInner: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 700 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerLink: { color: GREEN, fontSize: 15, fontWeight: 600 },
});
