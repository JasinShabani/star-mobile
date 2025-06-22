import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { createThumbnail } from 'react-native-create-thumbnail';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function PostsGrid({ posts, user }: { posts: any[]; user: any }) {
  const navigation = useNavigation<any>();
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    posts.forEach(async (post) => {
      const firstMedia = post.media?.find((m: any) => m.order === 0);
      if (firstMedia?.type === 'video' && !thumbnails[post.id]) {
        try {
          const { path } = await createThumbnail({ url: firstMedia.url });
          setThumbnails((prev) => ({ ...prev, [post.id]: path }));
        } catch (e) {
          console.warn('Thumbnail error:', e);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const firstMedia = post.media?.find((m: any) => m.order === 0);
        if (!firstMedia) return null;
        const isVideo = firstMedia.type === 'video';
        return (
          <TouchableOpacity
            key={post.id}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id, user })}
            activeOpacity={0.8}
            style={styles.imageWrapper}
          >
            <Image
              source={{
                uri: isVideo
                  ? thumbnails[post.id] || firstMedia.url
                  : firstMedia.url,
              }}
              style={styles.gridImage}
            />
            {isVideo && (
              <View style={styles.videoIcon}>
                                  <Icon name="video" size={22} color="#fff" />

              </View>
            )}
            {(post.global_rank || post.country_rank || post.city_rank) && (
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeEmoji}>🌟</Text>
              </View>
            )}
            {post.media.length > 1 && (
                <View style={styles.multiIcon}>
                    <View style={styles.multiIconImage}>
                    <Svg width={18} height={18} viewBox="0 0 20 20">
                      <Path d="M7.5 2A1.5 1.5 0 006 3.5V13a1 1 0 001 1h9.5a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0016.5 2h-9zm-4 4H4v10h10v.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 16.5v-9A1.5 1.5 0 013.5 6z" fill="white" />
                    </Svg>
                    </View>
                </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  videoIcon: {
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
});
