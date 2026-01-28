import { UserRole, UserProfile, Patient, Message } from './types';

export const WARD_OPTIONS = [
  "NBAW", "Pav2", "Pav3", "Pav4", "Pav5", "Pav6", 
  "Pav7", "Pav8", "Pav10", "H4", "AIDCCU", "PIDCU"
];

// Default password for all mock users is 'password123'
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1',
    surname: 'Admin',
    firstName: 'System',
    specialization: 'Database Management',
    department: 'IT',
    email: 'admin@slh.com',
    phone: '0917-123-4567',
    role: UserRole.ADMIN,
    password: 'password123',
    photo: 'https://i.pravatar.cc/150?u=u1'
  },
  {
    id: 'u2',
    surname: 'Reyes',
    firstName: 'Maria',
    specialization: 'Internal Medicine',
    department: 'Internal Medicine',
    email: 'mreyes@slh.com',
    phone: '0917-555-1111',
    role: UserRole.HCW,
    password: 'password123',
    photo: 'https://i.pravatar.cc/150?u=u2'
  },
  {
    id: 'u3',
    surname: 'Cruz',
    firstName: 'Juan',
    specialization: 'Clerk',
    department: 'Administration',
    email: 'jcruz@slh.com',
    phone: '0917-555-2222',
    role: UserRole.SYSCLERK,
    password: 'password123',
    photo: 'https://i.pravatar.cc/150?u=u3'
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
    avatarColor: '#7360f2',
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