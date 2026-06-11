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

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
            <Ionicons name="key-outline" size={32} color="#000" />
          </LinearGradient>
          <ThemedText style={styles.title}>
            {success ? 'Password Updated' : 'Set New Password'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {success ? 'Your password has been changed successfully' : 'Enter your new password'}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={styles.form}>
          {!success ? (
            <>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color="#8B949E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#8B949E"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8B949E" />
                </Pressable>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color="#8B949E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#8B949E"
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); setError(''); }}
                  secureTextEntry={!showPassword}
                />
              </View>

              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

              <LinearGradient
                colors={submitting ? ['#555', '#444'] : [GREEN, GREEN_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Pressable onPress={handleUpdate} disabled={submitting} style={styles.buttonInner}>
                  <ThemedText style={styles.buttonText}>
                    {submitting ? 'Updating...' : 'Update Password'}
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
  eyeIcon: { padding: 4 },
  button: { borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  buttonInner: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 700 },
});
