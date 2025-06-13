import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPostById, starPost, unstarPost } from '../../api/post';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 38;
const MOCK_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

export default function PostDetail() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { postId, user } = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const animation = useRef(new Animated.Value(0)).current;

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
    return <View style={styles.center}><Text style={{ color: '#00f2ff' }}>Loading...</Text></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>Post not found</Text></View>;
  }

  const userAvatar = user?.profileImage || MOCK_AVATAR;
  const username = user?.username || 'username';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#00f2ff" />
        </TouchableOpacity>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <Text style={styles.headerUsername}>{username}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity>
            <Icon name="dots-horizontal" size={26} color="#aaa" />
          </TouchableOpacity>
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
                style={styles.slider}
                contentContainerStyle={styles.sliderContent}
                onScroll={handleScroll}
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
          <View style={styles.starPill}>
            <TouchableOpacity
              style={styles.starButton}
              onPress={triggerStar}
              activeOpacity={0.7}
            >
              {post.hasStarred ? (
                <Text style={styles.bigStar}>🌟</Text>
              ) : (
                <Icon name="star-outline" size={36} color="#FFD700" />
              )}
              <Text style={styles.starCount}>{post.starsCount}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={styles.captionWrap}>
          <Text style={styles.caption}><Text style={styles.captionUsername}>{username}</Text> {post.caption}</Text>
        </View>
      </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 94,
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
  slider: {
    width: '100%',
    maxHeight: width,
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
    fontSize: 32,
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
});
