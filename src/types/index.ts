export interface Card {
  id?: string;
  name: string;
  bank: string;
  lastFourDigits?: string;
  limit: number;
  closingDay: number; // dia do mês, 1-31
  dueDay: number; // dia do mês, 1-31
  color: string;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface Purchase {
  id?: string;
  description: string;
  totalAmount: number;
  purchaseDate: FirebaseFirestore.Timestamp;
  category?: string;
  installmentsCount: number;
  createdAt?: FirebaseFirestore.Timestamp;
}

export type InstallmentStatus = 'pending' | 'paid';

export interface Installment {
  id?: string;
  purchaseId: string;
  description: string; // denormalizado da compra
  category?: string; // denormalizado da compra
  number: number; // ex: 2 (de 2/12)
  totalInstallments: number; // ex: 12 (de 2/12)
  amount: number;
  invoiceMonth: string; // formato "2026-09"
  dueDate: FirebaseFirestore.Timestamp;
  status: InstallmentStatus;
}

// Estende o Request do Express para incluir o uid do usuário autenticado
declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}
