export type UserRole = "Owner" | "Operations Manager" | "Receptionist" | "Barista";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: {
    name: UserRole;
  };
}

export interface AuthPayload {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  phoneNumberSecondary?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  customerType: string;
  college?: string | null;
  studyLevel?: string | null;
  specialization?: string | null;
  employerName?: string | null;
  jobTitle?: string | null;
  status: string;
  firstVisitAt?: string | null;
  createdAt?: string;
  lastVisitAt?: string | null;
}

export interface Session {
  id: string;
  customerId: string;
  sessionType: string;
  status: string;
  startTime: string;
  endTime?: string | null;
  notes?: string | null;
  roomId?: string | null;
  room?: {
    id: string;
    name: string;
  } | null;
  chargeAmount?: string | number | null;
  customer?: Customer;
}

export interface Booking {
  id: string;
  bookingType: string;
  startTime: string;
  endTime: string;
  status: string;
  participantCount?: number | null;
  depositAmount?: string | number | null;
  notes?: string | null;
  totalAmount: string | number;
  customer?: Customer;
  room?: {
    id: string;
    name: string;
  };
}

export interface Room {
  id: string;
  name: string;
  roomType: string;
  capacity: number;
  status: string;
  hourlyRate?: string | number | null;
  dailyRate?: string | number | null;
  features?: string[] | null;
  notes?: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string | number;
  description?: string | null;
  availability: boolean;
  active: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  paymentStatus: string;
  totalAmount: string | number;
  amountPaid: string | number;
  remainingAmount: string | number;
  issuedAt: string;
  customerId?: string;
  customer?: Customer;
  sessionId?: string | null;
  notes?: string | null;
  items?: Array<{
    id: string;
    itemType: string;
    description?: string | null;
    quantity: number;
    unitPrice: string | number;
    total: string | number;
  }>;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentMethod: string;
  notes?: string | null;
  amount: string | number;
  paidAt: string;
}

export interface BarOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  product?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface BarOrder {
  id: string;
  status: string;
  notes?: string | null;
  sessionId?: string | null;
  customerId?: string | null;
  createdAt: string;
  updatedAt?: string;
  waitMinutes?: number;
  totalAmount?: number;
  customer?: Customer | null;
  session?: Session | null;
  items?: BarOrderItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
  createdAt?: string;
}
