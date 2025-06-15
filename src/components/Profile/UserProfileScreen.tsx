import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserByUsername } from '../../api/user';
import { getPostsByUsername } from '../../api/post';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface UserProfileScreenProps {
  username?: string;
}

function PostsGrid({ posts }: any) {
  return (
    <View style={styles.grid}>
      {posts.map((post: any) => {
        const firstMedia = post.media?.find((m: any) => m.order === 0);
        if (!firstMedia) return null;
        return (
          <TouchableOpacity
            key={post.id}
            activeOpacity={0.8}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: firstMedia.url }}
              style={styles.gridImage}
            />
            {post.media.length > 1 && (
              <View style={styles.multiIcon}>
                <View style={styles.multiIconImage}>
                  <Icon name="image-multiple" size={18} color="#fff" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function UserProfileScreen({ username: propUsername }: UserProfileScreenProps) {
  const route = useRoute<any>();
  const username = propUsername || route.params?.username;
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUserAndPosts = useCallback(async (reset = false, nextPage = 1) => {
    try {
      if (reset) setLoading(true);
      setError('');
      const userData = await getUserByUsername(username);
      let postsData = await getPostsByUsername(username, nextPage, 20);
      if (reset) {
        setUser(userData);
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }
      setHasMore(postsData.length === 20);
    } catch (e) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [username]);

  useEffect(() => {
    setPage(1);
    fetchUserAndPosts(true, 1);
  }, [username, fetchUserAndPosts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUserAndPosts(false, nextPage);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00f2ff" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!user) return null;

  const getRank = (level: string) => user?.rankingStats?.find((r: any) => r.level === level);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          </View>
          <Text style={styles.username}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.bio}>@{user.username}</Text>
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
      </View>
      <PostsGrid posts={posts} />
      {loadingMore && <ActivityIndicator color="#00f2ff" style={{ marginTop: 18 }} />}
      <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn} disabled={!hasMore || loadingMore}>
        <Text style={[styles.loadMoreText, (!hasMore || loadingMore) && { color: '#555' }]}>Load More</Text>
      </TouchableOpacity>
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
    paddingTop: 30,
    paddingBottom: 18,
    backgroundColor: '#181828',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  gridImage: {
    width: (width) / 3,
    height: (width) / 3,
    borderRadius: 5,
    margin: 8,
    backgroundColor: '#222',
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  multiIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 10,
    padding: 2,
  },
  multiIconImage: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreBtn: {
    alignItems: 'center',
    marginVertical: 18,
  },
  loadMoreText: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});