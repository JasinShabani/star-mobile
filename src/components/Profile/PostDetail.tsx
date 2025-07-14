import React, { useEffect, useState, useRef, useMemo } from 'react';
import Video from 'react-native-video';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing, DeviceEventEmitter, Modal, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPostById, starPost, unstarPost, reportPost, getPostStars } from '../../api/post';
import { TextInput, Button } from 'react-native-paper';
import { useNavigation as useNav, useRoute as useRt, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import UserProfileScreen from './UserProfileScreen';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 36;
const MOCK_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

export default function PostDetail({ route, navigation }: any) {
  const hookNav = useNav();
  const hookRoute = useRt<any>();
  const nav = navigation || hookNav;
  const rt = route || hookRoute;
  const { postId, user, country, city } = rt.params;
  const screenIsFocused = useIsFocused();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const videoRefs = useRef<any>({});
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [starsModalVisible, setStarsModalVisible] = useState(false);
  const [starredUsers, setStarredUsers] = useState<any[]>([]);
  const [loadingStars, setLoadingStars] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [muteAll, setMuteAll] = useState<boolean>((global as any).__VIDEO_MUTED__ ?? true);
  const toggleMute = () => setMuteAll(m => !m);

  useEffect(() => {
    (global as any).__VIDEO_MUTED__ = muteAll;
  }, [muteAll]);

  const openUserProfile = () => {
    setSelectedUsername(user?.username || post?.user?.username);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPostById(postId);
        setPost(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  useEffect(() => {
    // On unmount, pause all videos
    return () => {
      Object.values(videoRefs.current).forEach((ref: any) => {
        if (ref && ref.seek) ref.seek(0);
      });
    };
  }, []);

  useEffect(() => {
    const pauseListener = DeviceEventEmitter.addListener('pauseAllVideos', () => {
      Object.values(videoRefs.current).forEach((ref: any) => {
        if (ref && ref.seek) ref.seek(0);
      });
    });
    return () => pauseListener.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // When PostDetail is focused, do nothing
      return () => {
        // When PostDetail loses focus (tab change), pause and reset all videos
        Object.values(videoRefs.current).forEach((ref: any) => {
          if (ref && ref.seek) ref.seek(0);
        });
      };
    }, [])
  );

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    setCurrentIndex(idx);
  };

  const triggerStar = async () => {
    if (post.hasStarred) {
      await unstarPost(post.id);
    } else {
      await starPost(post.id);
      triggerStarAnimation();
    }
    // Refresh post data
    const updated = await getPostById(post.id);
    setPost(updated);
  };

  const triggerStarAnimation = () => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const starScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1.3, 1],
  });
  const starOpacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1, 0],
  });

  const handleStarLongPress = async () => {
    try {
      setLoadingStars(true);
      setStarsModalVisible(true);
      const users = await getPostStars(post.id);
      setStarredUsers(users);
    } catch (err) {
      console.log('Failed to fetch starred users:', err);
    } finally {
      setLoadingStars(false);
    }
  };

  const openStarredUserProfile = (username: string) => {
    setStarsModalVisible(false);
    setSelectedUsername(username);
  };

  // Helper to format createdAt values
  const formatTimeAgo = (iso: string | undefined): string => {
    if (!iso) return '';
    const created = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < hourMs) {
      const mins = Math.max(1, Math.floor(diffMs / minuteMs));
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }

    if (diffMs < dayMs) {
      return '1 day ago';
    }

    const days = Math.floor(diffMs / dayMs);
    if (days <= 3) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    if (created.getFullYear() === now.getFullYear()) {
      return `${created.getDate()} ${months[created.getMonth()]}`;
    }
    return `${created.getDate()} ${months[created.getMonth()]} ${created.getFullYear()}`;
  };

  const timeAgoLabel = useMemo(() => formatTimeAgo(post?.createdAt), [post?.createdAt]);

  if (selectedUsername) {
    return (
      <View style={{ flex: 1, backgroundColor: '#101018' }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedUsername(null)}>
          <Icon name="arrow-left" size={26} color="#00f2ff" />
          <Text style={styles.backText}>Back to Post</Text>
        </TouchableOpacity>
        <UserProfileScreen username={selectedUsername} />
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text style={styles.errorText}>Post not found</Text></View>;
  }

  const userAvatar = user?.profileImage || post?.user?.profileImage || MOCK_AVATAR;
  const username = user?.username || post?.user?.username || 'username';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => nav.goBack()}>
          <Icon name="arrow-left" size={28} color="#00f2ff" />
        </TouchableOpacity>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.profileTap}
            activeOpacity={0.8}
            onPress={openUserProfile}
          >
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
            <View>
              <Text style={styles.headerUsername}>{username}</Text>
              <Text style={styles.timeAgo}>{timeAgoLabel}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {(post.global_rank !== null || post.country_rank !== null || post.city_rank !== null) && (
            <TouchableOpacity
              onPress={() => setRankModalVisible(true)}
              style={styles.trophyButton}
            >
              <Text style={styles.trophyEmoji}>🏆 Trophies</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setDropdownVisible(v => !v)}
            style={styles.menuButton}
          >
            <Icon name="dots-vertical" size={24} color="#fff" />
          </TouchableOpacity>
          {dropdownVisible && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                onPress={() => {
                  setDropdownVisible(false);
                  setReportModalVisible(true);
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownText}>Report</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Image Slider with Double Tap */}
        <View style={{ position: 'relative' }}>
          <TapGestureHandler
            numberOfTaps={2}
            onActivated={triggerStar}
          >
            <View>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={[
                  styles.slider,
                  {
                    height:
                      post.media?.[currentIndex]?.type === 'video' ? 500 : width,
                  },
                ]}
                contentContainerStyle={styles.sliderContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {post.media?.map((media: any, idx: number) =>
                  media.type === 'video' ? (
                    <View key={media.id} style={styles.postVideo}>
                      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ flex: 1 }}>
                        <Video
                          ref={ref => {
                            videoRefs.current[media.id] = ref;
                          }}
                          source={{ uri: media.url }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          controls={false} // Disable native controls
                          poster={media.thumbnailUrl}
                          posterResizeMode="cover"
                          repeat
                          paused={!screenIsFocused || currentIndex !== idx}
                          muted={muteAll}
                        />
                        {/* Mute Toggle Button */}
                        <TouchableOpacity
                          style={styles.muteButton}
                          onPress={toggleMute}
                        >
                          <Icon name={muteAll ? 'volume-off' : 'volume-high'} size={22} color="#fff" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Image
                      key={media.id}
                      source={{ uri: media.url }}
                      style={styles.postImage}
                    />
                  )
                )}
              </ScrollView>
              {/* Star Animation */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.animatedStar,
                  {
                    opacity: starOpacity,
                    transform: [{ scale: starScale }],
                  },
                ]}
              >
                <Text style={{ fontSize: 90, textAlign: 'center' }}>🌟</Text>
              </Animated.View>
            </View>
          </TapGestureHandler>
        </View>
        {/* Pagination Dots */}
        {post.media?.length > 1 && (
          <View style={styles.dotsRow}>
            {post.media.map((_: any, idx: number) => (
              <View
                key={idx}
                style={[styles.dot, currentIndex === idx && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Caption with inline star button */}
        <View style={styles.captionRow}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{username}</Text> {post.caption}
          </Text>
          <TouchableOpacity
            onPress={triggerStar}
            onLongPress={handleStarLongPress}
            style={styles.inlineStarButton}
            activeOpacity={0.7}
          >
            {post.hasStarred ? (
              <Text style={styles.bigStar}>🌟</Text>
            ) : (
              <Icon name="star-outline" size={26} color="#FFD700" />
            )}
            <Text style={styles.starCount}>{post.starsCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Rank details modal */}
        <Modal
          transparent
          animationType="slide"
          visible={rankModalVisible}
          onRequestClose={() => setRankModalVisible(false)}
        >
          <View style={styles.modalBack}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setRankModalVisible(false)}
                style={styles.modalClose}
              >
                <Icon name="close" size={26} color="#00f2ff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>🏆 Trophies</Text>

              {post.global_rank !== null && (
                <View style={styles.rankLineBox}>
                  <Text style={styles.rankEmoji}>
                    {post.global_rank === 1 ? '🥇' : post.global_rank === 2 ? '🥈' : '🥉'}
                  </Text>
                  <Text style={styles.rankLineText}>{`#${post.global_rank} Global`}</Text>
                </View>
              )}
              {post.country_rank !== null && (
                <View style={styles.rankLineBox}>
                  <Text style={styles.rankEmoji}>
                    {post.country_rank === 1 ? '🥇' : post.country_rank === 2 ? '🥈' : '🥉'}
                  </Text>
                  <Text style={styles.rankLineText}>{`#${post.country_rank} Country`}</Text>
                </View>
              )}
              {post.city_rank !== null && (
                <View style={styles.rankLineBox}>
                  <Text style={styles.rankEmoji}>
                    {post.city_rank === 1 ? '🥇' : post.city_rank === 2 ? '🥈' : '🥉'}
                  </Text>
                  <Text style={styles.rankLineText}>{`#${post.city_rank} City`}</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Stars Modal */}
        <Modal
          transparent
          animationType="slide"
          visible={starsModalVisible}
          onRequestClose={() => setStarsModalVisible(false)}
        >
          <View style={styles.modalBack}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setStarsModalVisible(false)}
                style={styles.modalClose}
              >
                <Icon name="close" size={26} color="#00f2ff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>🌟 Starred by</Text>
              
              {loadingStars ? (
                <ActivityIndicator color="#00f2ff" style={{ marginTop: 20 }} />
              ) : (
                <ScrollView style={{ maxHeight: 400 }}>
                  {starredUsers.map((starUser: any) => (
                    <TouchableOpacity
                      key={starUser.id}
                      style={styles.userRow}
                      activeOpacity={0.8}
                      onPress={() => openStarredUserProfile(starUser.username)}
                    >
                      <Image source={{ uri: starUser.profileImage }} style={styles.userAvatar} />
                      <Text style={styles.userName}>@{starUser.username}</Text>
                    </TouchableOpacity>
                  ))}
                  {starredUsers.length === 0 && !loadingStars && (
                    <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 30 }}>
                      No stars yet.
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={[styles.modalBack, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[styles.reportModalContent, { marginVertical: '20%', alignSelf: 'center', width: '80%' }]}>
            <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.modalClose}>
              <Icon name="close" size={26} color="#00f2ff" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: 'red' }]}>Report</Text>
            <View style={{ padding: 16 }}>
              <TextInput
                mode="outlined"
                label="Reason"
                placeholder="Why are you reporting this?"
                value={reason}
                onChangeText={setReason}
                multiline
                style={styles.reasonInput}
                placeholderTextColor="#888"
                textColor="#ffffff"
                outlineColor="#ffffff"
                activeOutlineColor="#ffffff"
              />
              <Button
                mode="contained"
                buttonColor="#00f2ff"
                labelStyle={{ color: '#000' }}
                onPress={async () => {
                  if (!reason.trim()) {
                    Alert.alert('Error', 'Please enter a reason.');
                    return;
                  }
                  try {
                    await reportPost(post.id, reason.trim());
                    Alert.alert('Reported', 'Thank you for your feedback.');
                    setReportModalVisible(false);
                    setReason('');
                  } catch {
                    Alert.alert('Error', 'Failed to submit report.');
                  }
                }}
                style={{ marginTop: 12 }}
              >
                Submit
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
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
  loadingText: {
    color: '#00f2ff',
  },
  errorText: {
    color: 'red',
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 10,
    zIndex: 10,
    backgroundColor: '#181828',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 104,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 10,
    backgroundColor: '#222',
  },
  headerUsername: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  timeAgo: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 1,
  },
  slider: {
    width: '100%',
    marginBottom: 8,
  },
  sliderContent: {
    alignItems: 'center',
  },
  postImage: {
    width: width,
    height: width,
    borderRadius: 0,
    backgroundColor: '#222',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#00f2ff',
    width: 8,
    height: 8,
    borderRadius: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    paddingHorizontal: 16,
  },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 22,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    minWidth: 90,
    elevation: 2,
    marginRight: 18,
  },
  starButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCount: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  bigStar: {
    fontSize: 22,
    marginRight: 4,
    marginLeft: 2,
  },
  shareButton: {
    backgroundColor: '#181828',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  captionWrap: {
    paddingHorizontal: 16,
    marginTop: 2,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  inlineStarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  caption: {
    flex: 1, // take available space but allow star button to sit right
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
    textAlign: 'left',
    marginRight: 8,
  },
  captionUsername: {
    fontWeight: 'bold',
    color: '#fff',
  },
  animatedStar: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  postVideo: {
    width: width,
    height: 500,
    backgroundColor: '#000',
  },
  rankBadge: {
    backgroundColor: '#1eb2ba',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankLevel: {
    marginLeft: 6,
    color: '#fff',
    fontSize: 15,
  },
  rankBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  profileTap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyButton: {
    padding: 8,
    backgroundColor: '#00f2ff',
    borderRadius: 12,
  },
  trophyEmoji: {
    color: '#181828',
    fontSize: 13,
  },
  muteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
    zIndex: 10,
  },
  /* Modal styles */
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#101018',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalTitle: {
    color: '#00f2ff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  rankLine: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 4,
  },
  rankLineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181828',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginVertical: 6,
  },
  rankLineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuButton: {
    padding: 8,
    marginLeft: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 140,
    right: 16,
    backgroundColor: '#00f2ff',
    borderRadius: 6,
    elevation: 4,
    paddingVertical: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownText: {
    color: '#000',
    fontSize: 14,
  },
  reportModalContent: {
    backgroundColor: '#101018',
    marginTop: '20%',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reasonInput: {
    backgroundColor: '#161616',
    color: '#fff',
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#181828',
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomColor: '#00f2ff',
    borderBottomWidth: 0.2,
    paddingLeft: 15,
    zIndex: 10,
  },
  backText: {
    color: '#00f2ff',
    fontSize: 16,
    marginLeft: 5,
  },
});
