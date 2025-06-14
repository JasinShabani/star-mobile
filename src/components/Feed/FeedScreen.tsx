import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, ScrollView, Animated, Easing } from 'react-native';
import { getCategories } from '../../api/category';
import { getFeedFollowing, getFeedForYou } from '../../api/feed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { starPost, unstarPost } from '../../api/post';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

function PostCard({ post, onStar }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [starAnimating, setStarAnimating] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

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

  const starScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1.3, 1],
  });
  const starOpacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <View style={styles.postCard}>
      {/* User Row */}
      <View style={styles.postHeader}>
        <Image source={{ uri: post.user.profileImage }} style={styles.avatar} />
        <Text style={styles.username}>{post.user.username}</Text>
        <View style={{ flex: 1 }} />
      </View>
      {/* Image Slider with Double Tap */}
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
            {post.media?.map((media: any) => (
              <Image
                key={media.id}
                source={{ uri: media.url }}
                style={styles.postImage}
              />
            ))}
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
      <View style={styles.dotsRow}>
        {post.media?.map((_: any, idx: number) => (
          <View
            key={idx}
            style={[styles.dot, currentIndex === idx && styles.dotActive]}
          />
        ))}
      </View>
      {/* Star Row */}
      <View style={styles.starRow}>
        <TouchableOpacity
          style={styles.starButton}
          onPress={() => onStar(post)}
          activeOpacity={0.7}
        >
          {post.hasStarred ? (
            <Text style={styles.bigStar}>🌟</Text>
          ) : (
            <Icon name="star-outline" size={32} color="#FFD700" />
          )}
          <Text style={styles.starCount}>{post.starCount}</Text>
        </TouchableOpacity>
      </View>
      {/* Caption */}
      <View style={styles.captionWrap}>
        <Text style={styles.caption}><Text style={styles.captionUsername}>{post.user.username}</Text> {post.caption}</Text>
      </View>
    </View>
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

  const handleStar = async (post: any) => {
    try {
      if (post.hasStarred) {
        await unstarPost(post.id);
      } else {
        await starPost(post.id);
      }
      // Update post in state
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, hasStarred: !post.hasStarred, starCount: post.hasStarred ? p.starCount - 1 : p.starCount + 1 } : p));
    } catch {}
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <Text style={styles.feedTitle}>Feed</Text>
        <FeedTabBar selected={tab} onSelect={setTab} />
        <CategoryTabs categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        {loading && <ActivityIndicator color="#00f2ff" size="large" style={{ marginTop: 40 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <PostCard post={item} onStar={handleStar} />}
          style={styles.feedList}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#00f2ff" /> : null}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101018',
    paddingTop: 53,
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
    fontSize: 16,
  },
  tabLabelActive: {
    color: '#101018',
  },
  categoryTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 8,
    height: 65,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    marginBottom: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 50,
  },
  categoryTabActive: {
    borderColor: '#00f2ff',
    backgroundColor: '#23233a',
  },
  categoryIcon: {
    fontSize: 18,
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
    paddingTop: 5,
  },
  postCard: {
    backgroundColor: '#181828',
    borderRadius: 22,
    marginHorizontal: 14,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#222',
    // borderWidth: 2,
    // borderColor: '#00f2ff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  slider: {
    width: '100%',
    maxHeight: width,
    marginBottom: 8,
  },
  sliderContent: {
    alignItems: 'center',
  },
  postImage: {
    width: width - 28,
    height: width - 28,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#00f2ff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 18,
    marginVertical: 6,
  },
  starButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23233a',
    borderRadius: 30,
    paddingVertical: 6,
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
    fontSize: 28,
    marginRight: 4,
    marginLeft: 2,
  },
  captionWrap: {
    paddingHorizontal: 18,
    marginTop: 2,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    marginTop: 2,
    textAlign: 'left',
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
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
