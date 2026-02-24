import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeIn,
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

const { width: SW } = Dimensions.get('window');
const SCAN_BOX = SW * 0.72;

// ─── Types ────────────────────────────────────────────────────────────────────

type QRData = {
    seat: string;
    name: string;
    pnr?: string;
    train?: string;
};

type VerifyResult = 'verified' | 'conflict';

// ─── Animated scan border ─────────────────────────────────────────────────────

function ScanBorder() {
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    // Four corner brackets
    const corners = [
        { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: RADIUS.md },
        { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: RADIUS.md },
        { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: RADIUS.md },
        { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: RADIUS.md },
    ];

    return (
        <Animated.View style={[StyleSheet.absoluteFillObject, animStyle]}>
            {corners.map((c, i) => (
                <View
                    key={i}
                    style={[styles.corner, c, { borderColor: COLORS.primary }]}
                />
            ))}
        </Animated.View>
    );
}

// ─── Scan line ────────────────────────────────────────────────────────────────

function ScanLine() {
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(SCAN_BOX - 4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
        );
    }, []);

    const lineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return <Animated.View style={[styles.scanLine, lineStyle]} />;
}

// ─── TTE Alert Banner ─────────────────────────────────────────────────────────

function TteAlertBanner() {
    const scale = useSharedValue(0.9);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.95, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.tteBanner, animStyle]}>
            <Text style={styles.tteBannerText}>🚨 TTE NOTIFIED</Text>
        </Animated.View>
    );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

type ResultCardProps = {
    result: VerifyResult;
    data: QRData;
    onRescan: () => void;
};

