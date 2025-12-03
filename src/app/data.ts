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
    other: { amount: number; paid: boolean };
  };
  totalAmount: number; // This will be calculated
  status: 'Paid' | 'Unpaid'; // This will be calculated
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
  createdAt: string;
  updatedAt: string;
}

export interface ContributionSettings {
    main: number;
    cash: number;
    sick: number;
    bereavement: number;
    other: number;
}


export const arisanData: {
  members: Member[];
  groups: Group[];
  payments: DetailedPayment[];
  expenses: Expense[];
  notes: Note[];
  contributionSettings: ContributionSettings;
} = {
  members: [
    {
      id: 'm1',
      name: 'Budi Santoso',
      address: 'Jl. Merdeka 1',
      phone: '081234567890',
      avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-01-15',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-11', status: 'Unpaid' },
        { date: '2024-07-10', status: 'Paid' },
      ],
      communicationPreferences: { channel: 'WhatsApp', preferredTime: 'evening' },
    },
    {
      id: 'm2',
      name: 'Siti Aminah',
      address: 'Jl. Kemerdekaan 2',
      phone: '081234567891',
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
      address: 'Jl. Pahlawan 3',
      phone: '081234567892',
      avatarUrl: 'https://picsum.photos/seed/avatar3/100/100',
      avatarHint: 'person portrait',
      joinedDate: '2023-02-01',
      paymentHistory: [
        { date: '2024-05-10', status: 'Paid' },
        { date: '2024-06-10', status: 'Paid' },
        { date: '2024-07-12', status: 'Unpaid' },
      ],
      communicationPreferences: { channel: 'SMS', preferredTime: 'afternoon' },
    },
    {
      id: 'm4',
      name: 'Dewi Lestari',
      address: 'Jl. Nusantara 4',
      phone: '081234567893',
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
      address: 'Jl. Keadilan 5',
      phone: '081234567894',
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
    { id: 'p1', memberId: 'm1', groupId: 'g3', dueDate: '2024-08-10', contributions: { main: { amount: 50000, paid: false }, cash: { amount: 10000, paid: false }, sick: { amount: 5000, paid: false }, bereavement: { amount: 5000, paid: false }, other: { amount: 0, paid: true } }, totalAmount: 70000, status: 'Unpaid' },
    { id: 'p2', memberId: 'm2', groupId: 'g3', dueDate: '2024-08-10', contributions: { main: { amount: 50000, paid: true }, cash: { amount: 10000, paid: true }, sick: { amount: 5000, paid: true }, bereavement: { amount: 5000, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 70000, status: 'Paid' },
    { id: 'p3', memberId: 'm4', groupId: 'g3', dueDate: '2024-08-10', contributions: { main: { amount: 50000, paid: false }, cash: { amount: 10000, paid: true }, sick: { amount: 5000, paid: false }, bereavement: { amount: 5000, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 70000, status: 'Unpaid' },
    { id: 'p4', memberId: 'm1', groupId: 'g1', dueDate: '2024-08-10', contributions: { main: { amount: 20000, paid: true }, cash: { amount: 0, paid: true }, sick: { amount: 0, paid: true }, bereavement: { amount: 0, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 20000, status: 'Paid' },
    { id: 'p5', memberId: 'm2', groupId: 'g1', dueDate: '2024-08-10', contributions: { main: { amount: 20000, paid: true }, cash: { amount: 0, paid: true }, sick: { amount: 0, paid: true }, bereavement: { amount: 0, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 20000, status: 'Paid' },
    { id: 'p6', memberId: 'm3', groupId: 'g1', dueDate: '2024-08-10', contributions: { main: { amount: 20000, paid: false }, cash: { amount: 0, paid: true }, sick: { amount: 0, paid: true }, bereavement: { amount: 0, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 20000, status: 'Unpaid' },
    { id: 'p7', memberId: 'm4', groupId: 'g1', dueDate: '2024-08-10', contributions: { main: { amount: 20000, paid: true }, cash: { amount: 0, paid: true }, sick: { amount: 0, paid: true }, bereavement: { amount: 0, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 20000, status: 'Paid' },
    { id: 'p8', memberId: 'm5', groupId: 'g1', dueDate: '2024-08-10', contributions: { main: { amount: 20000, paid: false }, cash: { amount: 0, paid: true }, sick: { amount: 0, paid: true }, bereavement: { amount: 0, paid: true }, other: { amount: 0, paid: true } }, totalAmount: 20000, status: 'Unpaid' },
  ],
  expenses: [
    { id: 'e1', date: '2024-07-20', description: 'Bantuan untuk Budi (sakit)', amount: 50000, category: 'Sakit' },
    { id: 'e2', date: '2024-07-22', description: 'Sumbangan duka cita keluarga Siti', amount: 100000, category: 'Kemalangan' },
    { id: 'e3', date: '2024-07-25', description: 'Biaya fotokopi & administrasi', amount: 15000, category: 'Lainnya' },
  ],
  notes: [
    { id: 'n1', title: 'Rencana Rapat Anggota', content: 'Rapat anggota berikutnya akan diadakan pada akhir bulan untuk membahas perubahan iuran.', createdAt: '2024-07-28T10:00:00Z', updatedAt: '2024-07-28T10:00:00Z' },
    { id: 'n2', title: 'Ide Acara Halal Bihalal', content: 'Mengumpulkan ide untuk acara halal bihalal keluarga besar. Beberapa usulan: outbound, makan bersama di restoran, atau pengajian.', createdAt: '2024-07-25T14:30:00Z', updatedAt: '2024-07-26T09:00:00Z' },
    { id: 'n3', title: 'Daftar Kontak Penting', content: 'Ketua: Budi Santoso (0812...), Bendahara: Siti Aminah (0813...)', createdAt: '2024-07-20T08:00:00Z', updatedAt: '2024-07-20T08:00:00Z' }
  ],
  contributionSettings: {
    main: 50000,
    cash: 10000,
    sick: 5000,
    bereavement: 5000,
    other: 0,
  }
};

    
    
