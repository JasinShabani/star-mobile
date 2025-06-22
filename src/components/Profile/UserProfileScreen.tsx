import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserByUsername, getMe, followUser, unfollowUser } from '../../api/user';
import { getPostsByUsername } from '../../api/post';
import { useRoute } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import PostDetail from './PostDetail';
import { createThumbnail } from 'react-native-create-thumbnail';

const { width } = Dimensions.get('window');

interface UserProfileScreenProps {
  username?: string;
}

function PostsGrid({ posts, onPostPress }: any) {
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    posts.forEach(async (post: any) => {
      const firstMedia = post.media?.find((m: any) => m.order === 0);
      if (firstMedia?.type === 'video' && !videoThumbnails[post.id]) {
        try {
          const { path } = await createThumbnail({ url: firstMedia.url });
          setVideoThumbnails(prev => ({ ...prev, [post.id]: path }));
        } catch (e) {
          console.warn('Thumbnail generation failed', e);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  return (
    <View style={styles.grid}>
      {posts.map((post: any) => {
        const firstMedia = post.media?.find((m: any) => m.order === 0);
        if (!firstMedia) return null;
        return (
          <TouchableOpacity
            key={post.id}
            onPress={() => onPostPress(post.id)}
            activeOpacity={0.8}
            style={styles.imageWrapper}
          >
            {firstMedia.type === 'video' ? (
              <View>
                <Image
                  source={{ uri: videoThumbnails[post.id] || firstMedia.url }}
                  style={styles.gridImage}
                />
                <View style={styles.videoIconOverlay}>
                  <Icon name="video" size={22} color="#fff" />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: firstMedia.url }}
                style={styles.gridImage}
              />
            )}
            {(post.global_rank || post.country_rank || post.city_rank) && (
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeEmoji}>🌟</Text>
              </View>
            )}
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

// Helper: Modal wrapper for PostDetail with injected route params
function PostDetailModal({ postId, user, onClose }: { postId: string, user: any, onClose: () => void }) {
  return (
    <PostDetail
      route={{ params: { postId, user } }}
      navigation={{ goBack: onClose }}
    />
  );
}

export default function UserProfileScreen({ username: propUsername }: UserProfileScreenProps) {
  const route = useRoute<any>();
  const username = propUsername || route.params?.username;
  const fromModal = route.params?.fromModal ?? false;
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showUnfollowDropdown, setShowUnfollowDropdown] = useState(false);

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

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch {}
    })();
  }, []);

  useEffect(() => {
   if (!user || !currentUser) return;
   setIsFollowing(!!user.isFollowing);
  }, [user, currentUser]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUserAndPosts(false, nextPage);
    }
  };

  const handlePanGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.translationX > 60 && nativeEvent.state === State.END) {
      setSelectedPostId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00f2ff" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
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
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.headerWrap, fromModal && { paddingTop: 30 }]}>
          <View style={[styles.headerGradient, fromModal && { paddingTop: 30 }]}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            </View>
            <Text style={styles.username}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.bio}>@{user.username}</Text>
            {currentUser && user.id !== currentUser.id && (
              <>
                {!isFollowing ? (
                  <TouchableOpacity
                    style={[styles.followBtn, styles.followBtnActive]}
                    onPress={async () => {
                      setFollowLoading(true);
                      try {
                        await followUser(user.username);
                        setIsFollowing(true);
                      } catch {}
                      setFollowLoading(false);
                    }}
                    disabled={followLoading}
                  >
                    <Text style={styles.followBtnText}>
                      <Icon name="account-plus-outline" size={18} color="#101018" /> Follow
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.followingWrapper}>
                    <TouchableOpacity
                      style={styles.followBtn}
                      onPress={() => setShowUnfollowDropdown(prev => !prev)}
                    >
                      <Text style={[styles.followBtnText, { color: '#00f2ff' }]}>
                        <Icon name="check" size={18} color="#00f2ff" /> Following
                      </Text>
                    </TouchableOpacity>
                    {showUnfollowDropdown && (
                      <View style={styles.unfollowDropdown}>
                        <TouchableOpacity
                          onPress={async () => {
                            setFollowLoading(true);
                            try {
                              await unfollowUser(user.username);
                              setIsFollowing(false);
                              setShowUnfollowDropdown(false);
                            } catch {}
                            setFollowLoading(false);
                          }}
                          disabled={followLoading}
                          style={styles.unfollowBtnDropdown}
                        >
                          <Text style={styles.unfollowText}>
                            <Icon name="account-remove-outline" size={18} color="#00f2ff" /> Unfollow
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setShowUnfollowDropdown(false)}
                          style={styles.cancelBtn}
                        >
                          <Text style={styles.cancelText}>✕ Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
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
              {getRank('city')?.rank && (
                <View style={styles.trophyBox}>
                  <Icon name="city" size={36} color="#00f2ff" />
                  <Text style={styles.trophyLabel}>CITY</Text>
                  <Text style={styles.trophyRank}>
                    {`${getRank('city')?.count} x ${getMedal(getRank('city')?.rank)}`}
                  </Text>
                </View>
              )}
              {getRank('country')?.rank && (
                <View style={styles.trophyBox}>
                  <Icon name="flag" size={36} color="#00f2ff" />
                  <Text style={styles.trophyLabel}>COUNTRY</Text>
                  <Text style={styles.trophyRank}>
                    {`${getRank('country')?.count} x ${getMedal(getRank('country')?.rank)}`}
                  </Text>
                </View>
              )}
              {getRank('global')?.rank && (
                <View style={styles.trophyBox}>
                  <Icon name="earth" size={36} color="#00f2ff" />
                  <Text style={styles.trophyLabel}>GLOBAL</Text>
                  <Text style={styles.trophyRank}>
                    {`${getRank('global')?.count} x ${getMedal(getRank('global')?.rank)}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <PostsGrid posts={posts} onPostPress={setSelectedPostId} />
        {loadingMore && <ActivityIndicator color="#00f2ff" style={styles.loadingMore} />}
        {!posts.length ? (
          <Text style={styles.noPostsText}>No posts available.</Text>
        ) : (
          hasMore && !loadingMore && (
            <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
      {selectedPostId && (
        <PanGestureHandler onGestureEvent={handlePanGesture} onHandlerStateChange={handlePanGesture}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={[styles.backBtn, fromModal && { top: 55 }]} onPress={() => setSelectedPostId(null)}>
              <Icon name="arrow-left" size={26} color="#00f2ff" />
              <Text style={styles.backText}>Back to Profile</Text>
            </TouchableOpacity>
            <PostDetailModal postId={selectedPostId} user={user} onClose={() => setSelectedPostId(null)} />
          </View>
        </PanGestureHandler>
      )}
    </>
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
    marginTop: 8,
  },
  statCard: {
    backgroundColor: '#181828',
    borderRadius: 22,
    paddingVertical: 0,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    minWidth: 70,
    height: 60,
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
    fontSize: 18,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 22,
    marginTop: 1,
    textAlign: 'center',
  },
  trophiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
  },
  trophyBox: {
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 18,
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
    paddingTop: 20,
  },
  gridImage: {
    width: (width) / 3,
    height: (width) / 3,
    borderRadius: 5,
    margin: 0,
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
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  videoIconOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 12,
    padding: 4,
  },
  badgeIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    padding: 4,
  },
  badgeEmoji: {
    fontSize: 17,
  },
  followBtn: {
    backgroundColor: '#181828',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    minWidth: 60,
    height: 40,
  },
  followBtnActive: {
    backgroundColor: '#00f2ff',
    height: 40,
  },
  unfollowBtn: {
    backgroundColor: '#181828',
    height: 40,
  },
  followBtnText: {
    color: '#101018',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
  },
  loadingMore: {
    marginTop: 18,
  },
  noPostsText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#101018',
  },
  followingWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  unfollowText: {
    color: '#00f2ff',
    fontSize: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unfollowBtnDropdown: {
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cancelBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cancelText: {
    color: '#aaa',
    fontSize: 18,
  },
  unfollowDropdown: {
    position: 'absolute',
    top: 45,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    zIndex: 10,
    width: 150,
    alignItems: 'center',
  },
});
