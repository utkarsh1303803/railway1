import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

type Feature = {
    id: keyof RootStackParamList;
    icon: string;
    title: string;
    subtitle: string;
    color: string;
    danger?: boolean;
};

const FEATURES: Feature[] = [
    {
        id: 'SOS',
        icon: '🚨',
        title: 'Manual SOS',
        subtitle: 'Emergency alert to RPF / GRP',
        color: COLORS.accent,
        danger: true,
    },
    {
        id: 'Evidence',
        icon: '📷',
        title: 'Evidence Complaint',
        subtitle: 'Record & submit with photo/video',
        color: '#1565C0',
    },
    {
        id: 'QRResolver',
        icon: '🔍',
        title: 'Seat QR Resolver',
        subtitle: 'Scan seat QR to view / file complaint',
        color: '#00695C',
    },
    {
        id: 'Home',
        icon: '📊',
        title: 'RPF Dashboard',
        subtitle: 'Live alerts with escalation timer',
        color: '#4527A0',
    },
];

export default function HomeScreen() {
    const navigation = useNavigation<Nav>();

    const handlePress = (id: keyof RootStackParamList) => {
        if (id === 'Home') return; // Dashboard placeholder
        navigation.navigate(id as any);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>🛡️ Indian Railways Safety App</Text>
                    </View>
                    <Text style={styles.title}>RailRakshak</Text>
                    <Text style={styles.subtitle}>
                        Your silent guardian on every journey.{'\n'}Report. Resolve. Stay Safe.
                    </Text>
                </Animated.View>

                {/* Status bar */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statusBar}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>System Active · RPF Connected</Text>
                </Animated.View>

                {/* Feature grid */}
                <View style={styles.grid}>
                    {FEATURES.map((feat, idx) => (
                        <Animated.View
                            key={feat.id + idx}
                            entering={FadeInDown.delay(300 + idx * 100).springify()}
                            style={[styles.cardWrapper, feat.danger && styles.cardDanger]}
                        >
                            <TouchableOpacity
                                style={[styles.card, { borderTopColor: feat.color }]}
                                onPress={() => handlePress(feat.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: `${feat.color}22` }]}>
                                    <Text style={styles.icon}>{feat.icon}</Text>
                                </View>
                                <Text style={styles.cardTitle}>{feat.title}</Text>
                                <Text style={styles.cardSubtitle}>{feat.subtitle}</Text>
                                {feat.danger && (
                                    <View style={styles.urgentBadge}>
                                        <Text style={styles.urgentText}>EMERGENCY</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.delay(750).springify()} style={styles.footer}>
                    <Text style={styles.footerText}>
                        Developed for Indian Railways · MoR Hackathon 2025
                    </Text>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

    header: { marginBottom: SPACING.lg, alignItems: 'center' },
    badge: {
        backgroundColor: `${COLORS.primary}33`,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginBottom: SPACING.md,
    },
    badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    title: {
        color: COLORS.white,
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        color: COLORS.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: SPACING.sm,
    },

    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: `${COLORS.success}18`,
        borderWidth: 1,
        borderColor: `${COLORS.success}44`,
        borderRadius: RADIUS.md,
        paddingVertical: 10,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xl,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    statusText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },

    grid: { gap: SPACING.md },
    cardWrapper: { borderRadius: RADIUS.lg, ...SHADOW.card },
    cardDanger: {
        shadowColor: COLORS.accent,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderTopWidth: 3,
        borderColor: COLORS.border,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    icon: { fontSize: 24 },
    cardTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        color: COLORS.muted,
        fontSize: 13,
        lineHeight: 18,
    },
    urgentBadge: {
        alignSelf: 'flex-start',
        backgroundColor: `${COLORS.accent}22`,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderRadius: 8,
        paddingVertical: 3,
        paddingHorizontal: 10,
        marginTop: SPACING.sm,
    },
    urgentText: {
        color: COLORS.accent,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    footer: { alignItems: 'center', marginTop: SPACING.xl },
    footerText: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
});
