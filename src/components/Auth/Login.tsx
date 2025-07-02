import React, { useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/authSlice';
import { login as loginApi } from '../../api/auth';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    console.log('Login button pressed');
    try {
      setError('');
      setLoading(true);
      const response = await loginApi(email, password);
      console.log('Login response:', response);
      dispatch(login(response));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Username or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://yasinsaban.com/star/star-logo-transparent-black.png' }} style={styles.brandLogo} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        mode="outlined"
        label="Username"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        outlineColor="#2c2c2c"
        activeOutlineColor="#00f2ff"
        textColor="#ffffff"
        disabled={loading}
      />

      <TextInput
        mode="outlined"
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        outlineColor="#2c2c2c"
        activeOutlineColor="#00f2ff"
        textColor="#ffffff"
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        buttonColor="#00f2ff"
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading}
      >
        Log In
      </Button>

      <View style={styles.dividerContainer}>
        <Divider style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <Divider style={styles.dividerLine} />
      </View>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        labelStyle={styles.registerLabel}
        disabled={loading}
      >
        Create a new account
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 28,
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 48,
    color: '#00f2ff',
    letterSpacing: 1,
    ...Platform.select({
      ios: {
        textShadowColor: '#00f2ff',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: '#00f2ff',
        elevation: 6,
      },
    }),
  },
  brandLogo: {
    width: 180,
    height: 120,
    alignSelf: 'center',
    marginBottom: 25,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#161616',
  },
  button: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 8,
  },
  buttonContent: {
    height: 44,
  },
  buttonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 36,
  },
  dividerLine: {
    flex: 1,
    backgroundColor: '#333',
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  registerLabel: {
    color: '#00f2ff',
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});