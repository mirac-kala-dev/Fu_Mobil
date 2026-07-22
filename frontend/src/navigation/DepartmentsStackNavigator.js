import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DepartmentDetailScreen from '../screens/DepartmentDetailScreen';
import DepartmentsScreen from '../screens/DepartmentsScreen';

const Stack = createNativeStackNavigator();

export default function DepartmentsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5F6FA' },
      }}
    >
      <Stack.Screen name="DepartmentsList" component={DepartmentsScreen} />
      <Stack.Screen name="DepartmentDetail" component={DepartmentDetailScreen} />
    </Stack.Navigator>
  );
}
