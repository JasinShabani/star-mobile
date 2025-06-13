import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feed from '../components/Feed/Feed';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import Profile from '../components/Profile/Profile';
import PostDetail from '../components/Profile/PostDetail';
import EditProfile from '../components/Profile/EditProfile';

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
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Feed" component={Feed} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}