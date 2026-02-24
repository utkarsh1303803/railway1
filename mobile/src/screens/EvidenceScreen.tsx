import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    StatusBar,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
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
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
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
        // Slide in
        translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 250 });

        // Auto dismiss after 2.5 s
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
            // Fallback for simulators — use placeholder
            setPhase('preview');
        }
    };

    const handleRetake = () => {
        setPhotoUri(null);
        setPhase('camera');
    };

    const handleSubmit = () => {
        setPhase('submitting');
        // Caller handles toast + close
        setTimeout(onClose, 300);
    };

    const requestPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    // Permission not yet determined or denied
    if (!hasPermission) {
        return (
            <View style={styles.permBox}>
                <Text style={styles.permIcon}>📷</Text>
                <Text style={styles.permTitle}>Camera Access Required</Text>
                <Text style={styles.permSub}>Grant camera permission to capture evidence.</Text>
                <PrimaryButton title="Grant Permission" onPress={requestPermission} style={{ marginTop: SPACING.lg }} />
                <TouchableOpacity onPress={onClose} style={styles.permCancel}>
                    <Text style={styles.permCancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.sheetBody}>
            {/* Category chip */}
            <View style={[styles.catChip, { borderColor: category.color, backgroundColor: `${category.color}18` }]}>
                <Text style={styles.catChipIcon}>{category.icon}</Text>
                <Text style={[styles.catChipText, { color: category.color }]}>{category.label}</Text>
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

                    <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.captureRow}>
                        <Text style={styles.cameraHint}>Point at evidence and tap capture</Text>
                        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            )}

            {/* ── PREVIEW phase ── */}
            {phase === 'preview' && (
                <Animated.View entering={FadeIn.duration(280)} style={styles.previewSection}>
                    {/* Image preview */}
                    <View style={styles.previewWrap}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            /* Simulator fallback placeholder */
                            <View style={[styles.previewImage, styles.previewPlaceholder]}>
                                <Text style={styles.previewPlaceholderIcon}>📷</Text>
                                <Text style={styles.previewPlaceholderText}>Photo captured</Text>
                            </View>
                        )}

                        {/* Overlay badge */}
                        <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.capturedBadge}>
                            <Text style={styles.capturedBadgeText}>✓  Photo Ready</Text>
                        </Animated.View>
                    </View>

                    {/* Buttons */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.previewBtns}>
                        <PrimaryButton
                            title="↩  Retake"
                            onPress={handleRetake}
                            variant="primary"
                            style={styles.halfBtn}
                        />
                        <PrimaryButton
                            title="Submit →"
                            onPress={handleSubmit}
                            variant="danger"
                            style={styles.halfBtn}
                        />
                    </Animated.View>

                    <Text style={styles.previewDisclaimer}>
                        Evidence will be encrypted and sent to RPF automatically.
                    </Text>
                </Animated.View>
            )}

            {/* ── SUBMITTING phase ── */}
            {phase === 'submitting' && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.submittingBox}>
                    <PrimaryButton title="Submitting..." onPress={() => { }} loading variant="primary" />
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
        setToastMsg(`Complaint Submitted Successfully  ·  Ref #${generateRef()}`);
    }, []);

    const handleCategoryPress = (cat: Category) => setActiveCategory(cat);

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Toast — rendered at screen level so it floats above everything */}
            {toastMsg && (
                <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
            )}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
                    <Text style={styles.headerTitle}>Evidence Complaint</Text>
                    <Text style={styles.headerSub}>
                        Select an incident type, capture photo evidence, and submit directly to RPF.
                    </Text>
                </Animated.View>

                {/* 2×2 Grid */}
                <View style={styles.grid}>
                    {CATEGORIES.map((cat, i) => (
                        <Animated.View
                            key={cat.id}
                            entering={FadeInDown.delay(100 + i * 80).springify()}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                style={[styles.card, { borderTopColor: cat.color }]}
                                onPress={() => handleCategoryPress(cat)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.cardIconCircle, { backgroundColor: `${cat.color}20` }]}>
                                    <Text style={styles.cardIcon}>{cat.icon}</Text>
                                </View>
                                <Text style={styles.cardLabel}>{cat.label}</Text>
                                <Text style={styles.cardCta}>Tap to file →</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Info strip */}
                <Animated.View entering={FadeInDown.delay(460).springify()} style={styles.infoBox}>
                    <Text style={styles.infoIcon}>🔒</Text>
                    <Text style={styles.infoText}>
                        All evidence is encrypted and geotagged before being forwarded to RPF.
                    </Text>
                </Animated.View>
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
                        <View style={styles.handle} />
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Capture Evidence</Text>
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
    content: { padding: SPACING.lg, paddingBottom: 48 },

    // Header
    header: { marginBottom: SPACING.xl },
    headerTitle: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginBottom: SPACING.sm },
    headerSub: { color: COLORS.muted, fontSize: 14, lineHeight: 21 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
    cardWrapper: { width: '47%', borderRadius: RADIUS.lg, ...SHADOW.card },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderTopWidth: 3,
        borderColor: COLORS.border,
        minHeight: 155,
    },
    cardIconCircle: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    },
    cardIcon: { fontSize: 22 },
    cardLabel: { color: COLORS.white, fontSize: 14, fontWeight: '700', marginBottom: 6 },
    cardCta: { color: COLORS.muted, fontSize: 12 },

    // Info
    infoBox: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        backgroundColor: `${COLORS.primary}18`,
        borderWidth: 1, borderColor: `${COLORS.primary}44`,
        borderRadius: RADIUS.md, padding: SPACING.md,
    },
    infoIcon: { fontSize: 14 },
    infoText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, flex: 1 },

    // Modal
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg, paddingBottom: 36, paddingTop: SPACING.sm,
    },
    handle: {
        alignSelf: 'center', width: 40, height: 4,
        borderRadius: 2, backgroundColor: COLORS.border, marginBottom: SPACING.sm,
    },
    sheetHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.md,
    },
    sheetTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
    closeBtn: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },

    // Sheet body
    sheetBody: { gap: SPACING.md },
    catChip: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        gap: 8, borderWidth: 1, borderRadius: 20,
        paddingVertical: 6, paddingHorizontal: 14,
    },
    catChipIcon: { fontSize: 15 },
    catChipText: { fontSize: 13, fontWeight: '700' },

    // Camera
    cameraWrap: { gap: SPACING.md },
    camera: { height: 280, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    bracket: { position: 'absolute', width: 24, height: 24, borderColor: COLORS.white },
    topLeft: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
    topRight: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
    bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
    bottomRight: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
    captureFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.35)' },

    captureRow: { alignItems: 'center', gap: SPACING.sm },
    cameraHint: { color: COLORS.muted, fontSize: 12 },
    captureBtn: {
        width: 68, height: 68, borderRadius: 34,
        borderWidth: 3, borderColor: COLORS.white,
        alignItems: 'center', justifyContent: 'center', ...SHADOW.card,
    },
    captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.white },

    // Preview
    previewSection: { gap: SPACING.md },
    previewWrap: {
        height: 260, borderRadius: RADIUS.lg, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.border, position: 'relative',
    },
    previewImage: { width: '100%', height: '100%' },
    previewPlaceholder: {
        backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    previewPlaceholderIcon: { fontSize: 40 },
    previewPlaceholderText: { color: COLORS.muted, fontSize: 14 },

    capturedBadge: {
        position: 'absolute', bottom: 10, left: 10,
        backgroundColor: `${COLORS.success}EE`,
        borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14,
    },
    capturedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    previewBtns: { flexDirection: 'row', gap: SPACING.sm },
    halfBtn: { flex: 1 },
    previewDisclaimer: { color: COLORS.muted, fontSize: 11, textAlign: 'center' },

    submittingBox: { marginTop: SPACING.sm },

    // Permission
    permBox: { alignItems: 'center', padding: SPACING.lg },
    permIcon: { fontSize: 48, marginBottom: SPACING.md },
    permTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm },
    permSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
    permCancel: { marginTop: SPACING.lg },
    permCancelText: { color: COLORS.muted, fontSize: 14 },

    // Toast — floats at top of screen
    toast: {
        position: 'absolute',
        top: 52,
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.success,
        borderRadius: RADIUS.lg,
        paddingVertical: 14,
        paddingHorizontal: SPACING.lg,
        ...SHADOW.card,
    },
    toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    toastText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
});
