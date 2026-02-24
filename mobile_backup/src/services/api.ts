import { db } from './firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
} from 'firebase/firestore';

export type SOSPayload = {
    coachNumber: string;
    seatNumber: string;
    type: 'SOS';
    incidentType: string;
};

export type ComplaintPayload = {
    trainNumber: string;
    coachNumber: string;
    description: string;
    imageUrl: string | null;
    userId: string;
};

export async function sendSOS(payload: SOSPayload) {
    const priorityMap: Record<string, string> = {
        medical_emergency: 'high',
        harassment: 'high',
        theft: 'medium',
        vendor_overpricing: 'low',
    };

    const priority = priorityMap[payload.incidentType] || 'medium';

    return addDoc(collection(db, 'sos_alerts'), {
        coach: payload.coachNumber,
        seat: payload.seatNumber,
        type: 'SOS',
        category: payload.incidentType,
        priority: priority,
        status: 'pending',
        timestamp: serverTimestamp(),
    });
}

export async function submitComplaint(payload: ComplaintPayload) {
    return addDoc(collection(db, 'complaints'), {
        ...payload,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
}

export async function resolveQRSeat(seatId: string) {
    const ref = doc(db, 'seat_complaints', seatId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return null;
}
