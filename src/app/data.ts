export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  avatarHint: string;
  joinedDate: string;
  paymentHistory: {
    date: string;
    status: 'Paid' | 'Late' | 'Unpaid';
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

export interface Payment {
  id: string;
  memberId: string;
  groupId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Late';
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: 'Sakit' | 'Kemalangan' | 'Lainnya';
}

export const arisanData: {
  members: Member[];
  groups: Group[];
  payments: Payment[];
  expenses: Expense[];
} = {
  members: [
    {
      id: 'm1',
      name: 'Budi Santoso',
      avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-01-15',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-11', status: 'Late' },
        { date: '2024-07-10', status: 'Paid' },
      ],
      communicationPreferences: { channel: 'WhatsApp', preferredTime: 'evening' },
    },
    {
      id: 'm2',
      name: 'Siti Aminah',
      avatarUrl: 'https://picsum.photos/seed/avatar2/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-01-15',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-10', status: 'Paid' },
        { date: '2024-07-10', status: 'Paid' },
      ],
      communicationPreferences: { channel: 'email', preferredTime: 'morning' },
    },
    {
      id: 'm3',
      name: 'Agus Wijoyo',
      avatarUrl: 'https://picsum.photos/seed/avatar3/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-02-01',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-10', status: 'Paid' },
        { date: '2024-07-12', status: 'Late' },
      ],
      communicationPreferences: { channel: 'SMS', preferredTime: 'afternoon' },
    },
    {
      id: 'm4',
      name: 'Dewi Lestari',
      avatarUrl: 'https://picsum.photos/seed/avatar4/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-03-20',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-10', status: 'Paid' },
        { date: '2024-07-10', status: 'Paid' },
      ],
      communicationPreferences: { channel: 'WhatsApp', preferredTime: 'any' },
    },
    {
      id: 'm5',
      name: 'Eko Prasetyo',
      avatarUrl: 'https://picsum.photos/seed/avatar5/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-05-05',
       paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-10', status: 'Paid' },
        { date: '2024-07-10', status: 'Paid' },
      ],
      communicationPreferences: { channel: 'email', preferredTime: 'evening' },
    },
  ],
  groups: [
    {
      id: 'g1',
      name: 'Arisan Uang Kaget Rp. 20.000',
      contributionAmount: 20000,
      cycle: 'monthly',
      memberIds: ['m1', 'm2', 'm3', 'm4', 'm5'],
      currentWinnerId: 'm2',
      winnerHistory: [{ month: '2024-07', memberId: 'm2' }],
    },
    {
      id: 'g2',
      name: 'Arisan Uang Kaget Rp. 10.000',
      contributionAmount: 10000,
      cycle: 'monthly',
      memberIds: ['m1', 'm3', 'm5'],
      winnerHistory: [],
    },
    {
        id: 'g3',
        name: 'Grup Arisan Utama',
        contributionAmount: 50000,
        cycle: 'monthly',
        memberIds: ['m1', 'm2', 'm4'],
        winnerHistory: [],
      },
  ],
  payments: [
    { id: 'p1', memberId: 'm1', groupId: 'g1', amount: 20000, dueDate: '2024-08-10', status: 'Unpaid' },
    { id: 'p2', memberId: 'm2', groupId: 'g1', amount: 20000, dueDate: '2024-08-10', status: 'Paid' },
    { id: 'p3', memberId: 'm3', groupId: 'g1', amount: 20000, dueDate: '2024-08-10', status: 'Unpaid' },
    { id: 'p4', memberId: 'm4', groupId: 'g1', amount: 20000, dueDate: '2024-08-10', status: 'Paid' },
    { id: 'p5', memberId: 'm5', groupId: 'g1', amount: 20000, dueDate: '2024-08-10', status: 'Unpaid' },
    { id: 'p6', memberId: 'm1', groupId: 'g2', amount: 10000, dueDate: '2024-08-15', status: 'Paid' },
    { id: 'p7', memberId: 'm3', groupId: 'g2', amount: 10000, dueDate: '2024-08-15', status: 'Unpaid' },
    { id: 'p8', memberId: 'm5', groupId: 'g2', amount: 10000, dueDate: '2024-08-15', status: 'Paid' },
  ],
  expenses: [
    { id: 'e1', date: '2024-07-20', description: 'Bantuan untuk Budi (sakit)', amount: 50000, category: 'Sakit' },
    { id: 'e2', date: '2024-07-22', description: 'Sumbangan duka cita keluarga Siti', amount: 100000, category: 'Kemalangan' },
    { id: 'e3', date: '2024-07-25', description: 'Biaya fotokopi & administrasi', amount: 15000, category: 'Lainnya' },
  ]
};
