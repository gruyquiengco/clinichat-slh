export enum UserRole {
  ADMIN = 'ADMIN',
  HCW_MD = 'HCW-MD',
  HCW_RN = 'HCW-RN',
  SYSCLERK = 'SYSCLERK',
}

export interface UserProfile {
  id: string;
  surname: string;
  firstName: string;
  specialization: string;
  department: string;
  photo?: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string; // Added for real authentication
  darkMode?: boolean;
  darkModeSchedule?: {
    enabled: boolean;
    from: string; // "HH:mm" format
    to: string;   // "HH:mm" format
  };
}

export interface Patient {
  id: string;
  surname: string;
  firstName: string;
  age: number;
  sex: 'Male' | 'Female';
  diagnosis: string;
  patientId: string;
  ward: string;
  roomNumber: string;
  dateAdmitted: string;
  dateDischarged?: string; // Captures when the patient was archived/discharged
  isArchived: boolean;
  mainHCWId: string;
  members: string[]; // List of User IDs
  avatarColor?: string;
  chatBg?: string;
}

export interface Message {
  id: string;
  patientId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'system';
  attachmentUrl?: string;
  reactions: {
    check: string[]; // User IDs
    cross: string[]; // User IDs
  };
  readBy: string[]; // User IDs
  replyToId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: string;
  action: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'ARCHIVE' | 'EXPORT' | 'LOGIN' | 'SIGNUP';
  details: string;
  targetId: string;
}

export type AppView = 'login' | 'chat_list' | 'thread' | 'contacts' | 'profile' | 'audit' | 'reports';
