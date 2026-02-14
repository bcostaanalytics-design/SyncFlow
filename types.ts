
export enum RequestStatus {
  PENDING_PCP = 'PENDING_PCP',
  PENDING_CS = 'PENDING_CS',
  WAITING_PRODUCTION = 'WAITING_PRODUCTION',
  PRODUCING = 'PRODUCING',
  WAITING_LOGISTICS = 'WAITING_LOGISTICS', // Substitui READY para criar a nova etapa clara
  COLLECTED = 'COLLECTED',
  CANCELLED_CS = 'CANCELLED_CS'
}

export enum Criticality {
  LOW = 'BAIXA',
  MEDIUM = 'MÉDIA',
  HIGH = 'ALTA'
}

export type UserRole = 'LOGISTICS' | 'PCP' | 'CS' | 'PRODUCTION' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  roles: UserRole[];
}

export interface Product {
  code: string;
  description: string;
  weightPA: number;
}

export interface TimestampEntry {
  date: string;
  user: string;
}

export interface ShortageRequest {
  id: string;
  code: string;
  description: string;
  quantity: number;
  totalWeight?: number;
  priority: boolean;
  criticality: Criticality;
  loadNumber?: string;
  status: RequestStatus;
  eta?: string;
  directive?: string;
  timestamps: {
    reported: TimestampEntry;
    requestedByPCP?: TimestampEntry;
    csDecision?: TimestampEntry;
    finishedProduction?: TimestampEntry;
    collected?: TimestampEntry;
  };
}
