import { FeedScreen } from '../components/Feed';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();
<Tab.Screen
  name="Feed"
  component={FeedScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="home" color={color} size={size} />
    ),
    tabBarLabel: 'Feed',
    headerShown: false,
  }}
/>
