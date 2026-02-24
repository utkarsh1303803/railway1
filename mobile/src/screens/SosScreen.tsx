import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    FadeInDown,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';
import Dropdown, { DropdownOption } from '../components/Dropdown';
import { sendSOS } from '../services/api';

// ─── Static data ──────────────────────────────────────────────────────────────

const COACH_OPTIONS: DropdownOption[] = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
].map((c) => ({ label: c, value: c }));

const SEAT_OPTIONS: DropdownOption[] = Array.from({ length: 72 }, (_, i) => ({
    label: `SEAT ${i + 1}`,
    value: String(i + 1),
}));

const INCIDENT_OPTIONS: DropdownOption[] = [
    { label: 'VENDOR OVERPRICING', value: 'vendor_overpricing' },
    { label: 'HARASSMENT', value: 'harassment' },
    { label: 'MEDICAL EMERGENCY', value: 'medical_emergency' },
    { label: 'THEFT', value: 'theft' },
];

const getIncidentLabel = (v: string) =>
    INCIDENT_OPTIONS.find((o) => o.value === v)?.label ?? v;

// ─── Industrial Components ───────────────────────────────────────────────────

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
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.successOverlay}
        >
            <View style={styles.successContainer}>
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={styles.successHeader}
                >
                    <Text style={styles.successTitleText}>ALERT ACTIVE</Text>
                    <Text style={styles.successIdText}>ID: {alertId.slice(-8).toUpperCase()}</Text>
                </Animated.View>

                <View style={styles.successBody}>
                    <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>TRANSMISSION SUCCESSFUL</Text>
                    </View>

                    <View style={styles.dataGrid}>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>LOCATION</Text>
                            <Text style={styles.gridValue}>{coach} / {seat}</Text>
                        </View>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>CATEGORY</Text>
                            <Text style={styles.gridValue}>{incident}</Text>
                        </View>
                        <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.gridLabel}>RESPONDER</Text>
                            <Text style={styles.gridValue}>RPF DISPATCHED</Text>
                        </View>
                    </View>

                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>
                            SYSTEM IS MONITORING YOUR LOCATION.
                            {"\n"}REMAIN CALM. HELP IS EN ROUTE.
                        </Text>
                    </View>
                </View>

                <View style={styles.successFooter}>
                    <Text style={styles.resetText}>AUTO-RESET IN {countdown}S</Text>
                    <CountdownBar duration={3000} />
                </View>
            </View>
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

    useEffect(() => {
        if (!alertData) return;

        setCountdown(3);
        const tick = setInterval(() => {
            setCountdown((c) => (c <= 1 ? 0 : c - 1));
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
        if (!coach) { setErrorMsg('REQUIRED: COACH NUMBER'); return false; }
        if (!seat) { setErrorMsg('REQUIRED: SEAT NUMBER'); return false; }
        if (!incident) { setErrorMsg('REQUIRED: INCIDENT TYPE'); return false; }
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
            setErrorMsg('LINK FAILURE: CHECK NETWORK CONNECTION');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Top Bar */}
            <View style={styles.topBar}>
                <Text style={styles.systemTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                <Text style={styles.moduleName}>EMERGENCY_MODULE_V1</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Information */}
                <View style={styles.headerInfo}>
                    <Text style={styles.mainHeading}>SOS_SILENT_DISPATCH</Text>
                    <Text style={styles.subHeading}>
                        ENCRYPTED LINK TO RAILWAY PROTECTION FORCE (RPF).
                        {"\n"}AUTOMATIC TRACKING ENABLED.
                    </Text>
                </View>

                {/* Hazard Banner */}
                <View style={styles.hazardBanner}>
                    <View style={styles.hazardStrip} />
                    <View style={styles.hazardContent}>
                        <Text style={styles.hazardTitle}>WARNING: EMERGENCY USE ONLY</Text>
                        <Text style={styles.hazardSub}>MISUSE IS SUBJECT TO IPC SECTION 182</Text>
                    </View>
                    <View style={styles.hazardStrip} />
                </View>

                {/* Data Input Grid */}
                <View style={styles.inputGrid}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Dropdown
                                label="COACH"
                                placeholder="VAL_"
                                options={COACH_OPTIONS}
                                value={coach}
                                onChange={setCoach}
                            />
                        </View>
                        <View style={styles.col}>
                            <Dropdown
                                label="SEAT"
                                placeholder="VAL_"
                                options={SEAT_OPTIONS}
                                value={seat}
                                onChange={setSeat}
                            />
                        </View>
                    </View>

                    <View style={styles.fullCol}>
                        <Dropdown
                            label="INCIDENT_CATEGORY"
                            placeholder="SELECT_CATEGORY..."
                            options={INCIDENT_OPTIONS}
                            value={incident}
                            onChange={setIncident}
                        />
                    </View>
                </View>

                {/* Error Display */}
                {errorMsg ? (
                    <Animated.View entering={FadeInDown} style={styles.errorBanner}>
                        <Text style={styles.errorText}>[ ERROR: {errorMsg} ]</Text>
                    </Animated.View>
                ) : (
                    <View style={styles.idleSpacer} />
                )}

                {/* Dispatch Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSend}
                    disabled={loading}
                    style={[styles.dispatchBtn, loading && styles.btnLoading]}
                >
                    <Text style={styles.btnText}>
                        {loading ? "INITIALIZING..." : "SEND_SOS_ALERT"}
                    </Text>
                    {!loading && <View style={styles.btnSubBorder} />}
                </TouchableOpacity>

                <View style={styles.footerData}>
                    <Text style={styles.footerText}>GEOTAG: ENABLED</Text>
                    <Text style={styles.footerText}>SIGNAL_STRENGTH: OPTIMAL</Text>
                </View>
            </ScrollView>

            {/* Success State */}
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

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    systemTime: { color: COLORS.muted, fontSize: 10, fontWeight: '900' },
    moduleName: { color: COLORS.muted, fontSize: 10, fontWeight: '900' },

    scroll: { flex: 1 },
    content: { padding: SPACING.md, paddingTop: SPACING.lg },

    headerInfo: { marginBottom: SPACING.xl },
    mainHeading: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subHeading: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
        marginTop: 4,
    },

    hazardBanner: {
        backgroundColor: COLORS.warning,
        flexDirection: 'row',
        height: 60,
        marginBottom: SPACING.xl,
        overflow: 'hidden',
    },
    hazardStrip: {
        width: 12,
        backgroundColor: '#000',
        transform: [{ skewX: '-20deg' }],
        marginHorizontal: 4,
        opacity: 0.1,
    },
    hazardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hazardTitle: {
        color: '#000',
        fontSize: 14,
        fontWeight: '900',
    },
    hazardSub: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.8,
    },

    inputGrid: {
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    col: { flex: 1 },
    fullCol: { width: '100%' },

    errorBanner: {
        backgroundColor: `${COLORS.accent}22`,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.accent,
        marginBottom: SPACING.lg,
    },
    errorText: {
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
    },
    idleSpacer: { height: 20 },

    dispatchBtn: {
        backgroundColor: COLORS.accent,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    btnLoading: { backgroundColor: COLORS.muted },
    btnText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
    },
    btnSubBorder: {
        position: 'absolute',
        bottom: 8,
        width: '40%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    footerData: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.xl,
    },
    footerText: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '800',
    },

    // ── Success State ───────────────────────────────────────
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 25, 47, 0.98)',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    successContainer: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.success,
    },
    successHeader: {
        backgroundColor: COLORS.success,
        padding: SPACING.md,
        alignItems: 'center',
    },
    successTitleText: {
        color: '#000',
        fontSize: 20,
        fontWeight: '900',
    },
    successIdText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.8,
    },
    successBody: {
        padding: SPACING.lg,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.lg,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.success,
    },
    statusText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '900',
    },
    dataGrid: {
        gap: 12,
        marginBottom: SPACING.xl,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 8,
    },
    gridLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '700',
    },
    gridValue: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
    instructionBox: {
        backgroundColor: `${COLORS.success}11`,
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
    },
    instructionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
    },
    successFooter: {
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    resetText: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    countdownTrack: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.border,
    },
    countdownFill: {
        height: 6,
        backgroundColor: COLORS.success,
    },
});
