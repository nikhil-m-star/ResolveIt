import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOAuth, useSignUp } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Logo from '@/components/Logo';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Start Email/Password sign up
  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName});

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.errors?.[0]?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify email verification code
  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code});

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.warn('Sign up incomplete:', completeSignUp.status);
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.errors?.[0]?.message || 'Incorrect verification code');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth flow
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      
      const redirectUrl = Linking.createURL('/sso-callback', { scheme: 'mobile' });
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl
      });
      
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('Google Sign Up Error:', err);
      setError(err?.errors?.[0]?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Header section (compeletely identical to web) */}
          <View style={styles.headerContainer as any}>
            <View style={styles.logoPill}>
              <Logo size={24} />
              <Text style={styles.logoPillText}>ResolveIt</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {pendingVerification ? 'Verification' : 'Create account'}
              </Text>
              <Text style={styles.subtitleText}>
                {pendingVerification 
                  ? 'Enter the code from your email.' 
                  : 'Create your account.'}
              </Text>
            </View>
          </View>

          {/* Form Card (styled exactly like Clerk on the web) */}
          <View style={styles.clerkCard}>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!pendingVerification ? (
              <>
                {/* Google OAuth Button - placed at the top, just like Clerk */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignUp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Or Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Form Inputs with Clerk styling */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification code"
                    placeholderTextColor="#64748b"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      setError('');
                    }}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setPendingVerification(false)}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer matches Web */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 36},
  container: {
    flex: 1},
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40},
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 32,
    gap: 16},
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    gap: 12},
  logoPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5},
  titleContainer: {
    alignItems: 'center',
    gap: 8},
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center'},
  subtitleText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16},
  clerkCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20},
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20},
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'},
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center'},
  googleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'},
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20},
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    paddingHorizontal: 16},
  formGroup: {
    marginBottom: 20,
    gap: 8},
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 0.5},
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    height: 50,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16},
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 18,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12},
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900'},
  backButton: {
    borderRadius: 18,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12},
  backButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700'},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6},
  footerText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500'},
  footerLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '700'}});
