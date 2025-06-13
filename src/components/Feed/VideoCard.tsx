// ────────────── src/components/Feed/VideoCard.tsx ───────────
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from '../../models/types';

interface Props {
  data: Video;
  onLike: () => void;
  onSkip: () => void;
}

export default function VideoCard({ data, onLike, onSkip }: Props) {
  return (
    <View style={styles.container}>
      {/* In a real build you’d swap Image for react‑native‑video */}
      <Image source={{ uri: data.thumbnailUrl }} style={styles.thumbnail} />

      <View style={styles.meta}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.user}>@user_{data.userId}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onLike}>
          <Text style={styles.btnText}>👍 Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onSkip}>
          <Text style={styles.btnText}>👎 Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  thumbnail: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  meta: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  user: { color: '#ddd', marginTop: 4 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});