import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import SosScreen from '../screens/SosScreen';
import EvidenceScreen from '../screens/EvidenceScreen';
import QRResolverScreen from '../screens/QRResolverScreen';

import DashboardScreen from '../screens/DashboardScreen';

export type RootStackParamList = {
    Home: undefined;
    SOS: undefined;
    Evidence: undefined;
    QRResolver: undefined;
    Dashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: COLORS.surface,
                        borderBottomWidth: 2,
                        borderBottomColor: COLORS.border,
                        elevation: 0,
                        shadowOpacity: 0,
                    } as any,
                    headerTintColor: COLORS.white,
                    headerTitleStyle: {
                        fontWeight: '900',
                        fontSize: 14,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                    } as any,
                    cardStyle: { backgroundColor: COLORS.bg },
                    headerBackTitleVisible: false,
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SOS"
                    component={SosScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Evidence"
                    component={EvidenceScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="QRResolver"
                    component={QRResolverScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
