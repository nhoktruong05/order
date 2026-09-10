export type TableStatus = 'available' | 'occupied' | 'payment_pending' | 'reserved';

export interface MenuItem {
  id: string;
  name: string;
  category: 'Khai vị' | 'Món nướng' | 'Món lẩu' | 'Món ăn kèm' | 'Đồ uống' | 'Tráng miệng';
  price: number;
  unit: string;
  image?: string;
  isPopular?: boolean;
}

export type ItemStatus = 'pending' | 'preparing' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  status: ItemStatus;
  orderedAt: string; // HH:mm:ss
}

export interface OrderBatch {
  id: string;
  batchNumber: number; // 1 = Lần 1, 2 = Lần 2, 3 = Lần 3
  timestamp: string; // HH:mm:ss
  fullDateTime: string; // YYYY-MM-DD HH:mm:ss
  items: OrderItem[];
  note?: string;
  source: 'qr_customer' | 'staff_pos';
}

export type ReservationStatus = 
  | 'upcoming_waiting'   // Chưa tới khoảng 3 tiếng (Bàn vẫn XANH LÁ, ĐÓN ĐƯỢC KHÁCH VÃNG LAI)
  | 'locked_holding'      // Trong khoảng 3 tiếng trước giờ khách đến (KHÓA BÀN XANH DƯƠNG - KHÔNG NHẬN KHÁCH VÃNG LAI)
  | 'checked_in'          // Khách đặt bàn đã tới nhận bàn
  | 'auto_cancelled'      // Quá 30 phút sau giờ hẹn mà khách không tới -> TỰ ĐỘNG HỦY, MỞ BÀN XANH LÁ
  | 'cancelled';          // Hủy thủ công

export interface OnlineReservation {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  phone: string;
  guestCount: number;
  bookingDate: string;    // YYYY-MM-DD (VD: "2026-09-10", "2026-09-11", "2026-09-12"...)
  bookingTime: string;    // HH:mm (VD: "19:30")
  lockFromTime: string;   // 3 tiếng trước giờ hẹn (VD: "16:30")
  autoCancelTime: string; // 30 phút sau giờ hẹn (VD: "20:00")
  createdAt: string;
  note?: string;
  status: ReservationStatus;
  cancellationReason?: string;
}

export interface TableSession {
  sessionId: string;
  tableId: string;
  tableName: string;
  startedAt: string; // HH:mm:ss
  fullStartDateTime: string;
  guestCount: number;
  batches: OrderBatch[];
  status: 'active' | 'requesting_bill' | 'completed';
  discountPercent?: number;
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  currentSession?: TableSession;
  activeReservationId?: string; // ID của đặt bàn đang hoạt động
}

export interface CompletedOrder {
  id: string;
  orderCode: string;
  tableId: string;
  tableName: string;
  guestCount: number;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  batches: OrderBatch[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'transfer_qr';
  cashierName: string;
  notes?: string;
}
