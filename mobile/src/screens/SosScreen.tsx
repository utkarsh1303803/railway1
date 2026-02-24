import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeOutDown,
    FadeIn,
    FadeOut,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';
import Dropdown, { DropdownOption } from '../components/Dropdown';
import { sendSOS } from '../services/api';

// ─── Static data ──────────────────────────────────────────────────────────────

const COACH_OPTIONS: DropdownOption[] = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
].map((c) => ({ label: c, value: c }));

const SEAT_OPTIONS: DropdownOption[] = Array.from({ length: 72 }, (_, i) => ({
    label: `Seat ${i + 1}`,
    value: String(i + 1),
}));

const INCIDENT_OPTIONS: DropdownOption[] = [
    { label: '💰  Vendor Overpricing', value: 'vendor_overpricing' },
    { label: '⚠️   Harassment', value: 'harassment' },
    { label: '🏥  Medical Emergency', value: 'medical_emergency' },
    { label: '🔓  Theft', value: 'theft' },
];

const getIncidentLabel = (v: string) =>
    INCIDENT_OPTIONS.find((o) => o.value === v)?.label.replace(/^\S+\s+/, '') ?? v;

// ─── Pulsing ring ─────────────────────────────────────────────────────────────

function PulseRing({ color }: { color: string }) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.7, { duration: 900, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 0 }),
            ),
            -1,
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
                withTiming(0.8, { duration: 0 }),
            ),
            -1,
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[styles.pulseRing, { borderColor: color }, style]}
        />
    );
}

// ─── Animated check icon ─────────────────────────────────────────────────────

function AnimatedCheck() {
    const scale = useSharedValue(0);
    const rotate = useSharedValue('-45deg');

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        rotate.value = withSpring('0deg', { damping: 14, stiffness: 180 });
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: rotate.value }],
    }));

    return (
        <Animated.View style={[styles.checkCircle, iconStyle]}>
            <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
    );
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownBar({ duration }: { duration: number }) {
    const width = useSharedValue(100);

    useEffect(() => {
        width.value = withTiming(0, { duration, easing: Easing.linear });
    }, []);

    const barStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View style={styles.countdownTrack}>
            <Animated.View style={[styles.countdownFill, barStyle]} />
        </View>
    );
}

// ─── Success Card ─────────────────────────────────────────────────────────────

type SuccessProps = {
    alertId: string;
    coach: string;
    seat: string;
    incident: string;
    countdown: number;
};

