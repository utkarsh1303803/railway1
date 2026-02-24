import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    StatusBar,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    FadeInDown,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';

const { width: SW } = Dimensions.get('window');

// ─── Categories ───────────────────────────────────────────────────────────────

type Category = { id: string; label: string; icon: string; color: string };

const CATEGORIES: Category[] = [
    { id: 'overpricing', label: 'Overpricing', icon: '💰', color: '#F59E0B' },
    { id: 'dirty_coach', label: 'Dirty Coach', icon: '🧹', color: '#6366F1' },
    { id: 'staff_misconduct', label: 'Staff Misconduct', icon: '👮', color: '#EF4444' },
    { id: 'unauthorized_vendor', label: 'Unauthorized Vendor', icon: '🚫', color: '#10B981' },
];

const generateRef = () => 'RR' + Math.floor(100000 + Math.random() * 900000);

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastProps = { message: string; onDone: () => void };

function Toast({ message, onDone }: ToastProps) {
    const translateY = useSharedValue(-80);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 250 });

        const t = setTimeout(() => {
            translateY.value = withTiming(-80, { duration: 300, easing: Easing.in(Easing.ease) });
            opacity.value = withTiming(0, { duration: 280 }, (done) => {
                if (done) runOnJS(onDone)();
            });
        }, 2500);

        return () => clearTimeout(t);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.toast, animStyle]}>
            <View style={styles.toastDot} />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
}

// ─── Camera / Preview sheet body ─────────────────────────────────────────────

type SheetBodyProps = { category: Category; onClose: () => void };

