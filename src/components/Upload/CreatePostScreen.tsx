import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, ScrollView, Dimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import ImagePicker from 'react-native-image-crop-picker';
import { createPost, uploadPostMedia } from '../../api/post';
import { getCategories } from '../../api/category';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

function MediaReorderList({ media, setMedia, onEdit }: any) {
  const renderItem = ({ item, index = 0, drag, isActive }: any) => (
    <TouchableOpacity
      style={[styles.mediaItem, isActive && { opacity: 0.7 }]}
      onLongPress={drag}
      onPress={() => onEdit(media.indexOf(item))}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.path }} style={styles.mediaImage} />
      <View style={styles.mediaOrderBadge}>
        <Text style={styles.mediaOrderText}>{media.indexOf(item) + 1}</Text>
      </View>
    </TouchableOpacity>
  );
  return (
    <DraggableFlatList
      data={media}
      horizontal
      onDragEnd={({ data }) => setMedia(data)}
      keyExtractor={(item, index) => item.path || String(index)}
      renderItem={renderItem}
      contentContainerStyle={{ paddingHorizontal: 8 }}
      style={{ maxHeight: 120, marginBottom: 18 }}
    />
  );
}

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const [media, setMedia] = useState<any[]>([]);
  const [aspect, setAspect] = useState<'9:16' | '1:1'>('9:16');
  const [caption, setCaption] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        setCategories(cats.map((c: any) => ({ label: `${c.icon} ${c.name}`, value: c.id })));
      } catch {
        setError('Failed to load categories');
      }
    })();
  }, []);

  const pickMedia = async () => {
    try {
      const files = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: 10,
        mediaType: 'any',
        cropping: false,
      });
      setMedia(files);
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') Alert.alert('Error', 'Failed to pick media');
    }
  };

  const editMedia = async (index: number) => {
    try {
      const file = media[index];
      if (!file?.path) {
        Alert.alert('Error', 'Invalid file data');
        return;
      }
      const cropped = await ImagePicker.openCropper({
        path: file.path,
        width: aspect === '9:16' ? 720 : 1080,
        height: aspect === '9:16' ? 1280 : 1080,
        cropperToolbarTitle: 'Adjust Media',
        mediaType: file?.mime?.startsWith('video') ? 'video' : 'photo',
      });
      setMedia((prev) => prev.map((m, i) => (i === index ? cropped : m)));
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') Alert.alert('Error', 'Failed to crop media');
    }
  };

  const canShare = media.length > 0 && category && !loading;

  const handleShare = async () => {
    if (!canShare) return;
    try {
      setLoading(true);
      setError('');
      // 1. Create post
      const post = await createPost(caption, category!);
      // 2. Upload media
      await uploadPostMedia(post.id, media.map((m, i) => ({ uri: m.path, type: m.mime, name: m.filename || `media_${i}` })));
      // 3. Navigate to Feed (For You)
      navigation.navigate('Feed', { tab: 'foryou' });
      setMedia([]);
      setCaption('');
      setCategory(null);
      setAspect('9:16');
    } catch (e) {
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create Post</Text>
      <TouchableOpacity style={styles.mediaPickerBtn} onPress={pickMedia} disabled={loading}>
        <Icon name="plus" size={22} color="#00f2ff" />
        <Text style={styles.mediaPickerText}>{media.length === 0 ? 'Select Media (up to 10)' : 'Add/Replace Media'}</Text>
      </TouchableOpacity>
      {media.length > 0 && (
        <>
          <MediaReorderList media={media} setMedia={setMedia} onEdit={editMedia} />
          <View style={styles.aspectRow}>
            <TouchableOpacity
              style={[styles.aspectBtn, aspect === '9:16' && styles.aspectBtnActive]}
              onPress={() => setAspect('9:16')}
              disabled={loading}
            >
              <View style={styles.aspectPreview}>
                <View style={[styles.aspectFrame, { aspectRatio: 9 / 16 }]} />
              </View>
              <Text style={[styles.aspectText, aspect === '9:16' && styles.aspectTextActive]}>9:16</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aspectBtn, aspect === '1:1' && styles.aspectBtnActive]}
              onPress={() => setAspect('1:1')}
              disabled={loading}
            >
              <View style={styles.aspectPreview}>
                <View style={[styles.aspectFrame, { aspectRatio: 1 }]} />
              </View>
              <Text style={[styles.aspectText, aspect === '1:1' && styles.aspectTextActive]}>1:1</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <Text style={styles.label}>Caption</Text>
      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        placeholderTextColor="#888"
        value={caption}
        onChangeText={setCaption}
        editable={!loading}
        maxLength={2200}
      />
      <Text style={styles.label}>Category</Text>
      <DropDownPicker
        open={openCategory}
        value={category}
        items={categories}
        setOpen={setOpenCategory}
        setValue={setCategory}
        setItems={setCategories}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={{ color: '#fff' }}
        arrowIconStyle={{ tintColor: '#fff' }}
        tickIconStyle={{ tintColor: '#fff' }}
        disabled={loading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.shareButton, !canShare && { opacity: 0.5 }]}
        onPress={handleShare}
        disabled={!canShare}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#101018" /> : <Text style={styles.shareButtonText}>Share</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101018',
    padding: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 34,
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1.1,
  },
  mediaPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#23233a',
    justifyContent: 'center',
  },
  mediaPickerText: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  aspectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aspectBtn: {
    backgroundColor: '#23233a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#23233a',
  },
  aspectBtnActive: {
    backgroundColor: '#00f2ff',
    borderColor: '#00f2ff',
  },
  aspectText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 15,
  },
  aspectTextActive: {
    color: '#101018',
  },
  label: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 6,
    marginTop: 12,
    marginLeft: 2,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#23233a',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    fontSize: 17,
    borderWidth: 1.5,
    borderColor: '#23233a',
    marginTop: 2,
  },
  dropdown: {
    backgroundColor: '#23233a',
    borderColor: '#444',
    borderRadius: 12,
    marginBottom: 16,
  },
  dropdownContainer: {
    backgroundColor: '#23233a',
    borderColor: '#555',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shareButton: {
    backgroundColor: '#00f2ff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: '#101018',
    fontWeight: 'bold',
    fontSize: 19,
    letterSpacing: 1.1,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
  },
  mediaItem: {
    marginRight: 10,
    position: 'relative',
  },
  mediaImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  mediaOrderBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#00f2ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaOrderText: {
    color: '#101018',
    fontWeight: 'bold',
    fontSize: 13,
  },
  aspectPreview: {
    alignItems: 'center',
    marginBottom: 4,
  },
  aspectFrame: {
    width: 24,
    backgroundColor: '#ccc',
    borderRadius: 4,
  },
});
