import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { searchUsers } from '../../api/user';
import UserProfileScreen from '../Profile/UserProfileScreen';
import { useFocusEffect } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'search_history_profiles';
const HISTORY_LIMIT = 15;

function UserRow({ user, onPress }: any) {
  return (
    <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: user.profileImage }} style={styles.avatar} />
      <Text style={styles.username}>{user.username}</Text>
      <Icon name="chevron-right" size={22} color="#aaa" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<any>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Load history from AsyncStorage
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        try {
          setHistory(JSON.parse(raw));
        } catch {
          setHistory([]);
        }
      }
    })();
  }, []);

  // Save history to AsyncStorage
  const saveHistory = async (newHistory: any[]) => {
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedUsername(null);
    }, [])
  );

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setError('');
    setShowHistory(!text);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (!text) {
      setResults([]);
      return;
    }
    setDebounceTimeout(setTimeout(async () => {
      try {
        setLoading(true);
        const users = await searchUsers(text);
        setResults(users);
      } catch {
        setError('Failed to search');
      } finally {
        setLoading(false);
      }
    }, 400));
  }, [debounceTimeout]);

  const handlePanGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.translationX > 60 && nativeEvent.state === State.END) {
      setSelectedUsername(null);
    }
  };

  const handleUserPress = async (user: any) => {
    setSelectedUsername(user.username);
    // Add to history (move to top, no duplicates)
    const filtered = history.filter((u) => u.id !== user.id);
    const newHistory = [user, ...filtered].slice(0, HISTORY_LIMIT);
    await saveHistory(newHistory);
  };

  const handleClearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  const handleClearQuery = () => {
    setQuery('');
    setShowHistory(true);
    setResults([]);
  };

  if (selectedUsername) {
    return (
      <PanGestureHandler onGestureEvent={handlePanGesture} onHandlerStateChange={handlePanGesture}>
        <View style={{ flex: 1, backgroundColor: '#101018'}}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedUsername(null)}>
            <Icon name="arrow-left" size={26} color="#00f2ff" />
            <Text style={styles.backText}>Back to Search</Text>
          </TouchableOpacity>
          <UserProfileScreen username={selectedUsername} />
        </View>
      </PanGestureHandler>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.searchBarWrap}>
        <Icon name="magnify" size={22} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="search"
          placeholderTextColor="#888"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity onPress={handleClearQuery} style={styles.clearIconWrap}>
            <Icon name="close-circle" size={22} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>
      {showHistory && history.length > 0 && (
        <View style={styles.historyWrap}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearHistory}>Clear history</Text>
            </TouchableOpacity>
          </View>
          {history.map((user) => (
            <UserRow key={user.id} user={user} onPress={() => handleUserPress(user)} />
          ))}
        </View>
      )}
      {loading && <ActivityIndicator color="#00f2ff" style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!showHistory && (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onPress={() => handleUserPress(item)}
            />
          )}
          style={styles.resultsList}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={!loading && query ? <Text style={styles.empty}>No users found</Text> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101018',
    paddingTop: 18,
    paddingHorizontal: 0,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 16,
    margin: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#23233a',
    position: 'relative',
    marginTop: 40,
  },
  searchBar: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  clearIconWrap: {
    position: 'absolute',
    right: 18,
    top: '50%',
    marginTop: -3,
    zIndex: 10,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#222',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 15,
  },
  empty: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#181828',
    borderBottomWidth: 1,
    borderBottomColor: '#23233a',
    paddingTop: 52,
  },
  backText: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  historyWrap: {
    marginHorizontal: 0,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 15,
    marginTop: 2,
  },
  historyTitle: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearHistory: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 12,
  },
});
