import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, ScrollView, Animated, Easing, DeviceEventEmitter, Modal, Alert } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { getCategories } from '../../api/category';
import { getFeedFollowing, getFeedForYou } from '../../api/feed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TapGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { starPost, unstarPost, reportPost } from '../../api/post';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import UserProfileScreen from '../Profile/UserProfileScreen';
import { useFocusEffect } from '@react-navigation/native';
import { TextInput, Button } from 'react-native-paper';
import { blockUser, unblockUser } from '../../api/user';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'following', label: 'Following' },
  { key: 'foryou', label: 'For You' },
];

function CategoryTabs({ categories, selected, onSelect }: any) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
      {categories.map((cat: any) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.categoryTab, selected === cat.id && styles.categoryTabActive]}
          onPress={() => onSelect(selected === cat.id ? null : cat.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <Text style={[styles.categoryLabel, selected === cat.id && styles.categoryLabelActive]}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function FeedTabBar({ selected, onSelect }: any) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabBtn, selected === tab.key && styles.tabBtnActive]}
          onPress={() => onSelect(tab.key)}
        >
          <Text style={[styles.tabLabel, selected === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface Post {
  id: string;
  user: {
    username: string;
    profileImage: string;
  };
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    order: number;
  }>;
  hasStarred: boolean;
  starCount: number;
  caption: string;
}

function PostCard({ post, onStar, onUserPress, isFocused }: { post: Post; onStar: (post: Post) => void; onUserPress: (username: string) => void; isFocused: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [starAnimating, setStarAnimating] = useState(false);
  // Video play state for navigation focus
  const [shouldPlayVideo, setShouldPlayVideo] = useState(true);
  const [forcePaused, setForcePaused] = useState(false);
  const videoRef = useRef<VideoRef>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  const triggerStarAnimation = () => {
    setStarAnimating(true);
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => setStarAnimating(false));
  };

  const handleDoubleTap = async () => {
    if (!post.hasStarred) {
      await onStar(post);
      triggerStarAnimation();
    }
  };

  // Manage video play state on navigation focus
  useFocusEffect(
    useCallback(() => {
      setShouldPlayVideo(true);
      return () => setShouldPlayVideo(false);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      // When Feed is focused, do nothing special
      return () => {
        // When Feed loses focus (tab change), pause and reset video
        setForcePaused(true);
        if (videoRef.current) {
          videoRef.current.seek(0);
        }
      };
    }, [])
  );

  // Only play video if this post is focused and the current media is a video and not forcePaused and shouldPlayVideo
  const currentMedia = post.media?.[currentIndex];
  // videoShouldPlay is kept for logic, but we want to use paused={!shouldPlayVideo || idx !== currentIndex}
  // const videoShouldPlay = shouldPlayVideo && isFocused && currentMedia?.type === 'video' && !forcePaused;

  useEffect(() => {
    // If not focused, reset video to start
    if (!isFocused && videoRef.current) {
      videoRef.current.seek(0);
    }
  }, [isFocused]);

  const starScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1.3, 1],
  });
  const starOpacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <>
    <View style={styles.postCard}>
      {/* User Row */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onUserPress(post.user.username)}>
          <Image source={{ uri: post.user.profileImage }} style={styles.avatar} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onUserPress(post.user.username)}>
          <Text style={styles.username}>{post.user.username}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.menuButton} onPress={() => setDropdownVisible(prev => !prev)}>
          <Icon name="dots-vertical" size={24} color="#fff" />
        </TouchableOpacity>
        {dropdownVisible && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setDropdownVisible(false);
                setReportModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Image/Video Slider with Double Tap */}
      <TapGestureHandler numberOfTaps={2} onActivated={handleDoubleTap}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.slider}
            contentContainerStyle={styles.sliderContent}
            onScroll={e => {
              const x = e.nativeEvent.contentOffset.x;
              setCurrentIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {post.media?.map((media: any, idx: number) => {
              // Only play video if:
              // - this screen is focused
              // - this post is focused (isFocused)
              // - this media is the current index
              // - shouldPlayVideo is true
              // - not forcePaused
              // Use useIsFocused() directly for navigation focus
              const { useIsFocused } = require('@react-navigation/native');
              const screenIsFocused = useIsFocused ? useIsFocused() : true;
              const playThisVideo = screenIsFocused && isFocused && shouldPlayVideo && idx === currentIndex && !forcePaused;
              return media.type === 'video' ? (
                <Video
                  key={media.id}
                  ref={idx === currentIndex ? videoRef : undefined}
                  source={{ uri: media.url }}
                  style={styles.postImage}
                  resizeMode="cover"
                  repeat
                  paused={!screenIsFocused || !isFocused || idx !== currentIndex}
                  muted={false}
                  playInBackground={false}
                  playWhenInactive={false}
                  controls
                />
              ) : (
                <Image
                  key={media.id}
                  source={{ uri: media.url }}
                  style={styles.postImage}
                />
              );
            })}
          </ScrollView>
          {/* Star Animation */}
          {starAnimating && (
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
          )}
        </View>
      </TapGestureHandler>
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
      
      {/* Caption and Inline Star */}
      <View style={styles.captionRow}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{post.user.username}</Text> {post.caption}
        </Text>
        <TouchableOpacity
          style={styles.inlineStarButton}
          onPress={() => onStar(post)}
          activeOpacity={0.7}
        >
          {post.hasStarred ? (
            <Text style={styles.bigStar}>🌟</Text>
          ) : (
            <Icon name="star-outline" size={26} color="#FFD700" />
          )}
          <Text style={styles.inlineStarCount}>{post.starCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
    {/* Report Modal (moved inside Fragment) */}
    <Modal
      visible={reportModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setReportModalVisible(false)}
    >
      <View style={styles.modalBack}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.modalClose}>
            <Icon name="close" size={26} color="#00f2ff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Report</Text>
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
            style={{ marginTop: 12 }}
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
          >
            Submit
          </Button>
        </View>
      </View>
    </Modal>
    </>
  );
}

