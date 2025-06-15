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
import { SearchScreen } from '../components/Search';
import UserProfileScreen from '../components/Profile/UserProfileScreen';
import { View } from 'react-native';

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
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Feed') iconName = 'home-variant';
          else if (route.name === 'Search') iconName = 'magnify';
          else if (route.name === 'Leaderboard') iconName = 'trophy-variant';
          else if (route.name === 'Create') iconName = 'plus-circle';
          else if (route.name === 'Profile') iconName = 'account-circle';
          if (route.name === 'Leaderboard') {
            return (
              <View
                style={{
                  backgroundColor: '#FFD700',
                  borderRadius: 40,
                  position: 'absolute',
                  top: -20,
                  height: 58,
                  width: 58,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Icon name={iconName} color="#181828" size={36} />
              </View>
            );
          }
          return <Icon name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Create" component={CreatePostScreen} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
