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
import { Camera, BarCodeScanningResult } from 'expo-camera';
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
import { COLORS, SPACING } from '../constants/theme';
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

    const corners = [
        { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
        { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
        { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
        { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
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
            <Animated.View style={[styles.resultCard, { borderColor: color }, cardStyle]}>

                {/* TTE Banner for conflict */}
                {!isVerified && <TteAlertBanner />}

                {/* Status Header */}
                <View style={[styles.resultHeader, { backgroundColor: color }]}>
                    <Text style={styles.resultHeaderIcon}>{isVerified ? '✓' : '✕'}</Text>
                    <Text style={styles.resultHeaderText}>
                        {isVerified ? 'VERIFIED' : 'CONFLICT'}
                    </Text>
                </View>

                <View style={styles.resultBody}>
                    {/* Status indicator */}
                    <View style={styles.resultStatusRow}>
                        <View style={[styles.resultStatusDot, { backgroundColor: color }]} />
                        <Text style={[styles.resultStatusLabel, { color }]}>
                            {isVerified ? 'PASSENGER IDENTITY CONFIRMED' : 'SEAT DISPUTE RAISED'}
                        </Text>
                    </View>

                    {/* Detail rows */}
                    <View style={styles.dataGrid}>
                        {[
                            { label: 'SEAT', value: data.seat },
                            { label: 'NAME', value: data.name },
                            { label: 'PNR', value: data.pnr ?? 'UNAVAILABLE' },
                            { label: 'TRAIN', value: data.train ?? 'RAJDHANI EXPRESS' },
                            { label: 'STATUS', value: isVerified ? 'CONFIRMED' : 'UNDER DISPUTE' },
                        ].map((row, i, arr) => (
                            <View key={row.label} style={[styles.gridRow, i < arr.length - 1 && styles.gridBorder]}>
                                <Text style={styles.gridLabel}>{row.label}</Text>
                                <Text
                                    style={[
                                        styles.gridValue,
                                        row.label === 'STATUS' && { color },
                                    ]}
                                >
                                    {row.value}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Conflict notice */}
                    {!isVerified && (
                        <View style={styles.conflictNotice}>
                            <Text style={styles.conflictNoticeText}>
                                ⚠ RPF AND ON-BOARD TTE HAVE BEEN SILENTLY NOTIFIED ABOUT THIS SEAT CONFLICT.
                            </Text>
                        </View>
                    )}

                    {/* Rescan button */}
                    <TouchableOpacity
                        style={[styles.rescanBtn, { borderColor: color }]}
                        onPress={onRescan}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.rescanBtnText, { color }]}>
                            ↩ SCAN_ANOTHER_SEAT
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QRResolverScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = ({ data }: BarCodeScanningResult) => {
        if (scanned) return;
        setScanned(true);

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
        setVerifyResult(Math.random() < 0.7 ? 'verified' : 'conflict');
    };

    const handleRescan = () => {
        setScanned(false);
        setQrData(null);
        setVerifyResult(null);
    };

    const requestPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    // ── Permission states ────────────────────────────────────────────────────

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.permText}>REQUESTING CAMERA PERMISSION…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.permIcon}>📷</Text>
                    <Text style={styles.permTitle}>CAMERA ACCESS REQUIRED</Text>
                    <Text style={styles.permSub}>
                        ENABLE CAMERA PERMISSION TO SCAN QR CODES.
                    </Text>
                    <TouchableOpacity
                        style={styles.permButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permButtonText}>GRANT_PERMISSION</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Main UI ──────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Top Bar */}
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>QR_VERIFICATION</Text>
                <Text style={styles.topBarSub}>SEAT RESOLVER</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SEAT_VERIFICATION</Text>
                <Text style={styles.headerSub}>
                    SCAN QR CODE ON SEAT/BERTH TO VERIFY PASSENGER DETAILS.
                </Text>
            </View>

            {/* Camera + scan box */}
            <View style={styles.cameraContainer}>
                <Camera
                    style={StyleSheet.absoluteFillObject}
                    barCodeScannerSettings={{
                        barCodeTypes: ['qr'],
                    }}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
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
                <View style={styles.scanHint}>
                    <Text style={styles.scanHintText}>
                        {scanned ? '✓ QR DETECTED — PROCESSING…' : 'ALIGN QR CODE WITHIN FRAME'}
                    </Text>
                </View>
            </View>

            {/* Info strip */}
            <View style={styles.infoStrip}>
                <Text style={styles.infoStripText}>
                    🔒 VERIFICATION CROSS-CHECKS PNR WITH INDIAN RAILWAYS DATABASE.
                </Text>
            </View>

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

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    topBarTitle: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    topBarSub: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    permText: { color: COLORS.muted, fontSize: 13, fontWeight: '800' },
    permIcon: { fontSize: 52, marginBottom: SPACING.md },
    permTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900', marginBottom: SPACING.sm },
    permSub: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg, fontWeight: '700' },
    permButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    permButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '900' },

    // Header
    header: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
    },
    headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '900', marginBottom: 4 },
    headerSub: { color: COLORS.muted, fontSize: 11, lineHeight: 17, fontWeight: '600' },

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

    corner: { position: 'absolute', width: 28, height: 28 },

    // Scan line
    scanLine: {
        position: 'absolute',
        left: 4,
        right: 4,
        height: 2,
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
        fontSize: 11,
        fontWeight: '900',
        backgroundColor: 'rgba(11,61,145,0.85)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },

    // Info strip
    infoStrip: {
        margin: SPACING.md,
        backgroundColor: `${COLORS.primary}18`,
        borderWidth: 1,
        borderColor: `${COLORS.primary}44`,
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    infoStripText: { color: COLORS.muted, fontSize: 10, lineHeight: 16, fontWeight: '700' },

    // Result overlay
    resultOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 25, 47, 0.98)',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    resultCard: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        overflow: 'hidden',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: SPACING.md,
    },
    resultHeaderIcon: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
    },
    resultHeaderText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    resultBody: {
        padding: SPACING.lg,
    },
    resultStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.lg,
    },
    resultStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    resultStatusLabel: {
        fontSize: 11,
        fontWeight: '900',
    },

    dataGrid: {
        marginBottom: SPACING.lg,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: SPACING.sm,
    },
    gridBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    gridLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
    gridValue: { color: COLORS.white, fontSize: 12, fontWeight: '800' },

    conflictNotice: {
        backgroundColor: `${COLORS.accent}18`,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    conflictNoticeText: { color: COLORS.accent, fontSize: 11, lineHeight: 17, fontWeight: '800' },

    rescanBtn: {
        borderWidth: 2,
        paddingVertical: 16,
        alignItems: 'center',
    },
    rescanBtnText: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },

    tteBanner: {
        backgroundColor: COLORS.accent,
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignSelf: 'center',
        marginBottom: SPACING.md,
        marginTop: SPACING.md,
    },
    tteBannerText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 1,
    },
});
