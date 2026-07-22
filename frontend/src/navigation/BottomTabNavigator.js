import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeStackNavigator from './HomeStackNavigator';
import DepartmentsStackNavigator from './DepartmentsStackNavigator';
import FastAccessScreen from '../screens/FastAccessScreen';
import InfoStackNavigator from './InfoStackNavigator';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(138, 21, 56, 0.15)',
          borderTopWidth: 1,
          height: 64,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName =
            route.name === 'Home'
              ? 'home'
              : route.name === 'Departments'
                ? 'business'
                : route.name === 'FastAccess'
                  ? 'link'
                  : 'info';
          const iconSize = size ?? 22;
          const iconColor = focused ? '#8A1538' : 'rgba(0,0,0,0.45)';
          return (
            <MaterialIcons
              name={iconName}
              size={iconSize}
              color={iconColor}
            />
          );
        },
        tabBarActiveTintColor: '#8A1538',
        tabBarInactiveTintColor: 'rgba(0,0,0,0.45)',
        tabBarLabelStyle: {
          fontWeight: '800',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen
        name="Departments"
        component={DepartmentsStackNavigator}
        options={{ title: 'Bölümler' }}
      />
      <Tab.Screen
        name="FastAccess"
        component={FastAccessScreen}
        options={{ title: 'Hızlı Erişim' }}
      />
      <Tab.Screen
        name="Info"
        component={InfoStackNavigator}
        options={{ title: 'Bilgi', tabBarLabel: 'Bilgi' }}
      />
    </Tab.Navigator>
  );
}

