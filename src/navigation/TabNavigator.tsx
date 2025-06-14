import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../components/Feed';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import Profile from '../components/Profile/Profile';
import PostDetail from '../components/Profile/PostDetail';
import EditProfile from '../components/Profile/EditProfile';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CreatePostScreen from '../components/Upload/CreatePostScreen';

const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={Profile} />
      <ProfileStackNav.Screen name="PostDetail" component={PostDetail} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfile} />
    </ProfileStackNav.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00f2ff',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: '#181828',
          borderTopWidth: 0,
          height: 78,
          marginBottom: 6,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 13,
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Feed') iconName = 'home-variant';
          else if (route.name === 'Leaderboard') iconName = 'trophy-variant';
          else if (route.name === 'Create') iconName = 'plus-circle';
          else if (route.name === 'Profile') iconName = 'account-circle';
          return <Icon name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} />
      <Tab.Screen name="Create" component={CreatePostScreen} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
