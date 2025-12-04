

import { collection, onSnapshot, query, Firestore } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  avatarUrl: string;
  avatarHint: string;
  joinedDate: string;
  paymentHistory: {
    date: string;
    status: 'Paid' | 'Unpaid';
  }[];
  communicationPreferences: {
    channel: 'email' | 'SMS' | 'WhatsApp';
    preferredTime: string;
  };
}

export interface Group {
  id: string;
  name: string;
  contributionAmount: number;
  cycle: 'monthly' | 'weekly';
  memberIds: string[];
  currentWinnerId?: string;
  winnerHistory?: { month: string; memberId: string }[];
}

export interface DetailedPayment {
  id: string;
  memberId: string;
  groupId: string;
  dueDate: string;
  contributions: {
    main: { amount: number; paid: boolean };
    cash: { amount: number; paid: boolean };
    sick: { amount: number; paid: boolean };
    bereavement: { amount: number; paid: boolean };
    [otherContributionId: string]: { amount: number; paid: boolean };
  };
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: 'Sakit' | 'Kemalangan' | 'Lainnya';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any; // Allow Firestore Timestamp
  updatedAt: any; // Allow Firestore Timestamp
}


export interface OtherContribution {
    id: string;
    description: string;
    amount: number;
}

export interface ContributionSettings {
    main: number;
    cash: number;
    sick: number;
    bereavement: number;
    others: OtherContribution[];
}

export const subscribeToData = (db: Firestore, collectionName: string, callback: (data: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: any[] = [];
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            // Convert Firestore Timestamps to string dates for client-side consistency
            if (docData.createdAt && docData.createdAt.toDate) {
                docData.createdAt = docData.createdAt.toDate().toISOString();
            }
            if (docData.updatedAt && docData.updatedAt.toDate) {
                docData.updatedAt = docData.updatedAt.toDate().toISOString();
            }
            data.push({ id: doc.id, ...docData });
        });
        callback(data);
    }, (error) => {
        console.error(`Error fetching ${collectionName}: `, error);
        // Optionally, you can have a global error state to show a message to the user
    });
    return unsubscribe;
};
