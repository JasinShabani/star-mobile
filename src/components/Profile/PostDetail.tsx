import React, { useEffect, useState, useRef } from 'react';
import Video from 'react-native-video';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing, DeviceEventEmitter } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPostById, starPost, unstarPost } from '../../api/post';
import { useNavigation as useNav, useRoute as useRt, useFocusEffect } from '@react-navigation/native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 36;
const MOCK_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

export default function PostDetail({ route, navigation }: any) {
  const nav = navigation || useNav();
  const rt = route || useRt<any>();
  const { postId, user, rank, level } = rt.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const videoRefs = useRef<any>({});

  useEffect(() => {
    console.log('User from route params:', user);
  }, [user]);

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

  if (loading) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text style={styles.errorText}>Post not found</Text></View>;
  }

  const userAvatar = user?.profileImage || MOCK_AVATAR;
  const username = user?.username || 'username';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => nav.goBack()}>
          <Icon name="arrow-left" size={28} color="#00f2ff" />
        </TouchableOpacity>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <Text style={styles.headerUsername}>{username}</Text>
          <View style={{ flex: 1 }} />
          {typeof rank === 'number' && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankEmoji}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅'}
                  </Text>
                  <Text style={styles.rankLevel}>
                    {level?.charAt(0).toUpperCase() + level?.slice(1)}
                  </Text>
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
                          controls
                          poster={media.thumbnailUrl}
                          posterResizeMode="cover"
                          repeat
                          paused={currentIndex !== idx}
                        />
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
      </ScrollView>
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
    color: '#fff',
    fontSize: 14,
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
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankLevel: {
    marginLeft: 6,
    color: '#fff',
    fontSize: 15,
  },
});
