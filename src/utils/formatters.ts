import { TableSession, OrderBatch, OnlineReservation, ReservationStatus } from '../types';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getFullDateTime(): string {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return `${dateStr} ${timeStr}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getOffsetDateString(offsetDays: number = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getTomorrowDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDayAfterTomorrowDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatDateLabel(dateStr: string): string {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();
  const dayAfter = getDayAfterTomorrowDateString();

  if (dateStr === today) return 'Hôm nay';
  if (dateStr === tomorrow) return 'Ngày mai';
  if (dateStr === dayAfter) return 'Ngày kia';

  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

export function calculateSessionTotals(session?: TableSession): {
  subtotal: number;
  totalItems: number;
  batchCount: number;
} {
  if (!session || !session.batches) {
    return { subtotal: 0, totalItems: 0, batchCount: 0 };
  }

  let subtotal = 0;
  let totalItems = 0;

  session.batches.forEach((batch) => {
    batch.items.forEach((item) => {
      if (item.status !== 'cancelled') {
        subtotal += item.price * item.quantity;
        totalItems += item.quantity;
      }
    });
  });

  return {
    subtotal,
    totalItems,
    batchCount: session.batches.length,
  };
}

export function generateOrderCode(): string {
  const now = new Date();
  const dateStr = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `HD-${dateStr}-${randomSuffix}`;
}

/**
 * Tính mốc khóa bàn trước 3 tiếng (Ví dụ: khách đến 19:30 -> Khóa từ 16:30)
 */
export function calculateLockFromTime(bookingTime: string): string {
  try {
    const [hStr, mStr] = bookingTime.split(':');
    let hours = parseInt(hStr, 10);
    const minutes = mStr || '00';
    hours = (hours - 3 + 24) % 24;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } catch {
    return '16:00';
  }
}

/**
 * Tính mốc tự động hủy sau 30 phút kể từ giờ khách đặt (Ví dụ: khách hẹn 19:30 -> Tự hủy lúc 20:00)
 */
export function calculateAutoCancelTime(bookingTime: string): string {
  try {
    const [hStr, mStr] = bookingTime.split(':');
    let hours = parseInt(hStr, 10);
    let minutes = parseInt(mStr || '0', 10) + 30;
    if (minutes >= 60) {
      hours = (hours + Math.floor(minutes / 60)) % 24;
      minutes = minutes % 60;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } catch {
    return '20:00';
  }
}

/**
 * Chuyển đổi tham chiếu thời gian thành Date object
 */
function parseReferenceDate(ref?: Date | string): Date {
  if (!ref) return new Date();
  if (ref instanceof Date) return ref;

  if (typeof ref === 'string') {
    if (ref.includes(':') && !ref.includes('-')) {
      // Dạng HH:mm trong ngày hôm nay
      const [h, m] = ref.split(':').map(Number);
      const d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
      return d;
    }
    return new Date(ref);
  }
  return new Date();
}

/**
 * Đánh giá trạng thái đặt bàn theo quy tắc:
 * 1. Nếu chưa đến mốc 3 tiếng trước giờ khách đến: status = 'upcoming_waiting' -> VẪN ĐÓN KHÁCH VÃNG LAI (Bàn xanh)
 * 2. Trong khoảng 3 tiếng trước giờ khách đến -> giờ khách đến + 30p: status = 'locked_holding' -> KHÓA BÀN (Bàn xanh dương)
 * 3. Quá 30 phút kể từ giờ hẹn mà chưa check-in: status = 'auto_cancelled' -> TỰ ĐỘNG HỦY, MỞ BÀN XANH LÁ
 */
export function evaluateReservationStatus(
  reservation: OnlineReservation,
  referenceNow?: Date | string
): {
  status: ReservationStatus;
  diffMinutes: number;
  shouldLockTable: boolean;
  statusText: string;
} {
  const refDate = parseReferenceDate(referenceNow);

  // Nếu đã check-in hoặc đã hủy thủ công thì giữ nguyên
  if (reservation.status === 'checked_in') {
    return {
      status: 'checked_in',
      diffMinutes: 0,
      shouldLockTable: false,
      statusText: 'Đã nhận khách vào bàn',
    };
  }
  if (reservation.status === 'cancelled') {
    return {
      status: 'cancelled',
      diffMinutes: 0,
      shouldLockTable: false,
      statusText: 'Đã hủy đặt bàn',
    };
  }

  // Parse thời điểm khách hẹn
  const [bYear, bMonth, bDay] = reservation.bookingDate.split('-').map(Number);
  const [bHour, bMinute] = reservation.bookingTime.split(':').map(Number);
  const targetDate = new Date(bYear, bMonth - 1, bDay, bHour, bMinute, 0);

  // Khoảng cách theo phút giữa giờ hẹn và thời gian hiện tại
  // diffMinutes > 0: Còn bao nhiêu phút nữa khách mới đến
  // diffMinutes < 0: Đã trễ bao nhiêu phút so với giờ hẹn
  const diffMinutes = Math.round((targetDate.getTime() - refDate.getTime()) / (1000 * 60));

  if (diffMinutes > 180) {
    // Còn hơn 3 tiếng nữa khách mới đến -> Bàn vẫn xanh, được đón khách vãng lai
    const hoursLeft = Math.floor(diffMinutes / 60);
    const minsLeft = diffMinutes % 60;
    return {
      status: 'upcoming_waiting',
      diffMinutes,
      shouldLockTable: false,
      statusText: `Chờ đến giờ (Còn ${hoursLeft}h${minsLeft > 0 ? ` ${minsLeft}p` : ''} - Vẫn cho nhận khách vãng lai)`,
    };
  } else if (diffMinutes <= 180 && diffMinutes >= -30) {
    // Đang trong khoảng 3 tiếng trước giờ hẹn đến 30 phút sau giờ hẹn -> KHÓA BÀN!
    if (diffMinutes >= 0) {
      const hoursLeft = Math.floor(diffMinutes / 60);
      const minsLeft = diffMinutes % 60;
      return {
        status: 'locked_holding',
        diffMinutes,
        shouldLockTable: true,
        statusText: `Đang khóa giữ bàn (Khách đến sau ${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}p - Cấm khách vãng lai)`,
      };
    } else {
      const overdueMins = Math.abs(diffMinutes);
      return {
        status: 'locked_holding',
        diffMinutes,
        shouldLockTable: true,
        statusText: `Khách trễ ${overdueMins} phút (Tự hủy sau ${30 - overdueMins} phút nếu không tới)`,
      };
    }
  } else {
    // Đã trễ hơn 30 phút -> TỰ ĐỘNG HỦY! Mở lại bàn màu xanh
    const overdueMins = Math.abs(diffMinutes);
    return {
      status: 'auto_cancelled',
      diffMinutes,
      shouldLockTable: false,
      statusText: `Tự động hủy (Khách trễ ${overdueMins} phút quá hạn 30p - Bàn đã mở lại màu xanh)`,
    };
  }
}

/**
 * Trả về trực tiếp mã trạng thái ReservationStatus
 */
export function getReservationStatusValue(
  reservation: OnlineReservation,
  referenceNow?: Date | string
): ReservationStatus {
  return evaluateReservationStatus(reservation, referenceNow).status;
}
