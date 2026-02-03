export enum UserRole {
  ADMIN = 'database admin',
  HCW = 'HCW',
  SYSCLERK = 'sysclerk'
}

export interface UserProfile {
  id: string;
  surname: string;
  firstName: string;
  middleName?: string; // Support for 3-letter initials
  specialization: string;
  department: string;
  photo?: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
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
  dateDischarged?: string;
  isArchived: boolean;
  mainHCWId: string;
  members: string[];
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
    check: string[];
    cross: string[];
  };
  readBy: string[];
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






