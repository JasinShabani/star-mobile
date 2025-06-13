import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMe } from '../../api/user';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../redux/authSlice';
import { getMyPosts } from '../../api/post';
import PostsGrid from './PostsGrid';
// import LinearGradient from 'react-native-linear-gradient'; // Uncomment if you have this package
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await getMe();
          if (isActive){
            setUser(data);
          }
          const myPosts = await getMyPosts(1, 10);
          if (isActive){
            setPosts(myPosts);
          }
        } catch (e: any) {
          setError('Failed to load profile');
          if (e?.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
            dispatch(logout());
          }
        } finally {
          if (isActive){
            setLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [dispatch])
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00f2ff" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!user) return null;

  // Helper for ranking
  const getRank = (level: string) => user.rankingStats?.find((r: any) => r.level === level);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

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
          <Text style={styles.username}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.bio}>@{user.username}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{user.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{user.totalStars}</Text>
                <Text style={styles.statEmoji}>🌟</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Trophies Row */}
          <View style={styles.trophiesRow}>
            <View style={styles.trophyBox}>
              <Icon name="city" size={36} color="#00f2ff" />
              <Text style={styles.trophyLabel}>CITY</Text>
              <Text style={styles.trophyRank}>
                {getRank('city')?.count ?? '-'} x{getMedal(getRank('city')?.rank)}
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Icon name="flag" size={36} color="#00f2ff" />
              <Text style={styles.trophyLabel}>COUNTRY</Text>
              <Text style={styles.trophyRank}>
               {getRank('country')?.count ?? '-'} x{getMedal(getRank('country')?.rank)}
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Icon name="earth" size={36} color="#00f2ff" />
              <Text style={styles.trophyLabel}>GLOBAL</Text>
              <Text style={styles.trophyRank}>
              {getRank('global')?.count ?? '-'} x{getMedal(getRank('global')?.rank)}
              </Text>
            </View>
          </View>
        </View>
        {/* </LinearGradient> */}
      </View>

      {/* Tabs Row */}
      {/* <View style={styles.tabsRow}>
        <View style={styles.tabIconWrap}><Icon name="account" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="music" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="trophy" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="image" size={28} color="#00f2ff" /></View>
        <View style={styles.tabIconWrap}><Icon name="dots-horizontal" size={28} color="#00f2ff" /></View>
      </View> */}

      {/* Posts Grid */}
      <PostsGrid posts={posts} user={user} />
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
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    marginTop: 2,
    letterSpacing: 1,
  },
  bio: {
    fontSize: 17,
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
    paddingVertical: 0,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    minWidth: 80,
    height: 70,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  statNumber: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 25,
    marginTop: 1,
    textAlign: 'center',
  },
  trophiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  trophyBox: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  trophyLabel: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 2,
  },
  trophyRank: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 2,
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
