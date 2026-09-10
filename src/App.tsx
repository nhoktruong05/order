import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, CompletedOrder, MenuItem, ItemStatus, OrderBatch, 
  TableSession, OnlineReservation, ReservationStatus 
} from './types';
import { INITIAL_TABLES, INITIAL_COMPLETED_ORDERS, INITIAL_RESERVATIONS } from './data/mockData';
import { 
  getCurrentTime, getFullDateTime, evaluateReservationStatus, 
  getTodayDateString, calculateLockFromTime, calculateAutoCancelTime 
} from './utils/formatters';
import { Navbar } from './components/Navbar';
import { StaffView } from './components/StaffView';
import { OrderManagementView } from './components/OrderManagementView';
import { TableDetailModal } from './components/TableDetailModal';
import { PaymentModal } from './components/PaymentModal';
import { BillPrintModal } from './components/BillPrintModal';
import { CustomerQrModal } from './components/CustomerQrModal';
import { ReservationModal } from './components/ReservationModal';
import { Bell, CheckCircle2, QrCode, Calendar, Clock, AlertTriangle } from 'lucide-react';

const STORAGE_KEY_TABLES = 'bep_que_quan_tables_v3';
const STORAGE_KEY_ORDERS = 'bep_que_quan_orders_v3';
const STORAGE_KEY_RESERVATIONS = 'bep_que_quan_reservations_v3';