export default function FeedScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<'following' | 'foryou'>('foryou');
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  // Track which posts are visible (focused) for video play/mute logic
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisiblePostIds(viewableItems.map((item: any) => item.item.id));
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const cats = await getCategories();
        setCategories(cats);
        setSelectedCategory(null);
      } catch (e) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchPosts = useCallback(async (reset = false, nextPage = 1) => {
    try {
      if (reset) setLoading(true);
      setError('');
      let data = [];
      if (tab === 'following') {
        data = await getFeedFollowing(nextPage, 10, selectedCategory || undefined);
      } else {
        data = await getFeedForYou(nextPage, 10, selectedCategory || undefined);
      }
      const uniqueData = Array.from(new Map(data.map(post => [post.id, post])).values());
      if (reset) {
        setPosts(uniqueData);
      } else {
        setPosts(prev => {
          const seen = new Set(prev.map(p => p.id));
          const newPosts = uniqueData.filter(p => !seen.has(p.id));
          return [...prev, ...newPosts];
        });
      }
      setHasMore(uniqueData.length === 10);
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [tab, selectedCategory]);

  useEffect(() => {
    setPage(1);
    fetchPosts(true, 1);
  }, [tab, selectedCategory, fetchPosts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(false, nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(true, 1);
  };

  const handleStar = async (post: Post) => {
    try {
      if (post.hasStarred) {
        await unstarPost(post.id);
      } else {
        await starPost(post.id);
      }
      // Update post in state
      setPosts((prev: Post[]) => prev.map((p: Post) => 
        p.id === post.id 
          ? { ...p, hasStarred: !post.hasStarred, starCount: post.hasStarred ? p.starCount - 1 : p.starCount + 1 } 
          : p
      ));
    } catch {}
  };

  const handleUserPress = (username: string) => {
    setSelectedUsername(username);
  };

  const handlePanGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.translationX > 60 && nativeEvent.state === State.END) {
      setSelectedUsername(null);
    }
  };

  if (selectedUsername) {
    return (
      <PanGestureHandler onGestureEvent={handlePanGesture} onHandlerStateChange={handlePanGesture}>
        <View style={{ flex: 1, backgroundColor: '#101018' }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedUsername(null)}>
            <Icon name="arrow-left" size={26} color="#00f2ff" />
            <Text style={styles.backText}>Back to Feed</Text>
          </TouchableOpacity>
          <UserProfileScreen username={selectedUsername} />
        </View>
      </PanGestureHandler>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        {/* <Text style={styles.feedTitle}>Feed</Text> */}
        <FeedTabBar selected={tab} onSelect={setTab} />
        <CategoryTabs categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        <View style={styles.divider} />
        {loading && <ActivityIndicator color="#00f2ff" size="large" style={{ marginTop: 40 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }) => (
            <PostCard
              post={item}
              onStar={handleStar}
              onUserPress={handleUserPress}
              isFocused={visiblePostIds.includes(item.id)}
            />
          )}
          style={styles.feedList}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#00f2ff" /> : null}
          ListEmptyComponent={
            !loading ? (
              <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 50 }}>
                {tab === 'following'
                  ? selectedCategory
                    ? 'No posts in this category yet.'
                    : "Let's follow any user to see their posts!"
                  : 'No posts in this category yet.'}
              </Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ItemSeparatorComponent={() => <View style={{ height: 7 }} />}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101018',
    paddingTop: 63,
  },
  feedTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 22,
    marginBottom: 15,
    letterSpacing: 1.1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
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
    fontSize: 12,
  },
  tabLabelActive: {
    color: '#101018',
  },
  categoryTabs: {
    flexDirection: 'row',
    marginBottom: 7,
    paddingHorizontal: 8,
    height: 60,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    marginBottom: 0,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 40,
  },
  categoryTabActive: {
    borderColor: '#00f2ff',
    backgroundColor: '#23233a',
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 7,
  },
  categoryLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryLabelActive: {
    color: '#00f2ff',
  },
  feedList: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 3,
  },
  postCard: {
    backgroundColor: '#181828',
    borderRadius: 22,
    marginHorizontal: 0,
    marginBottom: 22,
    paddingBottom: 10,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#222',
    // borderWidth: 2,
    // borderColor: '#00f2ff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    borderRadius: 16,
    backgroundColor: '#222',
  },
  videoPost: {
    width: width,
    height: 450,
    borderRadius: 16,
    backgroundColor: '#222',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
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
    marginTop: 10,
    marginBottom: 10,
    marginVertical: 6,
  },
  starButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 0,
    paddingHorizontal: 18,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    minWidth: 70,
    elevation: 2,
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
  captionWrap: {
    paddingHorizontal: 18,
    marginTop: 2,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 2,
  },
  inlineStarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23233a',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  inlineStarCount: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
    textAlign: 'left',
  },
  captionUsername: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 14,
  },
  animatedStar: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
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
  divider: {
    height: 1,
    backgroundColor: '#23233a',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  menuButton: {
    padding: 8,
    marginLeft: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
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
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#101018',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalTitle: {
    color: 'red',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  reasonInput: {
    backgroundColor: '#161616',
    color: '#fff',
    marginBottom: 8,
  },
});
