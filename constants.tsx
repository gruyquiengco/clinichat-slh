import { UserRole, UserProfile, Patient, Message } from './types';

export const WARD_OPTIONS = [
  "NBAW", "Pav2", "Pav3", "Pav4", "Pav5", "Pav6", 
  "Pav7", "Pav8", "Pav10", "H4", "AIDCCU", "PIDCU"
];

export const DEPARTMENT_OPTIONS = [
  "Surgery", "Anesthesia", "OB Gyne", "Adult IDS", 
  "Internal Medicine", "Pediatrics", "Radiology", "Nursing"
];

export const DEPARTMENT_COLORS: Record<string, string> = {
  "Surgery": "#1e3a8a", // Dark Blue
  "Anesthesia": "#ef4444", // Red
  "OB Gyne": "#f472b6", // Pink
  "Adult IDS": "#064e3b", // Dark Green
  "Internal Medicine": "#22c55e", // Light Green
  "Pediatrics": "#eab308", // Yellow
  "Radiology": "#6b7280", // Grey
  "Nursing": "#14b8a6", // Teal
};

export const WARD_COLORS: Record<string, string> = {
  "NBAW": "#fbbf24", // Yellow/Amber
  "Pav2": "#f87171", // Red
  "Pav3": "#34d399", // Emerald
  "Pav4": "#60a5fa", // Blue
  "Pav5": "#a78bfa", // Violet
  "Pav6": "#f472b6", // Pink
  "Pav7": "#7360f2", // Purple
  "Pav8": "#fb923c", // Orange
  "Pav10": "#2dd4bf", // Teal
  "H4": "#818cf8", // Indigo
  "AIDCCU": "#fca5a5", // Light Red
  "PIDCU": "#c084fc", // Light Purple
};

// Default password for all mock users is 'password123'
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1',
    surname: 'Admin',
    firstName: 'System',
    middleName: 'D',
    specialization: 'Database Management',
    department: 'Surgery',
    email: 'admin@slh.com',
    phone: '0917-123-4567',
    role: UserRole.ADMIN,
    password: 'password123',
    photo: ''
  },
  {
    id: 'u2',
    surname: 'Reyes',
    firstName: 'Maria',
    middleName: 'A',
    specialization: 'Internal Medicine',
    department: 'Internal Medicine',
    email: 'mreyes@slh.com',
    phone: '0917-555-1111',
    role: UserRole.HCW,
    password: 'password123',
    photo: ''
  },
  {
    id: 'u3',
    surname: 'Cruz',
    firstName: 'Juan',
    middleName: 'B',
    specialization: 'Clerk',
    department: 'Nursing',
    email: 'jcruz@slh.com',
    phone: '0917-555-2222',
    role: UserRole.SYSCLERK,
    password: 'password123',
    photo: ''
  }
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    surname: 'Dela Cruz',
    firstName: 'Pedro',
    age: 45,
    sex: 'Male',
    diagnosis: 'Acute Gastroenteritis',
    patientId: 'PT-2023-001',
    ward: 'Pav2',
    roomNumber: '302',
    dateAdmitted: '2023-10-25',
    isArchived: false,
    mainHCWId: 'u2',
    members: ['u1', 'u2', 'u3'],
    avatarColor: '#f87171',
    chatBg: '#f5f6f7'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    patientId: 'p1',
    senderId: 'u2',
    content: 'Patient admitted. Vitals stable.',
    timestamp: new Date().toISOString(),
    type: 'text',
    reactions: { check: ['u1'], cross: [] },
    readBy: ['u2', 'u1', 'u3']
  }
];






