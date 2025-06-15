import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMe } from '../../api/user';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../redux/authSlice';
import { getMyPosts } from '../../api/post';
import PostsGrid from './PostsGrid';
// import LinearGradient from 'react-native-linear-gradient'; // Uncomment if you have this package
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ProfileImagePickerModal from './ProfileImagePickerModal';
import { uploadProfileImage } from '../../api/user';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchData = useCallback(async () => {
    let isActive = true;
    try {
      setLoading(true);
      const data = await getMe();
      if (isActive) setUser(data);
      const myPosts = await getMyPosts(1, 10);
      if (isActive) setPosts(myPosts);
    } catch (e: any) {
      setError('Failed to load profile');
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        dispatch(logout());
      }
    } finally {
      if (isActive) setLoading(false);
    }
  
    return () => {
      isActive = false;
    };
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleImagePicked = async (image: { uri: string; mime: string; name: string }) => {
    try {
      await uploadProfileImage(image);
      fetchData();
      Alert.alert('Profile image updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to upload profile image.');
    }
  };

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
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile', { user })}
            >
              <Icon name="pencil" size={20} color="#00f2ff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
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
          </View>
          <View style={styles.avatarContainer}>
            {user?.profileImage && (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setShowImageModal(true)}>
              <Icon name="camera" size={22} color="#fff" />
            </TouchableOpacity>
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
                {getRank('city') && getRank('city')?.rank ? `${getRank('city')?.count} x ${getMedal(getRank('city')?.rank)}` : ''}
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Icon name="flag" size={36} color="#00f2ff" />
              <Text style={styles.trophyLabel}>COUNTRY</Text>
              <Text style={styles.trophyRank}>
                {getRank('country') && getRank('country')?.rank ? `${getRank('country')?.count} x ${getMedal(getRank('country')?.rank)}` : ''}
              </Text>
            </View>
            <View style={styles.trophyBox}>
              <Icon name="earth" size={36} color="#00f2ff" />
              <Text style={styles.trophyLabel}>GLOBAL</Text>
              <Text style={styles.trophyRank}>
                {getRank('global') && getRank('global')?.rank ? `${getRank('global')?.count} x ${getMedal(getRank('global')?.rank)}` : ''}
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

      <ProfileImagePickerModal
        visible={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImagePicked={handleImagePicked}
      />
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
  },
  headerGradient: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 18,
    backgroundColor: '#181828',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#00f2ff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
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
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#00f2ff',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 110 / 2 - 22,
    backgroundColor: '#00f2ff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#101018',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#181828',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#00f2ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    width: 180,
  },
});