function CameraSheetBody({ category, onClose }: SheetBodyProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const cameraRef = useRef<Camera>(null);

    type Phase = 'camera' | 'preview' | 'submitting';
    const [phase, setPhase] = useState<Phase>('camera');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [flashVisible, setFlashVisible] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleCapture = async () => {
        try {
            const photo = await cameraRef.current?.takePictureAsync({ quality: 0.75, skipProcessing: true });
            setFlashVisible(true);
            setTimeout(() => setFlashVisible(false), 180);
            if (photo?.uri) setPhotoUri(photo.uri);
            setPhase('preview');
        } catch {
            setPhase('preview');
        }
    };

    const handleRetake = () => {
        setPhotoUri(null);
        setPhase('camera');
    };

    const handleSubmit = () => {
        setPhase('submitting');
        setTimeout(onClose, 300);
    };

    const requestPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    if (!hasPermission) {
        return (
            <View style={styles.permBox}>
                <Text style={styles.permIcon}>📷</Text>
                <Text style={styles.permTitle}>CAMERA ACCESS REQUIRED</Text>
                <Text style={styles.permSub}>GRANT PERMISSION TO CAPTURE EVIDENCE.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
                    <Text style={styles.permBtnText}>GRANT_PERMISSION</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.permCancel}>
                    <Text style={styles.permCancelText}>CANCEL</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.sheetBody}>
            {/* Category indicator */}
            <View style={[styles.catTag, { borderLeftColor: category.color }]}>
                <Text style={styles.catTagIcon}>{category.icon}</Text>
                <Text style={styles.catTagText}>{category.label.toUpperCase()}</Text>
            </View>

            {/* ── CAMERA phase ── */}
            {phase === 'camera' && (
                <Animated.View entering={FadeIn.duration(250)} style={styles.cameraWrap}>
                    <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
                        {/* Viewfinder corners */}
                        {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((pos) => (
                            <View key={pos} style={[styles.bracket, styles[pos]]} />
                        ))}
                        {flashVisible && <View style={styles.captureFlash} />}
                    </Camera>

                    <View style={styles.captureRow}>
                        <Text style={styles.cameraHint}>POINT AT EVIDENCE — TAP CAPTURE</Text>
                        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* ── PREVIEW phase ── */}
            {phase === 'preview' && (
                <Animated.View entering={FadeIn.duration(280)} style={styles.previewSection}>
                    <View style={styles.previewWrap}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.previewImage, styles.previewPlaceholder]}>
                                <Text style={styles.previewPlaceholderIcon}>📷</Text>
                                <Text style={styles.previewPlaceholderText}>PHOTO CAPTURED</Text>
                            </View>
                        )}

                        <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.capturedBadge}>
                            <Text style={styles.capturedBadgeText}>✓ READY</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.previewBtns}>
                        <PrimaryButton
                            title="↩  RETAKE"
                            onPress={handleRetake}
                            variant="primary"
                            style={styles.halfBtn}
                        />
                        <PrimaryButton
                            title="SUBMIT →"
                            onPress={handleSubmit}
                            variant="danger"
                            style={styles.halfBtn}
                        />
                    </View>

                    <Text style={styles.previewDisclaimer}>
                        EVIDENCE ENCRYPTED AND GEOTAGGED BEFORE TRANSMISSION TO RPF.
                    </Text>
                </Animated.View>
            )}

            {/* ── SUBMITTING phase ── */}
            {phase === 'submitting' && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.submittingBox}>
                    <PrimaryButton title="TRANSMITTING..." onPress={() => { }} loading variant="primary" />
                </Animated.View>
            )}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EvidenceScreen() {
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const handleClose = useCallback(() => {
        setActiveCategory(null);
        setToastMsg(`COMPLAINT SUBMITTED · REF #${generateRef()}`);
    }, []);

    const handleCategoryPress = (cat: Category) => setActiveCategory(cat);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Toast */}
            {toastMsg && (
                <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
            )}

            {/* Top Bar */}
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>EVIDENCE_MODULE</Text>
                <Text style={styles.topBarSub}>CAPTURE + SUBMIT</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Info */}
                <View style={styles.headerInfo}>
                    <Text style={styles.mainHeading}>EVIDENCE_COMPLAINT</Text>
                    <Text style={styles.subHeading}>
                        SELECT INCIDENT TYPE. CAPTURE PHOTO EVIDENCE.{"\n"}SUBMIT DIRECTLY TO RPF CONTROL.
                    </Text>
                </View>

                {/* 2×2 Grid */}
                <View style={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => handleCategoryPress(cat)}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.cardAccent, { backgroundColor: cat.color }]} />
                            <View style={styles.cardBody}>
                                <Text style={styles.cardIcon}>{cat.icon}</Text>
                                <Text style={styles.cardLabel}>{cat.label.toUpperCase()}</Text>
                                <Text style={styles.cardCta}>FILE_COMPLAINT ▶</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info strip */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        🔒 ALL EVIDENCE IS ENCRYPTED AND GEOTAGGED BEFORE FORWARDING TO RPF.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom sheet modal */}
            <Modal
                visible={!!activeCategory}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => setActiveCategory(null)}
            >
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(180)}
                    style={StyleSheet.absoluteFill}
                >
                    <TouchableWithoutFeedback onPress={() => setActiveCategory(null)}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                {activeCategory && (
                    <Animated.View
                        entering={SlideInDown.springify().damping(22).stiffness(280)}
                        exiting={SlideOutDown.duration(220)}
                        style={styles.sheet}
                    >
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>CAPTURE_EVIDENCE</Text>
                            <TouchableOpacity onPress={() => setActiveCategory(null)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <CameraSheetBody
                            category={activeCategory}
                            onClose={handleClose}
                        />
                    </Animated.View>
                )}
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

    content: { padding: SPACING.md, paddingBottom: 48 },

    headerInfo: { marginBottom: SPACING.xl },
    mainHeading: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subHeading: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 17,
        marginTop: 4,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    card: {
        width: '47%',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 140,
        overflow: 'hidden',
    },
    cardAccent: { height: 4 },
    cardBody: { padding: SPACING.md },
    cardIcon: { fontSize: 28, marginBottom: SPACING.sm },
    cardLabel: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 6,
    },
    cardCta: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '700',
    },

    // Info
    infoBox: {
        backgroundColor: `${COLORS.primary}18`,
        borderWidth: 1,
        borderColor: `${COLORS.primary}44`,
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    infoText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, fontWeight: '700' },

    // Modal
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)' },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingBottom: 36,
        paddingTop: SPACING.md,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.sm,
    },
    sheetTitle: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    closeBtn: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900' },

    // Sheet body
    sheetBody: { gap: SPACING.md },
    catTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderLeftWidth: 4,
        paddingLeft: SPACING.sm,
        paddingVertical: 4,
    },
    catTagIcon: { fontSize: 15 },
    catTagText: { fontSize: 12, fontWeight: '900', color: COLORS.white },

    // Camera
    cameraWrap: { gap: SPACING.md },
    camera: {
        height: 280,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    bracket: { position: 'absolute', width: 24, height: 24, borderColor: COLORS.white },
    topLeft: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
    topRight: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
    bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
    bottomRight: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
    captureFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.35)' },

    captureRow: { alignItems: 'center', gap: SPACING.sm },
    cameraHint: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
    captureBtn: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 3,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.white },

    // Preview
    previewSection: { gap: SPACING.md },
    previewWrap: {
        height: 260,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
    },
    previewImage: { width: '100%', height: '100%' },
    previewPlaceholder: {
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    previewPlaceholderIcon: { fontSize: 40 },
    previewPlaceholderText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },

    capturedBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: COLORS.success,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    capturedBadgeText: { color: '#000', fontSize: 11, fontWeight: '900' },

    previewBtns: { flexDirection: 'row', gap: SPACING.sm },
    halfBtn: { flex: 1 },
    previewDisclaimer: {
        color: COLORS.muted,
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '700',
    },

    submittingBox: { marginTop: SPACING.sm },

    // Permission
    permBox: { alignItems: 'center', padding: SPACING.lg },
    permIcon: { fontSize: 48, marginBottom: SPACING.md },
    permTitle: { color: COLORS.white, fontSize: 16, fontWeight: '900', marginBottom: SPACING.sm },
    permSub: { color: COLORS.muted, fontSize: 11, textAlign: 'center', fontWeight: '700' },
    permBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: SPACING.lg,
    },
    permBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
    permCancel: { marginTop: SPACING.md },
    permCancelText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },

    // Toast
    toast: {
        position: 'absolute',
        top: 52,
        left: SPACING.md,
        right: SPACING.md,
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        paddingHorizontal: SPACING.md,
    },
    toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000' },
    toastText: { color: '#000', fontSize: 12, fontWeight: '900', flex: 1 },
});
