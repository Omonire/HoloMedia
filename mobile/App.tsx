import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { authSession, type User } from '@holomedia/shared';
import { bootstrapShared } from './src/bootstrap';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { colors } from './src/theme';

bootstrapShared();

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    void authSession.init().then(() => {
      setUser(authSession.user);
      setReady(true);
    });
    const unsub = authSession.subscribe(() => setUser(authSession.user));
    return unsub;
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {user ? (
        <FeedScreen />
      ) : authMode === 'login' ? (
        <LoginScreen onAuthed={(u) => setUser(u)} onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <RegisterScreen onAuthed={(u) => setUser(u)} onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
