import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCategories } from '../../api/category';
import api from '../../api/client';
import { COUNTRIES, CITIES } from '../../constants/geo';
import UserProfileScreen from '../Profile/UserProfileScreen';
import { PanGestureHandler } from 'react-native-gesture-handler';
import PostDetail from '../Profile/PostDetail';

const { width } = Dimensions.get('window');

const LEVELS = [
  { label: 'Global', value: 'global' },
  { label: 'Country', value: 'country' },
  { label: 'City', value: 'city' },
];

const TABS = [
  { label: 'General', value: 'general' },
  { label: 'Me', value: 'me' },
];

function getPlaceText(rank: number) {
  if (rank === 1) return '1st place';
  if (rank === 2) return '2nd place';
  if (rank === 3) return '3rd place';
  return `${rank}th place`;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'general' | 'me'>('general');
  const [level, setLevel] = useState<'global' | 'country' | 'city'>('global');
  const [country, setCountry] = useState<string>(COUNTRIES[0].value);
  const [city, setCity] = useState<string>(CITIES[COUNTRIES[0].value][0]);
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [openLevel, setOpenLevel] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<{ id: string; username: string; profileImage?: string } | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        setCategories([{ label: 'All Categories', value: null }, ...cats.map((c: any) => ({ label: `${c.icon} ${c.name}`, value: c.id }))]);
      } catch {
        setCategories([{ label: 'All Categories', value: null }]);
      }
    })();
  }, []);

  // Update city when country changes
  useEffect(() => {
    setCity(CITIES[country][0]);
  }, [country]);

  // Fetch leaderboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = tab === 'general' ? '/leaderboard/general' : '/leaderboard/me';
      let params: any = { level };
      if (level === 'country') params.country = country;
      if (level === 'city') {
        params.country = country;
        params.city = city;
      }
      if (category) params.categoryId = category;
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (e: any) {
      setError('Failed to load leaderboard');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, level, country, city, category]);

  useEffect(() => {
    fetchData();
  }, [tab, level, country, city, category, fetchData]);

  // Dropdown items
  const levelItems = LEVELS;
  const countryItems = COUNTRIES;
  const cityItems = CITIES[country].map(c => ({ label: c, value: c }));
  const categoryItems = categories;

  if (selectedPostUser) {
    return (
      <PanGestureHandler onGestureEvent={() => setSelectedPostUser(null)}>
        <View style={{ flex: 1, backgroundColor: '#101018' }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => setSelectedPostUser(null)}>
            <Icon name="arrow-left" size={26} color="#00f2ff" />
            <Text style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Back to Leaderboard</Text>
          </TouchableOpacity>
          <UserProfileScreen username={selectedPostUser.username} />
        </View>
      </PanGestureHandler>
    );
  }

  if (selectedPost) {
    console.log('Selected Post User:', selectedPost.user);
    return (
      <PanGestureHandler onGestureEvent={() => setSelectedPost(null)}>
        <View style={{ flex: 1, backgroundColor: '#101018' }}>
          <PostDetail
            route={{ params: { postId: selectedPost.id, user: selectedPost.user, rank: selectedPost.rank, level: selectedPost.level } }}
            navigation={{
              goBack: () => setSelectedPost(null),
              navigate: (_: string, params: any) => setSelectedPostUser(params?.user || selectedPost.user),
            }}
          />
        </View>
      </PanGestureHandler>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tabBtn, tab === t.value && styles.tabBtnActive]}
            onPress={() => setTab(t.value as 'general' | 'me')}
          >
            <Text style={[styles.tabLabel, tab === t.value && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={{ flex: 1, zIndex: 2000 }}>
          <DropDownPicker
            open={openLevel}
            value={level}
            items={levelItems}
            setOpen={(val) => {
              setOpenLevel(val);
              if (val) {
                setOpenCategory(false);
                setOpenCountry(false);
                setOpenCity(false);
              }
            }}
            setValue={setLevel}
            setItems={() => {}}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: '#fff', fontSize: 15 }}
            arrowIconStyle={{ tintColor: '#fff' }}
            tickIconStyle={{ tintColor: '#fff' }}
            listMode="SCROLLVIEW"
            disabled={loading}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8, zIndex: openCountry ? 2900 : 1000 }}>
          <DropDownPicker
            open={openCategory}
            value={category}
            items={categoryItems}
            setOpen={(val) => {
              setOpenCategory(val);
              if (val) {
                setOpenLevel(false);
                setOpenCountry(false);
                setOpenCity(false);
              }
            }}
            setValue={setCategory}
            setItems={setCategories}
            placeholder="All Categories"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: '#fff', fontSize: 15 }}
            arrowIconStyle={{ tintColor: '#fff' }}
            tickIconStyle={{ tintColor: '#fff' }}
            listMode="SCROLLVIEW"
            disabled={loading}
          />
        </View>
      </View>
      {(level === 'country' || level === 'city') && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 12}}>
          {level === 'country' && (
            <View style={{ flex: 1, zIndex: openCountry ? 2900 : 1000 }}>
              <DropDownPicker
                open={openCountry}
                value={country}
                items={countryItems}
                setOpen={(val) => {
                  setOpenCountry(val);
                  if (val) {
                    setOpenLevel(false);
                    setOpenCategory(false);
                    setOpenCity(false);
                  }
                }}
                setValue={setCountry}
                setItems={() => {}}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: '#fff', fontSize: 15 }}
                arrowIconStyle={{ tintColor: '#fff' }}
                tickIconStyle={{ tintColor: '#fff' }}
                listMode="SCROLLVIEW"
                disabled={loading}
              />
            </View>
          )}
          {level === 'city' && (
            <>
              <View style={{ flex: 1, zIndex: openCountry ? 2900 : 1000 }}>
                <DropDownPicker
                  open={openCountry}
                  value={country}
                  items={countryItems}
                  setOpen={(val) => {
                    setOpenCountry(val);
                    if (val) {
                      setOpenLevel(false);
                      setOpenCategory(false);
                      setOpenCity(false);
                    }
                  }}
                  setValue={setCountry}
                  setItems={() => {}}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: '#fff', fontSize: 15 }}
                  arrowIconStyle={{ tintColor: '#fff' }}
                  tickIconStyle={{ tintColor: '#fff' }}
                  listMode="SCROLLVIEW"
                  disabled={loading}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8, zIndex: openCity ? 2800 : 999 }}>
                <DropDownPicker
                  open={openCity}
                  value={city}
                  items={cityItems}
                  setOpen={(val) => {
                    setOpenCity(val);
                    if (val) {
                      setOpenLevel(false);
                      setOpenCategory(false);
                      setOpenCountry(false);
                    }
                  }}
                  setValue={setCity}
                  setItems={() => {}}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: '#fff', fontSize: 15 }}
                  arrowIconStyle={{ tintColor: '#fff' }}
                  tickIconStyle={{ tintColor: '#fff' }}
                  listMode="SCROLLVIEW"
                  disabled={loading}
                />
              </View>
            </>
          )}
        </View>
      )}
      {/* Leaderboard List */}
      {loading ? (
        <ActivityIndicator color="#00f2ff" size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
          {data.length === 0 ? (
            <Text style={styles.emptyText}>No leaderboard data found.</Text>
          ) : (
            data.map((entry, idx) => (
              <TouchableOpacity key={entry.id} style={styles.row} onPress={() => setSelectedPost({ ...entry.post, user: entry.user, rank: entry.rank, level: entry.level })}>
                <Image source={{ uri: entry.user.profileImage }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.username}>{entry.user.username}</Text>
                  <Text style={styles.levelCat}>{entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}{entry.category ? ` • ${entry.category.name}` : ''}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text style={styles.trophy}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</Text>
                    <Text style={[styles.place, idx < 3 && styles.placeTop]}>{getPlaceText(entry.rank)}</Text>
                  </View>
                </View>
                <Text style={styles.rank}>{entry.rank}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101018',
    paddingTop: 60,
    paddingHorizontal: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: '#181828',
    marginHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: '#00f2ff',
  },
  tabLabel: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#101018',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
    zIndex: 3000,
  },
  dropdown: {
    backgroundColor: '#23233a',
    borderColor: '#444',
    borderRadius: 12,
    marginBottom: 0,
    fontSize: 12,
    minHeight: 44,
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
    fontSize: 25,
  },
  list: {
    flex: 1,
    paddingHorizontal: 0,
    marginTop: 30
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#00f2ff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  levelCat: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  trophy: {
    fontSize: 20,
    marginRight: 6,
  },
  place: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeTop: {
    color: '#FFD700',
  },
  rank: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    marginLeft: 18,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 17,
  },
});
