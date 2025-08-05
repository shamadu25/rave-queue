import { QueueEntry } from '@/types/queue';

export const mockQueueEntries: QueueEntry[] = [
  {
    id: '1',
    token: 'C001',
    fullName: 'John Doe',
    phoneNumber: '+1-555-0123',
    department: 'Consultation',
    priority: 'Normal',
    status: 'Waiting',
    timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    id: '2',
    token: 'L002',
    fullName: 'Sarah Wilson',
    phoneNumber: '+1-555-0456',
    department: 'Lab',
    priority: 'Emergency',
    status: 'In Progress',
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: '3',
    token: 'P001',
    fullName: 'Michael Chen',
    department: 'Pharmacy',
    priority: 'Normal',
    status: 'Completed',
    timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
  },
  {
    id: '4',
    token: 'B001',
    fullName: 'Emily Rodriguez',
    phoneNumber: '+1-555-0789',
    department: 'Billing',
    priority: 'Normal',
    status: 'Waiting',
    timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
  },
  {
    id: '5',
    token: 'C002',
    fullName: 'David Thompson',
    phoneNumber: '+1-555-0321',
    department: 'Consultation',
    priority: 'Emergency',
    status: 'In Progress',
    timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  }
];