import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
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
        id: 'Dashboard',
        icon: '📊',
        title: 'RPF DASHBOARD',
        subtitle: 'LIVE ALERTS WITH ESCALATION TIMER',
        color: '#4527A0',
    },
];

export default function HomeScreen() {
    const navigation = useNavigation<Nav>();

    const handlePress = (id: keyof RootStackParamList) => {
        console.log(`[HomeScreen] Navigating to: ${id}`);
        navigation.navigate(id as any);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* System Header */}
            <View style={styles.systemHeader}>
                <View>
                    <Text style={styles.systemTitle}>RAILRAKSHAK</Text>
                    <Text style={styles.systemSub}>RAILWAY SAFETY CONTROL SYSTEM</Text>
                </View>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* Status Strip */}
            <View style={styles.statusStrip}>
                <Text style={styles.statusItem}>RPF_LINK: ACTIVE</Text>
                <Text style={styles.statusSep}>|</Text>
                <Text style={styles.statusItem}>ENCRYPTION: AES-256</Text>
                <Text style={styles.statusSep}>|</Text>
                <Text style={styles.statusItem}>GPS: LOCKED</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Module Grid */}
                {FEATURES.map((feat, idx) => (
                    <TouchableOpacity
                        key={feat.id + idx}
                        style={[
                            styles.moduleCard,
                            feat.danger && styles.dangerCard,
                        ]}
                        onPress={() => handlePress(feat.id)}
                        activeOpacity={0.85}
                    >
                        {/* Left accent bar */}
                        <View style={[styles.accentBar, { backgroundColor: feat.color }]} />

                        <View style={styles.moduleBody}>
                            {/* Top row: icon + title */}
                            <View style={styles.moduleTop}>
                                <Text style={styles.moduleIcon}>{feat.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.moduleTitle}>{feat.title.toUpperCase()}</Text>
                                    <Text style={styles.moduleSubtitle}>{feat.subtitle.toUpperCase()}</Text>
                                </View>
                                {feat.danger && (
                                    <View style={styles.emergencyTag}>
                                        <Text style={styles.emergencyTagText}>CRITICAL</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Right arrow indicator */}
                        <View style={styles.arrowWrap}>
                            <Text style={[styles.arrowText, { color: feat.color }]}>▶</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    INDIAN RAILWAYS · MINISTRY OF RAILWAYS · HACKATHON 2025
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },

    systemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    systemTitle: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
    },
    systemSub: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${COLORS.success}22`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    liveText: {
        color: COLORS.success,
        fontSize: 11,
        fontWeight: '900',
    },

    statusStrip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 6,
    },
    statusItem: {
        color: COLORS.muted,
        fontSize: 9,
        fontWeight: '800',
    },
    statusSep: {
        color: COLORS.border,
        fontSize: 9,
    },

    scroll: { flex: 1 },
    content: {
        padding: SPACING.md,
        paddingTop: SPACING.lg,
        gap: SPACING.md,
    },

    moduleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 100,
        overflow: 'hidden',
    },
    dangerCard: {
        borderColor: COLORS.accent,
        borderWidth: 2,
    },
    accentBar: {
        width: 6,
    },
    moduleBody: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
    },
    moduleTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    moduleIcon: {
        fontSize: 28,
    },
    moduleTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    moduleSubtitle: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    emergencyTag: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    emergencyTagText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    arrowWrap: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },
    arrowText: {
        fontSize: 16,
        fontWeight: '900',
    },

    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    footerText: {
        color: COLORS.muted,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
