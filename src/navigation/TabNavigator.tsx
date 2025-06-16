import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../components/Feed';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import Profile from '../components/Profile/Profile';
import PostDetail from '../components/Profile/PostDetail';
import EditProfile from '../components/Profile/EditProfile';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CreatePostScreen from '../components/Upload/CreatePostScreen';
import { SearchScreen } from '../components/Search';
import UserProfileScreen from '../components/Profile/UserProfileScreen';
import { View, Image, DeviceEventEmitter } from 'react-native';
import { getMe } from '../api/user';

const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={Profile} />
      <ProfileStackNav.Screen name="PostDetail" component={PostDetail} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfile} />
      <ProfileStackNav.Screen name="UserProfile" component={UserProfileScreen} />
    </ProfileStackNav.Navigator>
  );
}

export default function TabNavigator() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00f2ff',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: '#181828',
          borderTopWidth: 0,
          height: 80,
          marginBottom: 6,
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 13,
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Profile') {
            return (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: color,
              }}>
                <Image
                  source={{ uri: user?.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            );
          }

          let iconName = '';
          if (route.name === 'Feed') iconName = 'home-variant';
          else if (route.name === 'Search') iconName = 'magnify';
          else if (route.name === 'Leaderboard') iconName = 'trophy-variant';
          else if (route.name === 'Create') iconName = 'plus-circle';

          if (route.name === 'Leaderboard') {
            const isFocused = route.name === 'Leaderboard' && focused;
            return (
              <View
                style={{
                  backgroundColor: isFocused ? '#ffdf00' : '#FFD700',
                  borderRadius: 40,
                  position: 'absolute',
                  top: -20,
                  height: 58,
                  width: 58,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#FFD700',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isFocused ? 1 : 0.8,
                  shadowRadius: isFocused ? 15 : 10,
                  elevation: isFocused ? 7 : 5,
                }}
              >
                <Icon name={iconName} color={isFocused ? '#3b6265' : '#181828'} size={36} />
              </View>
            );
          }
          return <Icon name={iconName} color={color} size={30} />;
        },
      })}
      onTabPress={({ route, preventDefault }) => {
        DeviceEventEmitter.emit('pauseAllVideos');
      }}
    >
      {/* <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: '' }} /> */}
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarLabel: '' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Feed' }],
            });
          },
        })}
      />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Create" component={CreatePostScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: '' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', {
              screen: 'ProfileMain',
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}
