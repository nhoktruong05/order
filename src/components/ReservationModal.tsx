import React, { useState } from 'react';
import { Table, OnlineReservation } from '../types';
import { 
  calculateLockFromTime, 
  calculateAutoCancelTime, 
  getCurrentTime,
  getTodayDateString,
  getOffsetDateString,
  formatDateLabel
} from '../utils/formatters';
import { Calendar, Clock, Phone, User, Users, X, CheckCircle2, ShieldAlert, AlertTriangle, Lock, Smartphone } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  preSelectedTableId?: string;
  onConfirmReservation: (tableId: string, reservation: OnlineReservation) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  tables,
  preSelectedTableId,
  onConfirmReservation,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getOffsetDateString(1);
  const dayAfterTomorrowStr = getOffsetDateString(2);

  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [selectedTableId, setSelectedTableId] = useState<string>(
    preSelectedTableId || tables[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [bookingTime, setBookingTime] = useState('19:30');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const lockFromTime = calculateLockFromTime(bookingTime);
  const autoCancelTime = calculateAutoCancelTime(bookingTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!selectedTableId) {
      setError('Vui lòng chọn bàn muốn đặt');
      return;
    }

    const newReservation: OnlineReservation = {
      id: `res-${Date.now()}`,
      tableId: selectedTableId,
      tableName: tables.find((t) => t.id === selectedTableId)?.name || 'Bàn',
      customerName: customerName.trim(),
      phone: phone.trim(),
      guestCount,
      bookingDate,
      bookingTime,
      lockFromTime,
      autoCancelTime,
      createdAt: getCurrentTime(),
      note: note.trim() || undefined,
      status: 'upcoming_waiting', // Will be evaluated according to current time
    };

    onConfirmReservation(selectedTableId, newReservation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div 
        id="reservation-modal-container"
        className="relative flex flex-col w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn h-[94vh] sm:h-auto sm:max-h-[95vh]"
      >
        {/* Header mô phỏng Giao diện Đặt Bàn Online dành cho Khách Hàng (User) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">Đặt Bàn Online (User)</h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20 text-white whitespace-nowrap">
                  Khách Đặt
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100">
                Giao diện khách hàng truy cập đặt chỗ tại Bếp Quê Quán
              </p>
            </div>
          </div>
          <button
            id="btn-close-reservation-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-sm flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn Ngày Đặt Bàn (Hôm nay / Ngày mai / Ngày kia / Tùy chọn) */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
              Chọn ngày khách đến:
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { label: 'Hôm nay', value: todayStr },
                { label: 'Ngày mai', value: tomorrowStr },
                { label: 'Ngày kia', value: dayAfterTomorrowStr },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setBookingDate(d.value)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    bookingDate === d.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {d.label}
                  <span className="block text-[10px] font-normal opacity-80">
                    {d.value.split('-').slice(1).reverse().join('/')}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 whitespace-nowrap">Hoặc chọn ngày khác:</span>
              <input
                type="date"
                min={todayStr}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Chọn Bàn */}
          <div>
            <label htmlFor="res-table-select" className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
              Chọn bàn muốn đặt ({formatDateLabel(bookingDate)}):
            </label>
            <select
              id="res-table-select"
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Sức chứa: {t.capacity} người)
                </option>
              ))}
            </select>
          </div>

          {/* Tên khách & SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="res-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Tên khách hàng:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="res-name"
                  type="text"
                  placeholder="VD: Chị Hoàng Thu Thảo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="res-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                Số điện thoại:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="res-phone"
                  type="tel"
                  placeholder="VD: 0912.345.678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Giờ đến & Số lượng khách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="res-time" className="block text-xs font-semibold text-stone-700 mb-1">
                Giờ khách đến ăn:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="res-time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="res-guests" className="block text-xs font-semibold text-stone-700 mb-1">
                Số lượng khách:
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="res-guests"
                  type="number"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 2)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Box Chi tiết Quy tắc nghiệp vụ 3 tiếng & 30 phút tự hủy */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Lock className="w-4 h-4 text-blue-700" />
              <span>CƠ CHẾ KHÓA BÀN 3 TIẾNG & TỰ HỦY 30 PHÚT:</span>
            </div>

            <div className="space-y-1.5 text-stone-700">
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-stone-600">1. Giờ khách hẹn đến:</span>
                <b className="text-blue-900 text-sm font-black">{bookingTime} ({formatDateLabel(bookingDate)})</b>
              </div>

              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-100">
                <div>
                  <span className="text-stone-600 block">2. Bắt đầu khóa bàn (3 tiếng trước):</span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ✓ Trước {lockFromTime}: Bàn VẪN NHẬN KHÁCH VÃNG LAI (Màu xanh)
                  </span>
                </div>
                <b className="text-indigo-900 text-sm font-black">{lockFromTime}</b>
              </div>

              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-100">
                <div>
                  <span className="text-stone-600 block">3. Tự động hủy nếu trễ (sau 30 phút):</span>
                  <span className="text-[11px] text-rose-600 font-medium">
                    ✕ Nếu sau {autoCancelTime} khách không tới: TỰ HỦY & MỞ LẠI BÀN XANH
                  </span>
                </div>
                <b className="text-rose-700 text-sm font-black">{autoCancelTime}</b>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label htmlFor="res-note" className="block text-xs font-semibold text-stone-700 mb-1">
              Ghi chú thêm:
            </label>
            <input
              id="res-note"
              type="text"
              placeholder="VD: Đặt tiệc sinh nhật, cần ghế trẻ em, bàn cạnh cửa sổ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-800 rounded-xl hover:bg-stone-100 cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Hủy
            </button>
            <button
              id="btn-confirm-reservation"
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Đặt Bàn (Gửi Đến Nhà Hàng)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
