import React, { useEffect, useState } from 'react';
import { AppRegistry, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { store } from './src/store';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Set a timeout to show error if auth takes too long
  useEffect(() => {
    if (!loading) return; // Don't set timeout if already loaded

    const timer = setTimeout(() => {
      console.error('Auth state change timeout - still loading after 10 seconds');
      setTimedOut(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading]);

  console.log('AppContent render:', { user: user ? user.uid : 'null', loading, timedOut });

  if (loading && !timedOut) {
    console.log('Still loading, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (timedOut) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          Connection timeout. Please check your internet and restart the app.
        </Text>
      </View>
    );
  }

  console.log('Loading complete, user is:', user ? 'logged in' : 'logged out');

  if (!user) {
    console.log('Rendering AuthNavigator');
    return <AuthNavigator />;
  }

  console.log('Rendering MainNavigator');
  return <MainNavigator />;
};

AppRegistry.registerComponent('SocialConnect', () => App);

export default App;
