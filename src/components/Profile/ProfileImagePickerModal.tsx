import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImagePicked: (image: { uri: string; mime: string; name: string }) => void;
}

export default function ProfileImagePickerModal({ visible, onClose, onImagePicked }: Props) {
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      setLoading(true);
      const res = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });
      setImage(res);
    } catch (e: any) {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to pick image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!image) return;
    onImagePicked({
      uri: image.path,
      mime: image.mime,
      name: image.filename || 'profile.jpg',
    });
    setImage(null);
    onClose();
  };

  const handleCancel = () => {
    setImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Upload & Crop Profile Image</Text>
          {loading ? (
            <ActivityIndicator color="#00f2ff" size="large" />
          ) : image ? (
            <Image source={{ uri: image.path }} style={styles.preview} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>Pick Image</Text>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', marginTop: 18 }}>
            <TouchableOpacity style={styles.button} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            {image && (
              <TouchableOpacity style={[styles.button, { marginLeft: 12 }]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#181828',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#00f2ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 120,
  },
  buttonText: {
    color: '#101018',
    fontWeight: 'bold',
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#00f2ff',
  },
});
