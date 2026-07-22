import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InfoHubScreen from '../screens/InfoHubScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import ObsAccountScreen from '../screens/ObsAccountScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: '#8A1538' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '800', fontSize: 17 },
  headerBackTitleVisible: false,
};

export default function InfoStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5F6FA' },
      }}
    >
      <Stack.Screen
        name="InfoHubMain"
        component={InfoHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnnouncementsList"
        component={AnnouncementsScreen}
        options={{
          ...headerOptions,
          title: 'Duyurular',
        }}
      />
      <Stack.Screen
        name="AboutInstitution"
        component={AboutScreen}
        options={{
          ...headerOptions,
          title: 'Okulumuz',
        }}
      />
      <Stack.Screen
        name="ContactDetail"
        component={ContactScreen}
        options={{
          ...headerOptions,
          title: 'İletişim',
        }}
      />
      <Stack.Screen
        name="ObsAccount"
        component={ObsAccountScreen}
        options={{
          ...headerOptions,
          title: 'OBS / Hesabım',
        }}
      />
      <Stack.Screen
        name="AdminPanel"
        component={AdminScreen}
        options={{
          ...headerOptions,
          title: 'İçerik yönetimi',
        }}
      />
    </Stack.Navigator>
  );
}
