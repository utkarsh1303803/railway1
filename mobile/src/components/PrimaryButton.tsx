import React from 'react';
import {
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOW } from '../constants/theme';

type Props = {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
    fullWidth?: boolean;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PrimaryButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    icon,
    fullWidth = true,
}: Props) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 18, stiffness: 300 });
        opacity.value = withSpring(0.85);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300 });
        opacity.value = withSpring(1);
    };

    const isDanger = variant === 'danger';

    return (
        <AnimatedTouchable
            style={[
                styles.base,
                isDanger ? styles.danger : styles.primary,
                isDanger ? SHADOW.alert : SHADOW.button,
                fullWidth && { width: '100%' },
                (disabled || loading) && styles.disabled,
                animStyle,
                style,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={1}
        >
            {/* Gloss overlay */}
            <View style={styles.gloss} pointerEvents="none" />

            {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
                <View style={styles.row}>
                    {icon && <View style={styles.iconWrap}>{icon}</View>}
                    <Text style={styles.label}>{title}</Text>
                </View>
            )}
        </AnimatedTouchable>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        minHeight: 56,
        overflow: 'hidden',
        position: 'relative',
    },
    primary: {
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: '#1A5BC4',
    },
    danger: {
        backgroundColor: COLORS.accent,
        borderWidth: 1,
        borderColor: '#B71C1C',
    },
    disabled: { opacity: 0.5 },
    gloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    iconWrap: { marginRight: 4 },
    label: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.6,
    },
});
