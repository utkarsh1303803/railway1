import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import SosScreen from '../screens/SosScreen';
import EvidenceScreen from '../screens/EvidenceScreen';
import QRResolverScreen from '../screens/QRResolverScreen';

export type RootStackParamList = {
    Home: undefined;
    SOS: undefined;
    Evidence: undefined;
    QRResolver: undefined;
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
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                    } as any,
                    headerTintColor: COLORS.white,
                    headerTitleStyle: {
                        fontWeight: '700',
                        fontSize: 18,
                        letterSpacing: 0.5,
                    },
                    cardStyle: { backgroundColor: COLORS.bg },
                    headerBackTitleVisible: false,
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'RailRakshak' }}
                />
                <Stack.Screen
                    name="SOS"
                    component={SosScreen}
                    options={{ title: 'Manual SOS' }}
                />
                <Stack.Screen
                    name="Evidence"
                    component={EvidenceScreen}
                    options={{ title: 'Evidence Complaint' }}
                />
                <Stack.Screen
                    name="QRResolver"
                    component={QRResolverScreen}
                    options={{ title: 'Seat QR Resolver' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
