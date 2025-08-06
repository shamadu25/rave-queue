export type Department = 'Consultation' | 'Lab' | 'Pharmacy' | 'Billing' | 'X-ray' | 'Scan';
export const Department = {
  Consultation: 'Consultation' as const,
  Lab: 'Lab' as const,
  Pharmacy: 'Pharmacy' as const,
  Billing: 'Billing' as const,
  'X-ray': 'X-ray' as const,
  Scan: 'Scan' as const
} as const;
export type Priority = 'Normal' | 'Emergency';
export type Status = 'Waiting' | 'Called' | 'Served' | 'In Progress' | 'Completed' | 'Skipped';

export interface QueueEntry {
  id: string;
  token: string;
  fullName: string;
  phoneNumber?: string;
  department: Department;
  priority: Priority;
  status: Status;
  timestamp: Date;
}

export interface QueueFilters {
  department?: Department;
  status?: Status;
}