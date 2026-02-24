import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOW } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type DropdownOption = { label: string; value: string };

type Props = {
    label?: string;
    placeholder?: string;
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
};

export default function Dropdown({
    label,
    placeholder = 'Select...',
    options,
    value,
    onChange,
}: Props) {
    const [visible, setVisible] = useState(false);
    const selected = options.find((o) => o.value === value);

    const open = () => setVisible(true);
    const close = () => setVisible(false);

    const handleSelect = (opt: DropdownOption) => {
        onChange(opt.value);
        close();
    };

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <TouchableOpacity
                style={styles.trigger}
                onPress={open}
                activeOpacity={0.75}
            >
                <Text style={[styles.triggerText, !selected && styles.placeholder]}>
                    {selected ? selected.label : placeholder}
                </Text>
                <Animated.Text style={styles.chevron}>{visible ? '▲' : '▼'}</Animated.Text>
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={close}
            >
                {/* Backdrop */}
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={StyleSheet.absoluteFill}
                >
                    <TouchableWithoutFeedback onPress={close}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                {/* Sheet */}
                <Animated.View
                    entering={SlideInDown.springify().damping(22).stiffness(300)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.sheet}
                >
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    <Text style={styles.sheetTitle}>{label || 'Select Option'}</Text>

                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.value}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item }) => {
                            const isActive = item.value === value;
                            return (
                                <TouchableOpacity
                                    style={[styles.option, isActive && styles.optionActive]}
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                                        {item.label}
                                    </Text>
                                    {isActive && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Animated.View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: SPACING.md },

    label: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 6,
    },

    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingVertical: 14,
        paddingHorizontal: SPACING.md,
        ...SHADOW.card,
    },
    triggerText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    placeholder: { color: COLORS.muted },
    chevron: { color: COLORS.muted, fontSize: 11, marginLeft: 8 },

    // Modal
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.6,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderColor: COLORS.border,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    sheetTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.md,
    },
    optionActive: {
        backgroundColor: `${COLORS.primary}33`,
    },
    optionText: {
        color: COLORS.muted,
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    optionTextActive: {
        color: COLORS.white,
        fontWeight: '700',
    },
    checkMark: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '800',
    },
});