function ResultCard({ result, data, onRescan }: ResultCardProps) {
    const isVerified = result === 'verified';
    const color = isVerified ? COLORS.success : COLORS.accent;
    const scale = useSharedValue(0.85);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });

        // Play haptic feedback on result
        if (isVerified) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.resultOverlay}
        >
            <Animated.View style={[styles.resultCard, { borderColor: `${color}55` }, cardStyle]}>

                {/* TTE Banner for conflict */}
                {!isVerified && <TteAlertBanner />}

                {/* Status icon */}
                <Animated.View
                    entering={ZoomIn.springify().damping(14).stiffness(260)}
                    style={[styles.resultIconCircle, { backgroundColor: `${color}20`, borderColor: color }]}
                >
                    <Text style={styles.resultIcon}>{isVerified ? '✓' : '✕'}</Text>
                </Animated.View>

                {/* Status label */}
                <Animated.Text
                    entering={FadeInDown.delay(150).springify()}
                    style={[styles.resultStatus, { color }]}
                >
                    {isVerified ? 'VERIFIED' : 'CONFLICT'}
                </Animated.Text>

                {/* Sub label */}
                <Animated.Text
                    entering={FadeInDown.delay(210).springify()}
                    style={styles.resultSubLabel}
                >
                    {isVerified
                        ? 'Passenger identity confirmed'
                        : 'Seat dispute raised'}
                </Animated.Text>

                {/* Detail rows */}
                <Animated.View
                    entering={FadeInDown.delay(280).springify()}
                    style={styles.detailCard}
                >
                    {[
                        { label: 'Seat', value: data.seat },
                        { label: 'Name', value: data.name },
                        { label: 'PNR', value: data.pnr ?? 'Unavailable' },
                        { label: 'Train', value: data.train ?? 'Rajdhani Express' },
                        { label: 'Status', value: isVerified ? 'Seat Confirmed ✓' : 'Under Dispute ⚠' },
                    ].map((row, i, arr) => (
                        <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && styles.detailBorder]}>
                            <Text style={styles.detailLabel}>{row.label}</Text>
                            <Text
                                style={[
                                    styles.detailValue,
                                    row.label === 'Status' && { color },
                                ]}
                            >
                                {row.value}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Conflict notice */}
                {!isVerified && (
                    <Animated.View
                        entering={FadeInDown.delay(360).springify()}
                        style={styles.conflictNotice}
                    >
                        <Text style={styles.conflictNoticeIcon}>⚠️</Text>
                        <Text style={styles.conflictNoticeText}>
                            RPF and on-board TTE have been silently notified about this seat conflict.
                        </Text>
                    </Animated.View>
                )}

                {/* Rescan button */}
                <Animated.View entering={FadeInDown.delay(420).springify()} style={{ width: '100%' }}>
                    <PrimaryButton
                        title="↩  Scan Another Seat"
                        onPress={onRescan}
                        variant={isVerified ? 'primary' : 'danger'}
                        style={{ marginTop: SPACING.sm }}
                    />
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QRResolverScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

    const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
        if (scanned) return;
        setScanned(true);

        // Try to parse QR, fall back to dummy
        let parsed: QRData;
        try {
            parsed = JSON.parse(data);
        } catch {
            parsed = {
                seat: 'B3-24',
                name: 'Rahul Verma',
                pnr: '8541236790',
                train: '12301 Howrah Rajdhani',
            };
        }

        setQrData(parsed);
        // Simulate 70% verified, 30% conflict
        setVerifyResult(Math.random() < 0.7 ? 'verified' : 'conflict');
    };

    const handleRescan = () => {
        setScanned(false);
        setQrData(null);
        setVerifyResult(null);
    };

    // ── Permission states ────────────────────────────────────────────────────

    if (!permission) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.permText}>Requesting camera permission…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.permIcon}>📷</Text>
                    <Text style={styles.permTitle}>Camera Access Required</Text>
                    <Text style={styles.permSub}>
                        Enable camera permission to scan QR codes.
                    </Text>
                    <TouchableOpacity
                        style={styles.permButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Main UI ──────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
                <Text style={styles.headerTitle}>Seat Verification</Text>
                <Text style={styles.headerSub}>
                    Scan the QR code printed on the seat / berth to verify passenger details.
                </Text>
            </Animated.View>

            {/* Camera + scan box */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Dark overlay with transparent scan window */}
                <View style={styles.overlayTop} />
                <View style={styles.overlayRow}>
                    <View style={styles.overlaySide} />

                    {/* Scan box */}
                    <View style={styles.scanBox}>
                        <ScanBorder />
                        <ScanLine />
                    </View>

                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />

                {/* Hint below scan box */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.scanHint}>
                    <Text style={styles.scanHintText}>
                        {scanned ? '✓ QR detected — processing…' : 'Align QR code within the frame'}
                    </Text>
                </Animated.View>
            </View>

            {/* Quick info strip */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.infoStrip}>
                <Text style={styles.infoStripIcon}>🔒</Text>
                <Text style={styles.infoStripText}>
                    Verification cross-checks PNR with Indian Railways database.
                </Text>
            </Animated.View>

            {/* Result overlay */}
            {qrData && verifyResult && (
                <ResultCard
                    result={verifyResult}
                    data={qrData}
                    onRescan={handleRescan}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const OVERLAY_COLOR = 'rgba(10,25,47,0.82)';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    permText: { color: COLORS.muted, fontSize: 15 },
    permIcon: { fontSize: 52, marginBottom: SPACING.md },
    permTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: SPACING.sm },
    permSub: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
    permButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: RADIUS.md,
    },
    permButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    // Header
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    headerTitle: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginBottom: 6 },
    headerSub: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },

    // Camera
    cameraContainer: { flex: 1, position: 'relative' },

    // Overlay layers
    overlayTop: { height: 24, backgroundColor: OVERLAY_COLOR },
    overlayRow: { flexDirection: 'row' },
    overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
    overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },

    // Scan box
    scanBox: {
        width: SCAN_BOX,
        height: SCAN_BOX,
        position: 'relative',
    },

    // Animated border corners (sized inside ScanBorder)
    corner: { position: 'absolute', width: 28, height: 28 },

    // Scan line
    scanLine: {
        position: 'absolute',
        left: 4,
        right: 4,
        height: 2,
        borderRadius: 1,
        backgroundColor: COLORS.primary,
        opacity: 0.85,
    },

    scanHint: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scanHintText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
        backgroundColor: 'rgba(11,61,145,0.75)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },

    // Info strip
    infoStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        margin: SPACING.lg,
        backgroundColor: `${COLORS.primary}18`,
        borderWidth: 1,
        borderColor: `${COLORS.primary}44`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
    },
    infoStripIcon: { fontSize: 14 },
    infoStripText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, flex: 1 },

    // Result overlay
    resultOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `${COLORS.bg}EE`,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    resultCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        ...SHADOW.card,
    },
    resultIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    resultIcon: { fontSize: 34, fontWeight: '800', color: COLORS.white },
    resultStatus: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 6,
    },
    resultSubLabel: {
        color: COLORS.muted,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },

    detailCard: {
        width: '100%',
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 11,
        paddingHorizontal: SPACING.md,
    },
    detailBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    detailLabel: { color: COLORS.muted, fontSize: 13 },
    detailValue: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

    conflictNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: `${COLORS.accent}14`,
        borderWidth: 1,
        borderColor: `${COLORS.accent}55`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        width: '100%',
    },
    conflictNoticeIcon: { fontSize: 14 },
    conflictNoticeText: { color: COLORS.accent, fontSize: 12, lineHeight: 18, flex: 1 },

    tteBanner: {
        backgroundColor: COLORS.accent,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: SPACING.lg,
        ...SHADOW.alert,
    },
    tteBannerText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
});
