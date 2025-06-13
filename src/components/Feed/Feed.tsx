// src/components/Feed/Feed.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { like, skip } from '../../redux/feedSlice';
import { Card, Avatar, Text, useTheme } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.73;

export default function Feed() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const swiperRef = useRef<Swiper<any>>(null);
  const videos = useSelector((state: RootState) => state.feed.videos);

  if (videos.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.emptyContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={styles.emptyText}>No videos available</Text>
      </SafeAreaView>
    );
  }

  const renderCard = (item: any) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        <Video
          source={{ uri: item.videoUrl }}
          style={styles.cover}
          resizeMode="cover"
          paused={false}
        />
        <Card.Title
          title={<Text style={styles.cardTitle}>{item.title}</Text>}
          subtitle={<Text style={styles.cardSubtitle}>{`@${item.userId}`}</Text>}
          left={(props) => <Avatar.Icon {...props} icon="account" />}
        />
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => {
              dispatch(skip());
              swiperRef.current?.swipeLeft();
            }}
          >
            <IconButton icon="thumb-down" size={28} iconColor={theme.colors.error} />
          </TouchableOpacity>
    
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => {
              dispatch(like(item.id));
              swiperRef.current?.swipeRight();
            }}
          >
            <IconButton icon="thumb-up" size={28} iconColor={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerText, { color: theme.colors.onBackground }]}>
          Feed
        </Text>
      </View>
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={videos}
          cardIndex={0}
          renderCard={renderCard}
          stackSize={3}
          verticalSwipe={false}
          backgroundColor="transparent"
          overlayLabels={{
            left: {
              title: 'Skip',
              style: {
                label: styles.overlayLabelLeft,
                wrapper: styles.overlayWrapperLeft,
              },
            },
            right: {
              title: 'Like',
              style: {
                label: styles.overlayLabelRight,
                wrapper: styles.overlayWrapperRight,
              },
            },
          }}
          cardVerticalMargin={20}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
  },
  swiperContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    elevation: 6,
  },
  cover: {
    width: '100%',
    height: CARD_HEIGHT * 0.75,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 20,
  },
  cardSubtitle: {
    color: '#999999',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  overlayLabelLeft: {
    color: '#E53935',
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlayWrapperLeft: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 20,
    marginLeft: -20,
  },
  overlayLabelRight: {
    color: '#43A047',
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlayWrapperRight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 20,
    marginLeft: 20,
  },
  iconWrapper: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 4,
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    overflow: 'hidden',
    height: '100%',
    borderRadius: 16,
  },
});
