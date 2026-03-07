export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  surname: string;
  middleName: string;
  prcNumber: string;
  department: 'Surgery' | 'Anesthesia' | 'OB Gyne' | 'Internal Medicine' | 'Adult IDS' | 'Pediatrics' | 'Radiology' | 'Nursing';
  specialty: string;
  phone: string;
  role: 'HCW' | 'SYSCLERK' | 'SYSADMIN';
  photoURL?: string;
}

export interface Patient {
  id: string;
  surname: string;
  firstName: string;
  age: string;
  sex: string;
  diagnosis: string;
  patientIdentifier: string; // Added Point 4 from your requirements
  ward: string;
  roomNumber: string;
  dateAdmitted: string;
  isArchived: boolean;
  members: string[]; // Care Team IDs
  mainHCW: string;   // Thread Admin
  avatarColor: string;
}

export interface Message {
  id: string;
  patientId: string;
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];
  reactions?: { userId: string; type: 'check' | 'cross' }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
