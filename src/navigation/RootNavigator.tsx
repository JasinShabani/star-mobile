import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
export default function RootNavigator() {
  const token = useSelector((s: RootState) => s.auth.token);
  return token ? <TabNavigator /> : <AuthNavigator />;
}