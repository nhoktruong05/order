import React, { useState } from 'react';
import { Table, OnlineReservation } from '../types';
import { formatVND, calculateSessionTotals, formatDateLabel, getTodayDateString } from '../utils/formatters';
import { ReservationSection } from './ReservationSection';
import { 
  Utensils, Users, User, Clock, QrCode, Receipt, CheckCircle2, 
  Search, Calendar, Phone, UserCheck, XCircle, Lock, Unlock, 
  AlertTriangle, Sparkles, ChevronDown, ChevronUp, Layers
} from 'lucide-react';

interface StaffViewProps {
  tables: Table[];
  reservations: OnlineReservation[];
  onSelectTable: (table: Table) => void;
  onOpenCustomerQrForTable: (tableId: string) => void;
  onRequestPayment: (table: Table) => void;
  onOpenReservationModal: (tableId?: string) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  simulatedTimeLabel?: string;
  onSimulateTime?: (mode: 'real' | 'before_3h' | 'inside_3h' | 'after_30m') => void;
  currentSimMode?: string;
}

export const StaffView: React.FC<StaffViewProps> = ({
  tables,
  reservations,
  onSelectTable,
  onOpenCustomerQrForTable,
  onRequestPayment,
  onOpenReservationModal,
  onCheckInReservation,
  onCancelReservation,
  simulatedTimeLabel,
  onSimulateTime,
  currentSimMode = 'real',
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'available' | 'occupied' | 'reserved' | 'payment_pending'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showReservationArea, setShowReservationArea] = useState<boolean>(true);

  const todayStr = getTodayDateString();

  const filteredTables = [...tables].filter((table) => {
    if (selectedStatusFilter !== 'all' && table.status !== selectedStatusFilter) {
      return false;
    }
    if (searchKeyword && !table.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (selectedStatusFilter === 'reserved') {
      const resA = reservations.find(
        (r) => r.tableId === a.id && (r.status === 'locked_holding' || r.status === 'upcoming_waiting')
      );
      const resB = reservations.find(
        (r) => r.tableId === b.id && (r.status === 'locked_holding' || r.status === 'upcoming_waiting')
      );
      if (resA && resB) {
        return `${resA.bookingDate}T${resA.bookingTime}`.localeCompare(`${resB.bookingDate}T${resB.bookingTime}`);
      }
      if (resA) return -1;
      if (resB) return 1;
    }
    return 0;
  });

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const pendingPaymentCount = tables.filter((t) => t.status === 'payment_pending').length;

  return (
    <div id="staff-view-container" className="space-y-6">
      {/* BANNER 1: Header Staff & Quầy Thu Ngân */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              Giao diện 1: Staff & Bàn Thu Ngân
            </span>
            <span className="text-xs text-stone-500 font-medium">1 Khu Vực Chung Toàn Nhà Hàng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Sơ Đồ Bàn & Điều Phối Đặt Chỗ
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Khách quét QR gọi món nhiều lần. Dùng bữa xong, khách đến <b>Bàn Thu Ngân</b> thanh toán → bàn chuyển sang <b className="text-emerald-700">Màu Xanh</b>. Hỗ trợ đặt bàn đa ngày (Hôm nay, Ngày mai, Ngày kia) với <b>khóa trước 3 tiếng</b> và <b>tự hủy sau 30 phút</b>.
          </p>
        </div>

        {/* Thông tin đặt bàn đã xác nhận */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{reservations.length} Lịch Đặt Chỗ Đã Xác Nhận</span>
          </div>
        </div>
      </div>

      {/* THANH MÔ PHỎNG THỜI GIAN ĐỂ TEST NGHIỆP VỤ 3 TIẾNG & 30 PHÚT */}
      {onSimulateTime && (
        <div className="bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                  Mô phỏng thời gian kiểm thử nghiệp vụ:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white">
                  {simulatedTimeLabel || 'Giờ thực tế'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                (Bấm các nút dưới đây để xem Bàn 04 & Bàn 08 tự động đổi màu xanh / xanh dương / tự hủy theo quy tắc)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onSimulateTime('before_3h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentSimMode === 'before_3h'
                  ? 'bg-emerald-500 text-stone-950 shadow-xs ring-2 ring-emerald-300'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              1. Lúc 15:00 (&gt;3h: Bàn Xanh đón khách)
            </button>

            <button
              type="button"
              onClick={() => onSimulateTime('inside_3h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentSimMode === 'inside_3h'
                  ? 'bg-blue-500 text-white shadow-xs ring-2 ring-blue-300'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              2. Lúc 17:30 (&lt;3h: Khóa Bàn Xanh Dương)
            </button>

            <button
              type="button"
              onClick={() => onSimulateTime('after_30m')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentSimMode === 'after_30m'
                  ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-300'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              3. Lúc 20:05 (&gt;30p: Tự Hủy, Mở Lại Bàn Xanh)
            </button>

            <button
              type="button"
              onClick={() => onSimulateTime('real')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentSimMode === 'real'
                  ? 'bg-stone-700 text-white ring-1 ring-stone-500'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Giờ thực
            </button>
          </div>
        </div>
      )}

      {/* Widget Bàn Thu Ngân: Nếu có bàn đang chờ thanh toán tại quầy */}
      {pendingPaymentCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-600 to-amber-600 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Có {pendingPaymentCount} bàn đang đến BÀN THU NGÂN để thanh toán!
              </h3>
              <p className="text-xs text-white/90">
                {tables.filter((t) => t.status === 'payment_pending').map((t) => t.name).join(', ')} • Vui lòng tiếp nhận và xuất hóa đơn tại quầy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const pendingTable = tables.find((t) => t.status === 'payment_pending');
              if (pendingTable) onRequestPayment(pendingTable);
            }}
            className="px-4 py-2 bg-white text-stone-900 font-bold text-xs rounded-xl shadow-xs hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            Thanh toán tại quầy ngay
          </button>
        </div>
      )}

      {/* KHU VỰC HIỂN THỊ DANH SÁCH ĐẶT BÀN (Hôm nay, Ngày mai, Ngày kia) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setShowReservationArea(!showReservationArea)}
            className="flex items-center gap-2 text-xs font-black uppercase text-stone-700 hover:text-stone-900 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>1 Khu vực hiển thị danh sách đặt bàn</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800 font-bold">
              {reservations.length} lịch hẹn
            </span>
            {showReservationArea ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showReservationArea && (
          <ReservationSection
            reservations={reservations}
            tables={tables}
            onOpenNewReservation={() => onOpenReservationModal()}
            onCheckInReservation={onCheckInReservation}
            onCancelReservation={onCancelReservation}
            simulatedTimeLabel={simulatedTimeLabel}
          />
        )}
      </div>

      {/* Thanh bộ lọc trạng thái màu sắc bàn */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tất cả bàn ({tables.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('available')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedStatusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bàn trống (Xanh): {availableCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('reserved')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedStatusFilter === 'reserved'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Đang Khóa 3h (Xanh Dương): {reservedCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('occupied')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedStatusFilter === 'occupied'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Đang ăn (Vàng): {occupiedCount}</span>
          </button>

          {pendingPaymentCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('payment_pending')}
              className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selectedStatusFilter === 'payment_pending'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Tại Quầy Thu Ngân ({pendingPaymentCount})</span>
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bàn (vd: Bàn 04)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* GRID CÁC BÀN TRONG NHÀ HÀNG (1 KHU VỰC DUY NHẤT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isAvailable = table.status === 'available';
          const isOccupied = table.status === 'occupied';
          const isPendingPayment = table.status === 'payment_pending';
          const isReserved = table.status === 'reserved';

          const session = table.currentSession;
          const totals = calculateSessionTotals(session);
          const batchesCount = session?.batches.length || 0;

          // Tìm thông tin đặt bàn liên quan
          const linkedReservation = reservations.find(
            (r) => r.tableId === table.id && (r.status === 'locked_holding' || r.status === 'upcoming_waiting')
          );

          return (
            <div
              key={table.id}
              id={`table-card-${table.id}`}
              onClick={() => onSelectTable(table)}
              className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between group select-none shadow-xs hover:shadow-md ${
                isAvailable
                  ? 'bg-gradient-to-b from-emerald-50/70 to-emerald-100/30 border-emerald-400 hover:border-emerald-600'
                  : isReserved
                  ? 'bg-gradient-to-b from-blue-50/80 to-indigo-100/50 border-blue-500 hover:border-blue-600 ring-2 ring-blue-300'
                  : isPendingPayment
                  ? 'bg-gradient-to-b from-rose-50/80 to-rose-100/40 border-rose-400 hover:border-rose-600 ring-2 ring-rose-300 animate-pulse'
                  : 'bg-gradient-to-b from-amber-50/80 to-amber-100/40 border-amber-400 hover:border-amber-600'
              }`}
            >
              {/* Header của thẻ bàn */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2.5 rounded-xl ${
                      isAvailable 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : isReserved
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isPendingPayment
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-600 text-white shadow-xs'
                    }`}>
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">
                        {table.name}
                      </h3>
                      <span className="text-[11px] text-stone-500 font-medium">
                        Sức chứa: {table.capacity} người
                      </span>
                    </div>
                  </div>

                  {/* Badge trạng thái chuẩn màu sắc */}
                  {isAvailable && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      🟢 BÀN TRỐNG
                    </span>
                  )}
                  {isReserved && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 🔵 ĐANG KHÓA BÀN
                    </span>
                  )}
                  {isOccupied && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      🟡 ĐANG PHỤC VỤ
                    </span>
                  )}
                  {isPendingPayment && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-200 text-rose-900 border border-rose-400">
                      🔴 ĐẾN BÀN THU NGÂN
                    </span>
                  )}
                </div>

                {/* NỘI DUNG 1: BÀN TRỐNG (MÀU XANH) */}
                {isAvailable && (
                  <div className="my-4 space-y-2">
                    <div className="py-2.5 px-3 bg-white/90 rounded-xl border border-emerald-200/80 text-center space-y-1">
                      <div className="text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sẵn sàng nhận khách vãng lai
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Bàn đã dọn sạch • Quét QR gọi món lần 1
                      </p>
                    </div>

                    {/* Nếu có lịch đặt trước nhưng còn > 3 tiếng (ngày mai/ngày kia hoặc tối nay) */}
                    {linkedReservation && linkedReservation.status === 'upcoming_waiting' && (
                      <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs space-y-1.5 text-left">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                          <span className="font-bold text-blue-950 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            {linkedReservation.customerName}
                          </span>
                          <span className="text-[11px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.2 rounded">
                            {linkedReservation.guestCount} khách
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-stone-700 text-[11px]">
                          <span className="text-stone-500">Giờ đến:</span>
                          <b className="text-stone-900 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {linkedReservation.bookingTime} ({formatDateLabel(linkedReservation.bookingDate)})
                          </b>
                        </div>

                        <div className="flex items-center justify-between text-stone-500 text-[11px]">
                          <span>SĐT:</span>
                          <b className="text-stone-800">{linkedReservation.phone}</b>
                        </div>

                        <p className="text-[11px] text-emerald-700 font-medium pt-0.5 border-t border-blue-100/70">
                          ✓ Còn &gt;3 tiếng: <b>Vẫn cho nhận khách vãng lai!</b>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* NỘI DUNG 2: BÀN ĐANG KHÓA (TRONG KHOẢNG 3 TIẾNG TRƯỚC GIỜ HẸN) */}
                {isReserved && linkedReservation && (
                  <div className="my-4 p-3 bg-white/95 rounded-xl border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                      <span className="font-bold text-blue-950 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> {linkedReservation.customerName}
                      </span>
                      <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {linkedReservation.guestCount} khách
                      </span>
                    </div>

                    <div className="space-y-1 text-stone-600 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>Giờ khách đến:</span>
                        <b className="text-stone-900 text-xs font-bold">
                          {linkedReservation.bookingTime} ({formatDateLabel(linkedReservation.bookingDate)})
                        </b>
                      </div>
                      <div className="flex items-center justify-between text-blue-900 font-medium">
                        <span>Khóa bàn từ:</span>
                        <b className="bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded font-bold">
                          {linkedReservation.lockFromTime} (trước 3 tiếng)
                        </b>
                      </div>
                      <div className="flex items-center justify-between text-rose-700 font-medium">
                        <span>Tự hủy nếu trễ:</span>
                        <b>{linkedReservation.autoCancelTime} (sau 30p)</b>
                      </div>
                      <div className="flex items-center gap-1 text-stone-500 pt-0.5">
                        <Phone className="w-3 h-3 text-stone-400" /> {linkedReservation.phone}
                      </div>
                      <div className="text-[11px] font-bold text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 text-center">
                        ✕ KHÓA BÀN: CẤM NHẬN KHÁCH VÃNG LAI
                      </div>
                    </div>
                  </div>
                )}

                {/* NỘI DUNG 3: BÀN ĐANG CÓ KHÁCH (GỌI MÓN LẦN 1, 2, 3...) */}
                {(isOccupied || isPendingPayment) && (
                  <div className="my-4 space-y-3">
                    <div className="flex items-center justify-between text-xs bg-white/90 p-2.5 rounded-xl border border-stone-200">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Vào: <b>{session?.startedAt}</b></span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md text-[11px]">
                        ĐÃ GỌI {batchesCount} LẦN
                      </div>
                    </div>

                    {/* Danh sách các lần gọi thu gọn */}
                    <div className="space-y-1.5">
                      {session?.batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="bg-white/90 rounded-lg p-2 text-xs border border-stone-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded-md text-[10px]">
                              Lần {batch.batchNumber}
                            </span>
                            <span className="text-stone-500 text-[11px]">{batch.timestamp}</span>
                            <span className="text-stone-700 font-medium truncate max-w-[120px]">
                              {batch.items.map((i) => i.name).join(', ')}
                            </span>
                          </div>
                          <span className="font-semibold text-stone-800 text-[11px]">
                            {batch.items.reduce((s, i) => s + i.quantity, 0)} món
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tổng tiền hiện tại của bàn */}
                    <div className="bg-stone-900 text-white rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-stone-300">Tổng tạm tính:</span>
                      <span className="text-base font-black text-emerald-400">
                        {formatVND(totals.subtotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* NÚT BẤM THAO TÁC DƯỚI CHÂN BÀN */}
              <div 
                className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2 mt-auto" 
                onClick={(e) => e.stopPropagation()}
              >
                {isAvailable && (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => onOpenCustomerQrForTable(table.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Quét QR gọi Lần 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReservationModal(table.id)}
                      title="Đặt trước bàn này (Hôm nay / Ngày mai / Ngày kia)"
                      className="p-2 bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isReserved && linkedReservation && (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => onCheckInReservation(linkedReservation.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Khách đến & Nhận bàn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelReservation(linkedReservation.id)}
                      title="Hủy đặt bàn này (mở lại bàn xanh)"
                      className="p-2 bg-white text-rose-600 border border-rose-300 hover:bg-rose-50 rounded-xl text-xs cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {(isOccupied || isPendingPayment) && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenCustomerQrForTable(table.id)}
                      title="Mô phỏng khách quét mã gọi thêm"
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gọi lần {batchesCount + 1}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestPayment(table)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ra Bàn Thu Ngân</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
