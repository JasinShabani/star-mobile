import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function PostsGrid({ posts, user }: { posts: any[]; user: any }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const firstMedia = post.media?.find((m: any) => m.order === 0);
        if (!firstMedia) return null;
        return (
          <TouchableOpacity
            key={post.id}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id, user })}
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
});
