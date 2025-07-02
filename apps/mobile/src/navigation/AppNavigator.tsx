import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useAuth } from '../components/AuthProvider';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from '../screens/HomeScreen';
import ChatsScreen from '../screens/ChatsScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import BooksListScreen from '../screens/BooksListScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function AuthNavigator() {
	return (
		<AuthStack.Navigator
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				transitionSpec: {
					open: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
					close: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
				},
				cardStyleInterpolator: ({ current, layouts }) => ({
					cardStyle: {
						transform: [
							{
								translateX: current.progress.interpolate({
									inputRange: [0, 1],
									outputRange: [layouts.screen.width, 0],
								}),
							},
						],
						backgroundColor: colors.light.background,
					},
					overlayStyle: { opacity: 0 },
				}),
			}}
		>
			<AuthStack.Screen name="Login" component={LoginScreen} />
			<AuthStack.Screen name="SignUp" component={SignUpScreen} />
			<AuthStack.Screen
				name="ForgotPassword"
				component={ForgotPasswordScreen}
			/>
		</AuthStack.Navigator>
	);
}

function HomeStack() {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				gestureResponseDistance: 50,
				transitionSpec: {
					open: {
						animation: 'timing',
						config: {
							duration: 150,
							easing: Easing.out(Easing.poly(4)),
						},
					},
					close: {
						animation: 'timing',
						config: {
							duration: 150,
							easing: Easing.out(Easing.poly(4)),
						},
					},
				},
				cardStyleInterpolator: ({ current, layouts }) => ({
					cardStyle: {
						transform: [
							{
								translateX: current.progress.interpolate({
									inputRange: [0, 1],
									outputRange: [layouts.screen.width, 0],
								}),
							},
						],
						backgroundColor: colors.light.background,
					},
					overlayStyle: { opacity: 0 },
				}),
			}}
		>
			<Stack.Screen name="HomeMain" component={HomeScreen} />
			<Stack.Screen name="BooksList" component={BooksListScreen} />
			<Stack.Screen name="Categories" component={CategoriesScreen} />
			<Stack.Screen name="BookDetail" component={BookDetailScreen} />
			<Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
		</Stack.Navigator>
	);
}

function ChatsStack() {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				gestureResponseDistance: 50,
				transitionSpec: {
					open: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
					close: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
				},
				cardStyleInterpolator: ({ current, layouts }) => ({
					cardStyle: {
						transform: [
							{
								translateX: current.progress.interpolate({
									inputRange: [0, 1],
									outputRange: [layouts.screen.width, 0],
								}),
							},
						],
						backgroundColor: colors.light.background,
					},
					overlayStyle: { opacity: 0 },
				}),
			}}
		>
			<Stack.Screen name="ChatsMain" component={ChatsScreen} />
			<Stack.Screen name="BookDetail" component={BookDetailScreen} />
			<Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
		</Stack.Navigator>
	);
}

function ProfileStack() {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				gestureResponseDistance: 50,
				transitionSpec: {
					open: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
					close: {
						animation: 'timing',
						config: {
							duration: 1,
							easing: Easing.linear,
						},
					},
				},
				cardStyleInterpolator: ({ current, layouts }) => ({
					cardStyle: {
						transform: [
							{
								translateX: current.progress.interpolate({
									inputRange: [0, 1],
									outputRange: [layouts.screen.width, 0],
								}),
							},
						],
						backgroundColor: colors.light.background,
					},
					overlayStyle: { opacity: 0 },
				}),
			}}
		>
			<Stack.Screen name="ProfileMain" component={ProfileScreen} />
			<Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
		</Stack.Navigator>
	);
}

function TabNavigator() {
	const insets = useSafeAreaInsets();

	return (
		<Tab.Navigator
			initialRouteName="Home"
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarIcon: ({ focused, color, size }) => {
					let iconName;

					if (route.name === 'Home') {
						iconName = focused ? 'home' : 'home-outline';
					} else if (route.name === 'Chats') {
						iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
					} else if (route.name === 'Discover') {
						iconName = focused ? 'search' : 'search-outline';
					} else if (route.name === 'Insights') {
						iconName = focused ? 'book' : 'book-outline';
					} else if (route.name === 'Profile') {
						iconName = focused ? 'person' : 'person-outline';
					}

					return (
						<Ionicons
							name={iconName}
							size={size}
							color={
								focused
									? colors.light.accentForeground
									: colors.light.mutedForeground
							}
						/>
					);
				},
				tabBarActiveTintColor: colors.light.muted,
				tabBarInactiveTintColor: colors.light.mutedForeground,
				tabBarStyle: {
					backgroundColor: colors.light.cardForeground,
					borderTopColor: colors.light.border,
					paddingTop: 10,
					paddingBottom: Math.max(insets.bottom, 10),
					height: 60 + Math.max(insets.bottom, 10),
				},
			})}
		>
			<Tab.Screen name="Home" component={HomeStack} />
			<Tab.Screen name="Chats" component={ChatsStack} />
			<Tab.Screen name="Discover" component={DiscoverScreen} />
			<Tab.Screen name="Insights" component={InsightsScreen} />
			<Tab.Screen name="Profile" component={ProfileStack} />
		</Tab.Navigator>
	);
}

export default function AppNavigator() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={colors.light.primary} />
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<NavigationContainer
				theme={{
					dark: false,
					colors: {
						primary: colors.light.primary,
						background: colors.light.background,
						card: colors.light.card,
						text: colors.light.foreground,
						border: colors.light.border,
						notification: colors.light.primary,
					},
				}}
			>
				<Stack.Navigator
					screenOptions={{
						headerShown: false,
						gestureEnabled: true,
						gestureDirection: 'horizontal',
						gestureResponseDistance: 50,
						transitionSpec: {
							open: {
								animation: 'timing',
								config: {
									duration: 1,
									easing: Easing.linear,
								},
							},
							close: {
								animation: 'timing',
								config: {
									duration: 1,
									easing: Easing.linear,
								},
							},
						},
						cardStyleInterpolator: ({ current, layouts }) => ({
							cardStyle: {
								transform: [
									{
										translateX: current.progress.interpolate({
											inputRange: [0, 1],
											outputRange: [layouts.screen.width, 0],
										}),
									},
								],
								backgroundColor: colors.light.background,
							},
							overlayStyle: { opacity: 0 },
						}),
					}}
				>
					{user ? (
						<Stack.Screen name="Main" component={TabNavigator} />
					) : (
						<Stack.Screen name="Auth" component={AuthNavigator} />
					)}
				</Stack.Navigator>
			</NavigationContainer>
		</GestureHandlerRootView>
	);
}
