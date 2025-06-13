import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMe } from '../../api/user';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../redux/authSlice';
// import LinearGradient from 'react-native-linear-gradient'; // Uncomment if you have this package

const { width } = Dimensions.get('window');

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getMe();
        setUser(data);
      } catch (e: any) {
        setError('Failed to load profile');
        if (e?.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          dispatch(logout());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00f2ff" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!user) return null;

  // Helper for ranking
  const getRank = (level: string) => user.rankingStats?.find((r: any) => r.level === level);

  return (
    <ScrollView style={styles.container}>
      {/* Header with gradient or card */}
      <View style={styles.headerWrap}>
        {/* <LinearGradient colors={["#0a0a0a", "#1a1a2e"]} style={styles.headerGradient}> */}
        <View style={styles.headerGradient}>
          <View style={styles.logoutButtonWrap}>
            <Icon
              name="logout"
              size={26}
              color="#00f2ff"
              onPress={async () => {
                await AsyncStorage.removeItem('auth_token');
                dispatch(logout());
              }}
            />
          </View>
          <View style={styles.avatarWrap}>
            <Avatar.Image
              source={{ uri: user.profileImage }}
              size={110}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.bio}>{user.firstName} {user.lastName}</Text>
        </View>
        {/* </LinearGradient> */}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="account-group" size={22} color="#00f2ff" style={{ marginBottom: 2 }} />
          <Text style={styles.statNumber}>{user.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="star" size={22} color="#FFD700" style={{ marginBottom: 2 }} />
          <Text style={styles.statNumber}>{user.totalStars}</Text>
          <Text style={styles.statLabel}>Stars</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="account-plus" size={22} color="#00f2ff" style={{ marginBottom: 2 }} />
          <Text style={styles.statNumber}>{user.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Trophies Row */}
      <View style={styles.trophiesRow}>
        <View style={styles.trophyBox}>
          <Icon name="trophy" size={36} color="#b0b0b0" />
          <Text style={styles.trophyLabel}>CITY</Text>
          <Text style={styles.trophyRank}>{getRank('city')?.rank ?? '-'}<Text style={styles.trophyCount}>/{getRank('city')?.count ?? '-'}</Text></Text>
        </View>
        <View style={styles.trophyBox}>
          <Icon name="trophy" size={36} color="#FFD700" />
          <Text style={styles.trophyLabel}>COUNTRY</Text>
          <Text style={styles.trophyRank}>{getRank('country')?.rank ?? '-'}<Text style={styles.trophyCount}>/{getRank('country')?.count ?? '-'}</Text></Text>
        </View>
        <View style={styles.trophyBox}>
          <Icon name="trophy" size={36} color="#FFD700" />
          <Text style={styles.trophyLabel}>GLOBAL</Text>
          <Text style={styles.trophyRank}>{getRank('global')?.rank ?? '-'}<Text style={styles.trophyCount}>/{getRank('global')?.count ?? '-'}</Text></Text>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <View style={styles.tabIconWrap}><Icon name="account" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="music" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="trophy" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="image" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="dots-horizontal" size={28} color="#00f2ff" /></View>
      </View>

      {/* Posts Grid */}
      <View style={styles.grid}>
        {[1,2,3,4,5,6].map((i) => (
          <Image
            key={i}
            source={{ uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' }}
            style={styles.gridImage}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101018',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101018',
  },
  headerWrap: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    marginTop: 32,
  },
  headerGradient: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#181828',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  logoutButtonWrap: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarWrap: {
    borderWidth: 4,
    borderColor: '#00f2ff',
    borderRadius: 70,
    padding: 4,
    marginBottom: 8,
    backgroundColor: '#181828',
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  avatar: {
    backgroundColor: '#222',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    marginTop: 2,
    letterSpacing: 1,
  },
  bio: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  statCard: {
    backgroundColor: '#181828',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    minWidth: 80,
  },
  statNumber: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  trophiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  trophyBox: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  trophyLabel: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
  },
  trophyRank: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trophyCount: {
    color: '#aaa',
    fontWeight: 'normal',
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    marginBottom: 18,
  },
  tabIconWrap: {
    backgroundColor: '#181828',
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 7,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
  gridImage: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 18,
    margin: 8,
    backgroundColor: '#222',
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
});