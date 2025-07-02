import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateProfile, deleteAccount } from '../../api/user';
import { COUNTRIES, CITIES } from '../../constants/geo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';

export default function EditProfile() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = route.params;
  const initialCountry = COUNTRIES.some(c => c.value === user.country) ? user.country : COUNTRIES[0].value;
  const [country, setCountry] = useState<string>(initialCountry);
  const [city, setCity] = useState<string>(user.city && CITIES[initialCountry]?.includes(user.city) ? user.city : CITIES[initialCountry][0]);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openCountry, setOpenCountry] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [countryItems, setCountryItems] = useState(COUNTRIES);
  const [cityItems, setCityItems] = useState(CITIES[initialCountry].map(c => ({ label: c, value: c })));

  const dispatch = useDispatch();

  useEffect(() => {
    setCityItems(CITIES[country].map(c => ({ label: c, value: c })));
    setCity(CITIES[country][0]);
  }, [country]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile({ firstName, lastName, country, city });
      Alert.alert('Profile updated!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
              await AsyncStorage.removeItem('auth_token');
              dispatch(logout());
              Alert.alert('Account deleted', 'Your account has been removed.');
              // Navigate to auth or landing screen after deletion
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to delete account.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#888"
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#888"
          value={lastName}
          onChangeText={setLastName}
        />
        <Text style={styles.label}>Country</Text>
        <View style={{ zIndex: 2000 }}>
          <DropDownPicker
            open={openCountry}
            value={country}
            items={countryItems}
            setOpen={setOpenCountry}
            setValue={setCountry}
            setItems={setCountryItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: '#fff' }}
            arrowIconStyle={{ tintColor: '#fff' }}
            ArrowDownIconStyle={{ tintColor: '#fff' }}
            tickIconStyle={{ tintColor: '#fff' }}
          />
        </View>
        <Text style={styles.label}>City</Text>
        <View style={{ zIndex: 1000 }}>
          <DropDownPicker
            open={openCity}
            value={city}
            items={cityItems}
            setOpen={setOpenCity}
            setValue={setCity}
            setItems={setCityItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: '#fff' }}
            arrowIconStyle={{ tintColor: '#fff' }}
            tickIconStyle={{ tintColor: '#fff' }}
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101018',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    backgroundColor: '#181828',
    borderRadius: 22,
    padding: 28,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  label: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 6,
    marginTop: 12,
    marginLeft: 2,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#23233a',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    fontSize: 17,
    borderWidth: 1.5,
    borderColor: '#23233a',
    marginTop: 2,
  },
  dropdown: {
    backgroundColor: '#23233a',
    borderColor: '#444',
    borderRadius: 12,
    marginBottom: 16,
  },
  dropdownContainer: {
    backgroundColor: '#23233a',
    borderColor: '#555',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // zIndex removed to prevent conflict with wrapping View
  },
  tickIconContainer: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#00f2ff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#101018',
    fontWeight: 'bold',
    fontSize: 19,
    letterSpacing: 1.1,
  },

  deleteButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
    letterSpacing: 1.1,
  },
});
