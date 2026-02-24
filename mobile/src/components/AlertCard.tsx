import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOW } from '../constants/theme';

export type AlertStatus = 'active' | 'escalated' | 'resolved' | 'pending';
export type AlertType = 'harassment' | 'theft' | 'antisocial' | 'overcrowding' | 'sos' | 'other';

type Props = {
    coach: string;
    seat: string;
    type: AlertType;
    status: AlertStatus;
    timestamp?: string;
    style?: ViewStyle;
    index?: number; // for stagger delay
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'ACTIVE', color: '#FF6B35', bg: '#FF6B3520' },
    escalated: { label: 'ESCALATED', color: COLORS.accent, bg: `${COLORS.accent}22` },
    resolved: { label: 'RESOLVED', color: COLORS.success, bg: `${COLORS.success}20` },
    pending: { label: 'PENDING', color: COLORS.warning, bg: `${COLORS.warning}20` },
};

const TYPE_CONFIG: Record<AlertType, { label: string; icon: string; color: string }> = {
    harassment: { label: 'Harassment / Eve Teasing', icon: '⚠️', color: COLORS.accent },
    theft: { label: 'Theft / Robbery', icon: '🔓', color: COLORS.warning },
    antisocial: { label: 'Anti-Social Behaviour', icon: '🚫', color: '#FF6B35' },
    overcrowding: { label: 'Overcrowding', icon: '👥', color: '#AB47BC' },
    sos: { label: 'Emergency SOS', icon: '🚨', color: COLORS.accent },
    other: { label: 'Other Safety Issue', icon: 'ℹ️', color: COLORS.primary },
};

export default function AlertCard({
    coach,
    seat,
    type,
    status,
    timestamp,
    style,
    index = 0,
}: Props) {
    const statusCfg = STATUS_CONFIG[status];
    const typeCfg = TYPE_CONFIG[type];

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 80).springify().damping(18)}
            style={[styles.card, { borderLeftColor: typeCfg.color }, style]}
        >
            {/* Top row: type icon + info + status badge */}
            <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: `${typeCfg.color}20` }]}>
                    <Text style={styles.icon}>{typeCfg.icon}</Text>
                </View>

                <View style={styles.info}>
                    <Text style={styles.typeLabel}>{typeCfg.label}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>Coach {coach}</Text>
                        </View>
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>Seat {seat}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
            </View>

            {/* Footer: timestamp */}
            {timestamp ? (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>🕐 {timestamp}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        padding: SPACING.md,
        ...SHADOW.card,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },

    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: { fontSize: 20 },

    info: { flex: 1 },
    typeLabel: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    metaRow: { flexDirection: 'row', gap: 6 },
    metaChip: {
        backgroundColor: `${COLORS.primary}30`,
        borderRadius: 6,
        paddingVertical: 2,
        paddingHorizontal: 8,
    },
    metaChipText: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    footer: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerText: {
        color: COLORS.muted,
        fontSize: 12,
    },
});
