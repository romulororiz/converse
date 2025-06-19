import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import InsightsScreen from '../screens/InsightsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
	return (
		<NavigationContainer>
			<Tab.Navigator
				screenOptions={({ route }) => ({
					tabBarIcon: ({ focused, color, size }) => {
						let iconName;

						if (route.name === 'Home') {
							iconName = focused ? 'home' : 'home-outline';
						} else if (route.name === 'Chat') {
							iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
						} else if (route.name === 'Discover') {
							iconName = focused ? 'search' : 'search-outline';
						} else if (route.name === 'Insights') {
							iconName = focused ? 'analytics' : 'analytics-outline';
						} else if (route.name === 'Preferences') {
							iconName = focused ? 'settings' : 'settings-outline';
						}

						return <Ionicons name={iconName} size={size} color={color} />;
					},
					tabBarActiveTintColor: colors.light.primary,
					tabBarInactiveTintColor: colors.light.mutedForeground,
					tabBarStyle: {
						backgroundColor: colors.light.card,
						borderTopColor: colors.light.border,
					},
					headerStyle: {
						backgroundColor: colors.light.card,
					},
					headerTintColor: colors.light.foreground,
				})}
			>
				<Tab.Screen name='Home' component={HomeScreen} />
				<Tab.Screen name='Chat' component={ChatScreen} />
				<Tab.Screen name='Discover' component={DiscoverScreen} />
				<Tab.Screen name='Insights' component={InsightsScreen} />
				<Tab.Screen name='Preferences' component={PreferencesScreen} />
			</Tab.Navigator>
		</NavigationContainer>
	);
}
