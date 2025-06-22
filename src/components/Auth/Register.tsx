import React, { useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/authSlice';
import { register as registerApi } from '../../api/auth';
import { COUNTRIES, CITIES } from '../../constants/geo';
import DropDownPicker from 'react-native-dropdown-picker';

export default function Register({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const dispatch = useDispatch();

  const handleRegister = async () => {
    if (
      !username.trim() ||
      !password ||
      !confirmPassword ||
      !country ||
      !city
    ) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const payload = {
        username: username.trim(),
        password,
        country,
        city,
      };
      const response = await registerApi(payload);
      dispatch(login(response));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
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
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
        outlineColor="#2c2c2c"
        activeOutlineColor="#00f2ff"
        textColor="#ffffff"
        disabled={loading}
      />

      <DropDownPicker
        open={showCountryDropdown}
        value={country}
        items={COUNTRIES}
        setOpen={setShowCountryDropdown}
        setValue={setCountry}
        setItems={() => {}}
        placeholder="Select Country"
        style={styles.input}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={{ color: '#ffffff', fontSize: 16 }}
        disabled={loading}
        dropDownDirection="TOP"
        ArrowDownIconComponent={null}
        ArrowUpIconComponent={null}
        listItemLabelStyle={{ color: '#fff' }}
        placeholderStyle={{ color: '#888', fontSize: 16 }}
      />

      {country ? (
        <DropDownPicker
          open={showCityDropdown}
          value={city}
          items={(CITIES[country] || []).map((c) => ({ label: c, value: c }))}
          setOpen={setShowCityDropdown}
          setValue={setCity}
          setItems={() => {}}
          placeholder="Select City"
          style={styles.input}
          dropDownContainerStyle={styles.dropdownContainer}
          textStyle={{ color: '#ffffff', fontSize: 16 }}
          disabled={loading}
          dropDownDirection="TOP"
          ArrowDownIconComponent={null}
          ArrowUpIconComponent={null}
          listItemLabelStyle={{ color: '#fff' }}
          placeholderStyle={{ color: '#888', fontSize: 16 }}
        />
      ) : null}

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

      <TextInput
        mode="outlined"
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        outlineColor="#2c2c2c"
        activeOutlineColor="#00f2ff"
        textColor="#ffffff"
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
        buttonColor="#00f2ff"
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading}
      >
        Register
      </Button>

      <View style={styles.dividerContainer}>
        <Divider style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <Divider style={styles.dividerLine} />
      </View>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        labelStyle={styles.registerLabel}
        disabled={loading}
      >
        Already have an account? Log In
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
    fontSize: 38,
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
    marginBottom: 15,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#161616',
    borderRadius: 4,
    borderColor: '#2c2c2c',
    paddingHorizontal: 12,
    height: 56,
    justifyContent: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#161616',
    borderColor: '#2c2c2c',
    borderWidth: 1,
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