export default function App() {
  // 1. Quản lý trạng thái bàn (Khởi tạo từ localStorage nếu có)
  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TABLES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TABLES;
  });

  // 2. Quản lý lịch sử đơn hàng (Giao diện 2)
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMPLETED_ORDERS;
  });

  // 3. Quản lý danh sách đặt bàn online (Hôm nay, Ngày mai, Ngày kia)
  const [reservations, setReservations] = useState<OnlineReservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RESERVATIONS;
  });

  // Chế độ mô phỏng thời gian (để kiểm tra nghiệp vụ khóa 3 tiếng & tự hủy 30 phút)
  const [currentSimMode, setCurrentSimMode] = useState<'real' | 'before_3h' | 'inside_3h' | 'after_30m'>('real');
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  // Chuyển đổi giữa 2 giao diện: 'staff' (Giao diện 1) hoặc 'orders' (Giao diện 2)
  const [currentView, setCurrentView] = useState<'staff' | 'orders'>('staff');

  // Quản lý các modals
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<Table | null>(null);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<Table | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<CompletedOrder | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrPreselectedTableId, setQrPreselectedTableId] = useState<string | undefined>(undefined);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [reservationPreselectedTableId, setReservationPreselectedTableId] = useState<string | undefined>(undefined);

  // Toast thông báo realtime
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'order' | 'payment' | 'reservation' | 'cancel' } | null>(null);

  // Lưu vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
    } catch (e) {
      console.error(e);
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(completedOrders));
    } catch (e) {
      console.error(e);
    }
  }, [completedOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
    } catch (e) {
      console.error(e);
    }
  }, [reservations]);

  // Âm thanh thông báo
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const showToast = (title: string, desc: string, type: 'order' | 'payment' | 'reservation' | 'cancel') => {
    setToastMessage({ title, desc, type });
    playNotificationSound();
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Giờ hiện tại hiệu dụng (giờ thực hoặc giờ mô phỏng)
  const effectiveCurrentTime = simulatedTime || getCurrentTime();

  // NGHIỆP VỤ CỐT LÕI: Tự động đánh giá trạng thái bàn theo thời gian và lịch hẹn online
  // - Nếu chưa đến giờ khóa (> 3 tiếng): Bàn vẫn màu xanh (available), nhận khách vãng lai
  // - Nếu trong khoảng 3 tiếng: Bàn chuyển sang reserved (màu xanh dương), khóa không cho nhận khách vãng lai
  // - Nếu trễ quá 30 phút: Tự động hủy (auto_cancelled), mở lại bàn màu xanh (available)
  const reEvaluateReservationsAndTables = useCallback((activeTime: string) => {
    let hasUpdatedStatus = false;

    // 1. Cập nhật trạng thái từng đơn đặt chỗ
    const updatedReservations = reservations.map((res) => {
      // Nếu đã hoàn tất check-in hoặc nhân viên chủ động hủy thì giữ nguyên
      if (res.status === 'checked_in' || res.status === 'cancelled') {
        return res;
      }

      const evaluated = evaluateReservationStatus(res, activeTime);

      if (evaluated.status !== res.status) {
        hasUpdatedStatus = true;
        return {
          ...res,
          status: evaluated.status,
        };
      }
      return res;
    });

    if (hasUpdatedStatus) {
      setReservations(updatedReservations);
    }

    // 2. Cập nhật trạng thái các bàn dựa trên các đơn đặt chỗ đã đánh giá
    setTables((prevTables) =>
      prevTables.map((tbl) => {
        // Nếu bàn đang có khách ăn (occupied hoặc payment_pending) thì không can thiệp trạng thái ăn
        if (tbl.status === 'occupied' || tbl.status === 'payment_pending') {
          return tbl;
        }

        // Tìm xem bàn này có lịch đặt nào đang trong khung giờ khóa 3 tiếng (locked_holding) không
        const holdingRes = updatedReservations.find(
          (r) => r.tableId === tbl.id && r.status === 'locked_holding'
        );

        if (holdingRes) {
          // Khóa bàn thành màu xanh dương
          if (tbl.status !== 'reserved') {
            return {
              ...tbl,
              status: 'reserved',
              reservation: holdingRes,
            };
          }
          return tbl;
        }

        // Nếu bàn đang ở trạng thái 'reserved' nhưng lịch hẹn đã chuyển sang auto_cancelled / đã hủy / hoặc còn > 3 tiếng
        if (tbl.status === 'reserved') {
          // Kiểm tra xem có đơn nào đang khóa không
          const stillHolding = updatedReservations.some(
            (r) => r.tableId === tbl.id && r.status === 'locked_holding'
          );

          if (!stillHolding) {
            // MỞ LẠI BÀN MÀU XANH (available)
            return {
              ...tbl,
              status: 'available',
              reservation: undefined,
            };
          }
        }

        return tbl;
      })
    );
  }, [reservations]);

  // Chạy định kỳ mỗi 30 giây để cập nhật trạng thái thời gian thực
  useEffect(() => {
    if (currentSimMode === 'real') {
      reEvaluateReservationsAndTables(getCurrentTime());
      const interval = setInterval(() => {
        reEvaluateReservationsAndTables(getCurrentTime());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentSimMode, reEvaluateReservationsAndTables]);

  // Bộ điều khiển mô phỏng thời gian (cho phép người dùng thử nghiệm tức thì)
  const handleSimulateTime = (mode: 'real' | 'before_3h' | 'inside_3h' | 'after_30m') => {
    setCurrentSimMode(mode);

    if (mode === 'real') {
      setSimulatedTime(null);
      reEvaluateReservationsAndTables(getCurrentTime());
      showToast('Đã quay về Giờ Thực Tế', `Hệ thống cập nhật theo thời gian hiện hành (${getCurrentTime()}).`, 'reservation');
    } else if (mode === 'before_3h') {
      // 15:00: Bàn 04 có lịch hẹn 19:30 (còn 4.5 tiếng > 3 tiếng) -> Bàn màu xanh lá, cho nhận khách vãng lai
      setSimulatedTime('15:00');
      reEvaluateReservationsAndTables('15:00');
      showToast(
        '🕒 Mô phỏng 15:00 (Còn >3 tiếng)',
        'Bàn 04 có hẹn lúc 19:30 nhưng còn hơn 3 tiếng. Bàn chuyển sang MÀU XANH LÁ sẵn sàng đón khách vãng lai!',
        'order'
      );
    } else if (mode === 'inside_3h') {
      // 17:30: Bàn 04 có lịch hẹn 19:30 (còn 2 tiếng < 3 tiếng) -> Bàn khóa màu xanh dương, cấm khách vãng lai
      setSimulatedTime('17:30');
      reEvaluateReservationsAndTables('17:30');
      showToast(
        '🔒 Mô phỏng 17:30 (Trong khoảng 3 tiếng)',
        'Bàn 04 bước vào khung giờ khóa 3 tiếng (từ 16:30). Bàn tự động chuyển sang MÀU XANH DƯƠNG và CẤM khách vãng lai vào!',
        'reservation'
      );
    } else if (mode === 'after_30m') {
      // 20:05: Bàn 04 hẹn 19:30, quá 30 phút khách không tới -> Tự động hủy, mở lại bàn màu xanh
      setSimulatedTime('20:05');
      reEvaluateReservationsAndTables('20:05');
      showToast(
        '✕ Mô phỏng 20:05 (Quá 30 phút trễ)',
        'Khách hẹn lúc 19:30 không đến sau 30 phút. Hệ thống ĐÃ TỰ ĐỘNG HỦY và MỞ LẠI BÀN 04 SANG MÀU XANH LÁ để nhận khách tiếp theo!',
        'cancel'
      );
    }
  };

  // Đồng bộ lại selectedTableForDetail nếu bảng thay đổi trong state
  const activeDetailTable = selectedTableForDetail
    ? tables.find((t) => t.id === selectedTableForDetail.id) || null
    : null;

  // NGHIỆP VỤ 1: Khách quét mã QR tại bàn gọi món (Lần 1, Lần 2, Lần 3...)
  const handlePlaceOrder = (
    tableId: string,
    items: { menuItem: MenuItem; quantity: number; note?: string }[],
    guestCount: number
  ) => {
    const timeNow = effectiveCurrentTime;
    const fullDateNow = getFullDateTime();

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id !== tableId) return table;

        const isAlreadyOccupied = table.status === 'occupied' || table.status === 'payment_pending';
        const existingSession = table.currentSession;

        if (!isAlreadyOccupied || !existingSession) {
          // BÀN MỚI (LẦN 1)
          const newBatch: OrderBatch = {
            id: `batch-${Date.now()}-1`,
            batchNumber: 1,
            timestamp: timeNow,
            fullDateTime: fullDateNow,
            source: 'qr_customer',
            note: 'Khách quét QR lần đầu tại bàn',
            items: items.map((it, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              menuItemId: it.menuItem.id,
              name: it.menuItem.name,
              price: it.menuItem.price,
              quantity: it.quantity,
              note: it.note,
              status: 'pending',
              orderedAt: timeNow,
            })),
          };

          const newSession: TableSession = {
            sessionId: `sess-${Date.now()}`,
            tableId: table.id,
            tableName: table.name,
            startedAt: timeNow,
            fullStartDateTime: fullDateNow,
            guestCount: guestCount || 2,
            status: 'active',
            batches: [newBatch],
          };

          showToast(
            `🔔 ${table.name} có đơn gọi món mới!`,
            `Khách vừa quét mã QR gọi Lần 1 lúc ${timeNow} (${items.length} món). Bàn chuyển sang Đang Phục Vụ.`,
            'order'
          );

          return {
            ...table,
            status: 'occupied',
            currentSession: newSession,
            reservation: undefined, // Xóa giữ bàn nếu khách đã nhận và gọi món
          };
        } else {
          // BÀN ĐANG CÓ KHÁCH: GỌI THÊM (LẦN 2, LẦN 3...)
          const nextBatchNumber = (existingSession.batches?.length || 0) + 1;

          const newBatch: OrderBatch = {
            id: `batch-${Date.now()}-${nextBatchNumber}`,
            batchNumber: nextBatchNumber,
            timestamp: timeNow,
            fullDateTime: fullDateNow,
            source: 'qr_customer',
            note: `Khách quét QR gọi thêm đợt ${nextBatchNumber}`,
            items: items.map((it, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              menuItemId: it.menuItem.id,
              name: it.menuItem.name,
              price: it.menuItem.price,
              quantity: it.quantity,
              note: it.note,
              status: 'pending',
              orderedAt: timeNow,
            })),
          };

          showToast(
            `🔔 ${table.name} gọi thêm món (Lần ${nextBatchNumber})!`,
            `Khách quét QR gọi thêm lúc ${timeNow} (${items.length} món). Vui lòng chuẩn bị món cho bàn!`,
            'order'
          );

          return {
            ...table,
            status: 'occupied',
            currentSession: {
              ...existingSession,
              batches: [...existingSession.batches, newBatch],
            },
          };
        }
      })
    );
  };

  // NGHIỆP VỤ 2: Nhân viên cập nhật trạng thái từng món trong đợt gọi
  const handleUpdateItemStatus = (
    tableId: string,
    batchId: string,
    itemId: string,
    newStatus: ItemStatus
  ) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId || !t.currentSession) return t;
        return {
          ...t,
          currentSession: {
            ...t.currentSession,
            batches: t.currentSession.batches.map((b) => {
              if (b.id !== batchId) return b;
              return {
                ...b,
                items: b.items.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)),
              };
            }),
          },
        };
      })
    );
  };

  // NGHIỆP VỤ 3: Nhân viên thêm món trực tiếp tại bàn
  const handleStaffAddItems = (
    tableId: string,
    items: { menuItem: MenuItem; quantity: number; note?: string }[]
  ) => {
    const timeNow = effectiveCurrentTime;
    const fullDateNow = getFullDateTime();

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId || !t.currentSession) return t;
        const nextBatchNum = t.currentSession.batches.length + 1;

        const newBatch: OrderBatch = {
          id: `batch-staff-${Date.now()}`,
          batchNumber: nextBatchNum,
          timestamp: timeNow,
          fullDateTime: fullDateNow,
          source: 'staff_pos',
          note: `Nhân viên phục vụ ghi trực tiếp (Lần ${nextBatchNum})`,
          items: items.map((it, idx) => ({
            id: `item-staff-${Date.now()}-${idx}`,
            menuItemId: it.menuItem.id,
            name: it.menuItem.name,
            price: it.menuItem.price,
            quantity: it.quantity,
            note: it.note,
            status: 'preparing',
            orderedAt: timeNow,
          })),
        };

        return {
          ...t,
          currentSession: {
            ...t.currentSession,
            batches: [...t.currentSession.batches, newBatch],
          },
        };
      })
    );
  };

  // NGHIỆP VỤ 4: Khách ra bàn thu ngân để thanh toán
  const handleRequestPayment = (table: Table) => {
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, status: 'payment_pending' } : t))
    );
    setSelectedTableForDetail(null);
    setSelectedTableForPayment(table);
  };

  // NGHIỆP VỤ 5: Xác nhận thanh toán TẠI BÀN THU NGÂN & KẾT THÚC BÀN -> CHUYỂN SANG MÀU XANH LÁ
  const handleConfirmPayment = (completedOrder: CompletedOrder) => {
    // 1. Reset bàn về MÀU XANH LÁ (available) và xóa session
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== completedOrder.tableId) return t;
        return {
          ...t,
          status: 'available', // Chuyển sang MÀU XANH LÁ để nhận khách tiếp theo
          currentSession: undefined,
          reservation: undefined,
        };
      })
    );

    // 2. Đẩy đơn hàng vào Lịch sử đơn hàng (Giao diện 2)
    setCompletedOrders((prev) => [completedOrder, ...prev]);

    // 3. Đóng popup thanh toán & hiển thị hóa đơn in
    setSelectedTableForPayment(null);
    setOrderToPrint(completedOrder);

    // 4. Thông báo toast
    showToast(
      `✅ Thu ngân đã thanh toán xong ${completedOrder.tableName}!`,
      `Khách đã thanh toán ${new Intl.NumberFormat('vi-VN').format(completedOrder.finalAmount)} đ tại bàn thu ngân. Bàn đã chuyển sang MÀU XANH LÁ sẵn sàng đón khách tiếp theo!`,
      'payment'
    );
  };

  // NGHIỆP VỤ 6: Khách đặt bàn online (Hôm nay, Ngày mai, Ngày kia)
  const handleConfirmReservation = (tableId: string, newRes: OnlineReservation) => {
    const updated = [newRes, ...reservations];
    setReservations(updated);

    // Đánh giá xem có cần khóa ngay không (nếu là hôm nay và trong vòng 3 tiếng)
    const evaluated = evaluateReservationStatus(newRes, effectiveCurrentTime);

    if (evaluated.status === 'locked_holding') {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId && t.status === 'available' ? { ...t, status: 'reserved', reservation: newRes } : t))
      );
      showToast(
        `🔒 Đã khóa bàn cho khách đặt online!`,
        `Bàn đã khóa trước 3 tiếng (từ ${newRes.lockFromTime}) cho khách ${newRes.customerName}. Giờ đến: ${newRes.bookingTime}.`,
        'reservation'
      );
    } else {
      showToast(
        `📅 Đặt bàn online thành công!`,
        `Đã lưu lịch đặt cho khách ${newRes.customerName} lúc ${newRes.bookingTime}. Hệ thống vẫn cho nhận khách vãng lai vì còn hơn 3 tiếng nữa mới khóa.`,
        'reservation'
      );
    }
  };

  // NGHIỆP VỤ 7: Khách đặt online đã đến nhà hàng & nhận bàn
  const handleCheckInReservation = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    const timeNow = effectiveCurrentTime;
    const fullDateNow = getFullDateTime();

    const newSession: TableSession = {
      sessionId: `sess-${Date.now()}`,
      tableId: res.tableId,
      tableName: res.tableName,
      startedAt: timeNow,
      fullStartDateTime: fullDateNow,
      guestCount: res.guestCount,
      status: 'active',
      batches: [],
    };

    // Cập nhật trạng thái reservation sang checked_in
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'checked_in' } : r))
    );

    // Chuyển bàn sang Đang phục vụ (occupied)
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== res.tableId) return t;
        return {
          ...t,
          status: 'occupied',
          currentSession: newSession,
          reservation: undefined,
        };
      })
    );

    showToast(
      `👋 Khách ${res.customerName} đã nhận ${res.tableName}!`,
      `Khách đã vào bàn. Sẵn sàng quét mã QR tại bàn để gọi món!`,
      'order'
    );
  };

  // NGHIỆP VỤ 8: Hủy đặt bàn online (Thủ công)
  const handleCancelReservation = (reservationId: string) => {
    const targetRes = reservations.find((r) => r.id === reservationId);
    if (!targetRes) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
    );

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== targetRes.tableId) return t;
        return {
          ...t,
          status: 'available', // Mở lại màu xanh lá
          reservation: undefined,
        };
      })
    );

    showToast(
      `Đã hủy đặt bàn`,
      `Bàn ${targetRes.tableName} đã được mở lại thành Bàn Trống (Màu Xanh Lá) để đón khách vãng lai.`,
      'cancel'
    );
  };

  // Đặt lại dữ liệu ban đầu
  const handleResetDemoData = () => {
    if (confirm('Bạn có muốn đặt lại toàn bộ dữ liệu bàn, đơn hàng và lịch đặt bàn ban đầu?')) {
      setTables(INITIAL_TABLES);
      setCompletedOrders(INITIAL_COMPLETED_ORDERS);
      setReservations(INITIAL_RESERVATIONS);
      setCurrentSimMode('real');
      setSimulatedTime(null);
      localStorage.removeItem(STORAGE_KEY_TABLES);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.removeItem(STORAGE_KEY_RESERVATIONS);
      showToast('Đã phục hồi dữ liệu mẫu', 'Hệ thống đã trở về trạng thái ban đầu.', 'payment');
    }
  };

  const occupiedCount = tables.filter((t) => t.status === 'occupied' || t.status === 'payment_pending').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Navbar điều hướng giữa 2 giao diện */}
      <Navbar
        currentView={currentView}
        onSwitchView={setCurrentView}
        onOpenQrSimulator={() => {
          setQrPreselectedTableId(undefined);
          setIsQrModalOpen(true);
        }}
        occupiedCount={occupiedCount}
        availableCount={availableCount}
        onResetDemoData={handleResetDemoData}
      />

      {/* Thông báo Toast Realtime */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce">
          <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              toastMessage.type === 'payment' 
                ? 'bg-emerald-600 text-white' 
                : toastMessage.type === 'reservation'
                ? 'bg-blue-600 text-white'
                : toastMessage.type === 'cancel'
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-stone-950'
            }`}>
              {toastMessage.type === 'payment' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toastMessage.type === 'reservation' ? (
                <Calendar className="w-5 h-5" />
              ) : toastMessage.type === 'cancel' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">{toastMessage.title}</h4>
              <p className="text-xs text-stone-300 mt-0.5">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'staff' ? (
          /* GIAO DIỆN 1: MÀN HÌNH STAFF PHỤC VỤ (SƠ ĐỒ BÀN 1 KHU VỰC, ĐẶT ONLINE GIỮ 3H & TỰ HỦY 30P, THU NGÂN THANH TOÁN CHUYỂN XANH) */
          <StaffView
            tables={tables}
            reservations={reservations}
            onSelectTable={(table) => setSelectedTableForDetail(table)}
            onOpenCustomerQrForTable={(tableId) => {
              setQrPreselectedTableId(tableId);
              setIsQrModalOpen(true);
            }}
            onRequestPayment={(table) => handleRequestPayment(table)}
            onOpenReservationModal={(tableId) => {
              setReservationPreselectedTableId(tableId);
              setIsReservationModalOpen(true);
            }}
            onCheckInReservation={handleCheckInReservation}
            onCancelReservation={handleCancelReservation}
            simulatedTimeLabel={simulatedTime ? `Đang mô phỏng ${simulatedTime}` : undefined}
            onSimulateTime={handleSimulateTime}
            currentSimMode={currentSimMode}
          />
        ) : (
          /* GIAO DIỆN 2: QUẢN LÝ ĐƠN HÀNG TẠI NHÀ HÀNG (LỊCH SỬ CÁC LẦN GỌI TỪ MẤY GIỜ, TẠI BÀN NÀO) */
          <OrderManagementView
            completedOrders={completedOrders}
            tables={tables}
            reservations={reservations}
            onPrintOrder={(order) => setOrderToPrint(order)}
          />
        )}
      </main>

      {/* MODAL 1: Chi tiết bàn khi nhân viên bấm vào bàn */}
      <TableDetailModal
        table={activeDetailTable}
        reservations={reservations}
        isOpen={Boolean(selectedTableForDetail)}
        onClose={() => setSelectedTableForDetail(null)}
        onUpdateItemStatus={handleUpdateItemStatus}
        onOpenCustomerQrForTable={(tableId) => {
          setSelectedTableForDetail(null);
          setQrPreselectedTableId(tableId);
          setIsQrModalOpen(true);
        }}
        onStaffAddItems={handleStaffAddItems}
        onRequestPayment={(table) => handleRequestPayment(table)}
        onCheckInReservation={handleCheckInReservation}
        onCancelReservation={handleCancelReservation}
        onOpenReservationModal={(tableId) => {
          setSelectedTableForDetail(null);
          setReservationPreselectedTableId(tableId);
          setIsReservationModalOpen(true);
        }}
      />

      {/* MODAL 2: Bàn Thu Ngân - Thanh toán & Kết thúc bàn (Chuyển sang màu xanh lá) */}
      <PaymentModal
        table={selectedTableForPayment}
        isOpen={Boolean(selectedTableForPayment)}
        onClose={() => setSelectedTableForPayment(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* MODAL 3: In hoặc xem hóa đơn chi tiết */}
      <BillPrintModal
        order={orderToPrint}
        isOpen={Boolean(orderToPrint)}
        onClose={() => setOrderToPrint(null)}
      />

      {/* MODAL 4: Mô phỏng khách quét QR tại bàn để gọi món (Lần 1 hoặc gọi thêm Lần 2, Lần 3) */}
      <CustomerQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={tables}
        reservations={reservations}
        preSelectedTableId={qrPreselectedTableId}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* MODAL 5: Đặt bàn trực tuyến - Hỗ trợ Hôm nay, Ngày mai, Ngày kia - Khóa trước 3 tiếng & Tự hủy sau 30 phút */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        tables={tables}
        preSelectedTableId={reservationPreselectedTableId}
        onConfirmReservation={handleConfirmReservation}
      />
    </div>
  );
}