function SuccessCard({ alertId, coach, seat, incident, countdown }: SuccessProps) {
    return (
        <Animated.View
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(250)}
            style={styles.successOverlay}
        >
            <Animated.View
                entering={ZoomIn.springify().damping(16).stiffness(260)}
                style={styles.successCard}
            >
                {/* Icon */}
                <View style={styles.iconOuter}>
                    <PulseRing color={COLORS.success} />
                    <AnimatedCheck />
                </View>

                {/* Alert ID */}
                <Animated.Text
                    entering={FadeInDown.delay(200).springify()}
                    style={styles.successAlertId}
                >
                    Alert #{alertId.slice(-6).toUpperCase()}
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(280).springify()}
                    style={styles.successSentLabel}
                >
                    SENT TO RPF / GRP
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(340).springify()}
                    style={styles.successSub}
                >
                    Help is being dispatched.{'\n'}Stay calm and stay visible.
                </Animated.Text>

                {/* Detail rows */}
                <Animated.View
                    entering={FadeInDown.delay(420).springify()}
                    style={styles.detailCard}
                >
                    {[
                        { label: 'Coach', value: coach },
                        { label: 'Seat', value: seat },
                        { label: 'Incident', value: incident },
                        { label: 'Status', value: 'Pending ✓' },
                    ].map((row, i) => (
                        <View
                            key={row.label}
                            style={[styles.detailRow, i < 3 && styles.detailBorder]}
                        >
                            <Text style={styles.detailLabel}>{row.label}</Text>
                            <Text
                                style={[
                                    styles.detailValue,
                                    row.label === 'Status' && { color: COLORS.success },
                                ]}
                            >
                                {row.value}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Auto-reset countdown */}
                <Animated.View
                    entering={FadeInDown.delay(550).springify()}
                    style={styles.countdownSection}
                >
                    <Text style={styles.countdownLabel}>
                        Form resets in {countdown}s
                    </Text>
                    <CountdownBar duration={3000} />
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SosScreen() {
    const [coach, setCoach] = useState('');
    const [seat, setSeat] = useState('');
    const [incident, setIncident] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [alertData, setAlertData] = useState<{
        id: string; coach: string; seat: string; incident: string;
    } | null>(null);
    const [countdown, setCountdown] = useState(3);

    // Auto-reset after 3 s when success card is shown
    useEffect(() => {
        if (!alertData) return;

        setCountdown(3);
        const tick = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(tick);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        const reset = setTimeout(() => {
            setAlertData(null);
            setCoach('');
            setSeat('');
            setIncident('');
            setErrorMsg('');
        }, 3000);

        return () => {
            clearInterval(tick);
            clearTimeout(reset);
        };
    }, [alertData]);

    const validate = () => {
        if (!coach) { setErrorMsg('Please select a coach.'); return false; }
        if (!seat) { setErrorMsg('Please select a seat number.'); return false; }
        if (!incident) { setErrorMsg('Please select the incident type.'); return false; }
        setErrorMsg('');
        return true;
    };

    const handleSend = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const docRef = await sendSOS({
                coachNumber: coach,
                seatNumber: seat,
                type: 'SOS',
                incidentType: incident,
            });

            setAlertData({
                id: docRef.id,
                coach,
                seat,
                incident: getIncidentLabel(incident),
            });
        } catch (err) {
            setErrorMsg('Failed to send alert. Please check your connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
                    <View style={styles.headerIconWrap}>
                        <Text style={styles.headerIcon}>🚨</Text>
                    </View>
                    <Text style={styles.headerTitle}>Emergency Alert</Text>
                    <Text style={styles.headerSub}>
                        Your alert is sent silently to RPF and GRP.{'\n'}
                        Misuse is punishable under IPC Section 182.
                    </Text>
                </Animated.View>

                {/* Warning */}
                <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.warningBanner}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>Only use in genuine emergencies.</Text>
                </Animated.View>

                {/* Form */}
                <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.formCard}>
                    <Dropdown
                        label="Coach Number"
                        placeholder="Select coach..."
                        options={COACH_OPTIONS}
                        value={coach}
                        onChange={setCoach}
                    />
                    <Dropdown
                        label="Seat Number"
                        placeholder="Select seat..."
                        options={SEAT_OPTIONS}
                        value={seat}
                        onChange={setSeat}
                    />
                    <Dropdown
                        label="Incident Type"
                        placeholder="Select incident type..."
                        options={INCIDENT_OPTIONS}
                        value={incident}
                        onChange={setIncident}
                    />
                </Animated.View>

                {/* Validation error */}
                {errorMsg ? (
                    <Animated.View
                        entering={FadeInDown.springify()}
                        exiting={FadeOutDown.duration(200)}
                        style={styles.errorBox}
                    >
                        <Text style={styles.errorIcon}>✕</Text>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </Animated.View>
                ) : null}

                {/* CTA */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <PrimaryButton
                        title={loading ? 'Sending...' : '🚨   SEND ALERT'}
                        onPress={handleSend}
                        variant="danger"
                        loading={loading}
                        style={styles.ctaBtn}
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Text style={styles.disclaimer}>
                        Alert is timestamped and geo-tagged automatically.{'\n'}
                        Response time target: under 5 minutes.
                    </Text>
                </Animated.View>
            </ScrollView>

            {/* Success overlay — rendered above scroll content */}
            {alertData && (
                <SuccessCard
                    alertId={alertData.id}
                    coach={alertData.coach}
                    seat={alertData.seat}
                    incident={alertData.incident}
                    countdown={countdown}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: 56 },

    header: { alignItems: 'center', marginBottom: SPACING.lg, paddingTop: SPACING.sm },
    headerIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${COLORS.accent}22`,
        borderWidth: 2,
        borderColor: `${COLORS.accent}88`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    headerIcon: { fontSize: 34 },
    headerTitle: {
        color: COLORS.white,
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginBottom: SPACING.sm,
    },
    headerSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },

    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: `${COLORS.warning}14`,
        borderWidth: 1,
        borderColor: `${COLORS.warning}55`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    warningIcon: { fontSize: 16 },
    warningText: { color: COLORS.warning, fontSize: 13, fontWeight: '600', flex: 1 },

    formCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.card,
    },

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: `${COLORS.accent}18`,
        borderWidth: 1,
        borderColor: `${COLORS.accent}66`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    errorIcon: { color: COLORS.accent, fontSize: 14, fontWeight: '800' },
    errorText: { color: COLORS.accent, fontSize: 13, fontWeight: '600', flex: 1 },

    ctaBtn: { minHeight: 60 },
    disclaimer: {
        color: COLORS.muted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: SPACING.md,
        lineHeight: 19,
    },

    // ── Success overlay ───────────────────────────────────────
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `${COLORS.bg}EE`,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    successCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${COLORS.success}44`,
        ...SHADOW.card,
    },

    // Check icon
    iconOuter: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
    },
    checkCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: `${COLORS.success}22`,
        borderWidth: 2,
        borderColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkMark: {
        color: COLORS.success,
        fontSize: 32,
        fontWeight: '800',
    },

    successAlertId: {
        color: COLORS.success,
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    successSentLabel: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 3,
        marginBottom: SPACING.md,
    },
    successSub: {
        color: COLORS.muted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.lg,
    },

    detailCard: {
        width: '100%',
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.lg,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: SPACING.md,
    },
    detailBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    detailLabel: { color: COLORS.muted, fontSize: 13 },
    detailValue: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

    // Countdown
    countdownSection: { width: '100%', alignItems: 'center', gap: 8 },
    countdownLabel: { color: COLORS.muted, fontSize: 12 },
    countdownTrack: {
        width: '100%',
        height: 3,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    countdownFill: {
        height: 3,
        backgroundColor: COLORS.success,
        borderRadius: 2,
    },
});
