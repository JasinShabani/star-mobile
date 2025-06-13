// ────────────── src/components/Comments/CommentsSheet.tsx ───────────
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Button, StyleSheet, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { addComment } from '../../redux/commentSlice';

interface Props {
  videoId: string;
  visible: boolean;
  onClose: () => void;
}

export default function CommentsSheet({ videoId, visible, onClose }: Props) {
  const comments = useSelector((s: RootState) =>
    s.comments.items.filter((c) => c.videoId === videoId)
  );
  const dispatch = useDispatch();
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim().length) {
      dispatch(
        addComment({
          id: Date.now().toString(),
          userId: 'u1',
          videoId,
          content: text,
          createdAt: new Date().toISOString(),
        })
      );
      setText('');
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.comment}>
              <Text style={styles.user}>@{item.userId}: </Text>
              {item.content}
            </Text>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={text}
            onChangeText={setText}
          />
          <Button title="Send" onPress={handleAdd} />
        </View>

        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  comment: { paddingVertical: 8, fontSize: 16 },
  user: { fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
});