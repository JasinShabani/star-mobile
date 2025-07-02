import React, { useState } from 'react';
import { View, StyleSheet, Platform, Image, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [agreed, setAgreed] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
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

    if (!agreed) {
      setError('You must agree to the Terms and Conditions');
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

      <View style={styles.termsContainer}>
        <TouchableOpacity
          onPress={() => {
            const newValue = !agreed;
            setAgreed(newValue);
            if (error) setError('');
          }}
          disabled={loading}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Icon
            name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color="#00f2ff"
          />
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text
              onPress={() => setTermsVisible(true)}
              style={styles.linkText}
            >
              Terms and Conditions
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

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

      <Modal
        visible={termsVisible}
        animationType="slide"
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable onPress={() => setTermsVisible(false)} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <Text style={styles.modalDate}>Last updated: July 2, 2025</Text>
            <Text style={styles.modalText}>
              Welcome to Star! By tapping “I Agree” you accept these Terms & Conditions and our Privacy Policy. Please read them carefully.
            </Text>
            <Text style={styles.modalText}>
              1. About Star{"\n"}
              Star is a social platform where you post, share and discover content within your community.
            </Text>
            <Text style={styles.modalText}>
              2. Eligibility & Account{"\n"}
              • You must be at least 13 years old and able to enter into a binding agreement.{"\n"}
              • You are responsible for your username, password, and all activity under your account.
            </Text>
            <Text style={styles.modalText}>
              3. User-Generated Content{"\n"}
              • You retain ownership of what you post, but you grant Star a worldwide, royalty-free license to display, distribute, and modify it in connection with the service.{"\n"}
              • You agree no objectionable content (harassment, hate speech, pornography, illegal material) will be posted.
            </Text>
            <Text style={styles.modalText}>
              4. Moderation & Reporting{"\n"}
              • You can flag any post or comment by tapping the “Report” icon.{"\n"}
              • You can block other users—blocked users cannot view or interact with your content.{"\n"}
              • We review all reports within 24 hours and remove violating content; repeat offenders may be suspended or banned.
            </Text>
            <Text style={styles.modalText}>
              5. Account Deletion{"\n"}
              • You can delete your account at any time from Settings → Delete My Account.{"\n"}
              • Deletion permanently removes your profile, posts, images, and all personal data.
            </Text>
            <Text style={styles.modalText}>
              6. Community Rules{"\n"}
              • Be respectful—no hate, threats, or defamation.{"\n"}
              • No spam, self-promotion, or commercial advertising without permission.{"\n"}
              • No sharing of private information (yours or others’).
            </Text>
            <Text style={styles.modalText}>
              7. Intellectual Property{"\n"}
              • All Star branding, code, and design belong to Star, Inc.{"\n"}
              • Any feedback you provide is non-confidential and may be used by us without restriction.
            </Text>
            <Text style={styles.modalText}>
              8. Disclaimers & Liability{"\n"}
              • Star is provided “as is.” We disclaim all warranties, express or implied.{"\n"}
              • We are not responsible for content posted by users.{"\n"}
              • Our maximum liability is limited to the amount you’ve paid (if any) in the past 12 months.
            </Text>
            <Text style={styles.modalText}>
              9. Changes to These Terms{"\n"}
              • We may update these Terms. If the changes are material, we’ll notify you in-app. Continued use after notice means you accept the new Terms.
            </Text>
            <Text style={styles.modalText}>
              10. Governing Law & Contact{"\n"}
              • These Terms are governed by the laws of North Macedonia.{"\n"}
              • Questions? Email us at dev@yasinsaban.com.
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    color: '#fff',
    fontSize: 15,
  },
  linkText: {
    color: '#00f2ff',
    textDecorationLine: 'underline',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  modalCloseText: {
    color: '#00f2ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00f2ff',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
});