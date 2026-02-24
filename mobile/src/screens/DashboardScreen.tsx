import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLORS, SPACING } from '../constants/theme';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

type Alert = {
    id: string;
    coach: string;
    seat: string;
    type: string;
    category: string;
    priority: string;
    status: string;
    timestamp: Timestamp;
};

// ─── Alert Card Component ──────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
    const [timer, setTimer] = useState('00:00');

    useEffect(() => {
        const interval = setInterval(() => {
            if (!alert.timestamp) return;
            const now = new Date().getTime();
            const start = alert.timestamp.toDate().getTime();
            const diff = Math.floor((now - start) / 1000);

            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [alert.timestamp]);

    const isHigh = alert.priority === 'high';
    const color = isHigh ? COLORS.accent : COLORS.primary;

    return (
        <Animated.View
            entering={FadeInUp}
            layout={Layout.springify()}
            style={[styles.alertCard, { borderColor: color }, isHigh && styles.highPriorityCard]}
        >
            <View style={[styles.priorityBar, { backgroundColor: color }]} />

            <View style={styles.alertMain}>
                <View style={styles.alertHeader}>
                    <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
                    <View style={styles.timerWrap}>
                        <Text style={styles.timerLabel}>ELAPSED</Text>
                        <Text style={[styles.timerSecs, isHigh && { color: COLORS.accent }]}>{timer}</Text>
                    </View>
                </View>

                <View style={styles.alertMeta}>
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>COACH</Text>
                        <Text style={styles.metaValue}>{alert.coach}</Text>
                    </View>
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>SEAT</Text>
                        <Text style={styles.metaValue}>{alert.seat}</Text>
                    </View>
                </View>

                <View style={styles.alertFooter}>
                    <Text style={styles.categoryText}>{alert.category.replace('_', ' ').toUpperCase()}</Text>
                    <View style={[styles.statusTag, { backgroundColor: `${color}22`, borderColor: color }]}>
                        <Text style={[styles.statusText, { color }]}>{alert.status.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]}>
                <Text style={[styles.actionBtnText, { color }]}>DISPATCH</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'sos_alerts'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Alert[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as Alert);
            });
            setAlerts(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* System Header */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.topBarTitle}>RPF_DASHBOARD</Text>
                    <Text style={styles.topBarSub}>LIVE ALERT TERMINAL // STATION: NDLS</Text>
                </View>
                <View style={styles.alertCount}>
                    <Text style={styles.countNumber}>{alerts.length}</Text>
                    <Text style={styles.countLabel}>ACTIVE</Text>
                </View>
            </View>

            <FlatList
                data={alerts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => <AlertCard alert={item} />}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        {!loading && (
                            <>
                                <Text style={styles.emptyIcon}>🛡️</Text>
                                <Text style={styles.emptyTitle}>ALL CLEAR</Text>
                                <Text style={styles.emptySub}>NO ACTIVE ALERTS IN YOUR SECTOR.</Text>
                            </>
                        )}
                        {loading && <Text style={styles.loadingText}>INITIALIZING_DATA_LINK...</Text>}
                    </View>
                }
            />

            {/* Footer status */}
            <View style={styles.footer}>
                <View style={styles.secDot} />
                <Text style={styles.footerText}>ENCRYPTED_DATA_FEED_ACTIVE</Text>
            </View>
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
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border,
    },
    topBarTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    topBarSub: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },

    alertCount: {
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    countNumber: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
    countLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '800' },

    listContent: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 40 },

    alertCard: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 120,
    },
    highPriorityCard: {
        borderWidth: 2,
    },
    priorityBar: { width: 6 },

    alertMain: { flex: 1, padding: SPACING.md },

    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    alertType: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    timerWrap: { alignItems: 'flex-end' },
    timerLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '900' },
    timerSecs: { color: COLORS.white, fontSize: 14, fontWeight: '900', fontFamily: 'monospace' },

    alertMeta: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: SPACING.md,
    },
    metaBox: { gap: 2 },
    metaLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900' },
    metaValue: { color: COLORS.white, fontSize: 16, fontWeight: '900' },

    alertFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryText: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },

    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
    },
    statusText: { fontSize: 9, fontWeight: '900' },

    actionBtn: {
        width: 80,
        borderLeftWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    emptyWrap: {
        marginTop: 100,
        alignItems: 'center',
        gap: 12,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
    emptySub: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
    loadingText: { color: COLORS.muted, fontSize: 12, fontWeight: '800', marginTop: 100, textAlign: 'center' },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    secDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
    footerText: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },
});
