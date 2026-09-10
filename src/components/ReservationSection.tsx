import React, { useState } from 'react';
import { OnlineReservation, Table } from '../types';
import { 
  formatDateLabel, 
  getTodayDateString, 
  getOffsetDateString 
} from '../utils/formatters';
import { 
  Calendar, Clock, Phone, User, Users, Lock, Unlock, 
  CheckCircle2, Search, ListFilter, Smartphone, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

interface ReservationSectionProps {
  reservations: OnlineReservation[];
  tables: Table[];
  onOpenNewReservation?: () => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation?: (reservationId: string) => void;
  simulatedTimeLabel?: string;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({
  reservations,
  tables,
  onOpenNewReservation,
  onCheckInReservation,
  onCancelReservation,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getOffsetDateString(1);
  const dayAfterTomorrowStr = getOffsetDateString(2);

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Lọc danh sách đặt bàn
  const filteredReservations = reservations.filter((res) => {
    // Lọc theo ngày
    if (dateFilter === 'today' && res.bookingDate !== todayStr) return false;
    if (dateFilter === 'tomorrow' && res.bookingDate !== tomorrowStr) return false;
    if (dateFilter === 'after_tomorrow' && res.bookingDate !== dayAfterTomorrowStr) return false;

    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = res.customerName.toLowerCase().includes(q);
      const matchPhone = res.phone.includes(q);
      const matchTable = res.tableName.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchTable) return false;
    }

    return true;
  });

  // Sắp xếp danh sách các bàn đã đặt theo thời gian (Ngày đến & Giờ đến)
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    const dateTimeA = `${a.bookingDate}T${a.bookingTime}`;
    const dateTimeB = `${b.bookingDate}T${b.bookingTime}`;
    return sortOrder === 'asc'
      ? dateTimeA.localeCompare(dateTimeB)
      : dateTimeB.localeCompare(dateTimeA);
  });

  const countToday = reservations.filter((r) => r.bookingDate === todayStr).length;
  const countTomorrow = reservations.filter((r) => r.bookingDate === tomorrowStr).length;
  const countAfterTomorrow = reservations.filter((r) => r.bookingDate === dayAfterTomorrowStr).length;

  return (
    <div 
      id="reservation-section-container"
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4"
    >
      {/* Header khu vực hiển thị danh sách các bàn có khách đặt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Danh Sách Các Bàn Có Khách Đặt
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {reservations.length} lượt hẹn
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tự động sắp xếp theo <b>thời gian khách đến</b> (từ sớm đến muộn) • Quy tắc khóa trước 3 tiếng & tự hủy sau 30 phút
            </p>
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {onOpenNewReservation && (
            <button
              id="btn-simulate-user-booking"
              type="button"
              onClick={onOpenNewReservation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Mở thử giao diện mà user truy cập để đặt bàn trực tuyến"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Thử Cổng Đặt Bàn (User)</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh công cụ: Lọc ngày, Sắp xếp theo thời gian & Tìm kiếm */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <span className="text-xs font-bold text-stone-500 mr-1 shrink-0 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" /> Ngày đến:
          </span>
          {[
            { id: 'all', label: `Tất cả (${reservations.length})` },
            { id: 'today', label: `Hôm nay (${countToday})` },
            { id: 'tomorrow', label: `Ngày mai (${countTomorrow})` },
            { id: 'after_tomorrow', label: `Ngày kia (${countAfterTomorrow})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                dateFilter === item.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Nút đổi chiều sắp xếp thời gian */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              sortOrder === 'asc'
                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Bấm để đảo chiều sắp xếp thời gian"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Thời gian: {sortOrder === 'asc' ? 'Sớm nhất trước (Tăng dần)' : 'Muộn nhất trước (Giảm dần)'}</span>
          </button>
        </div>

        <div className="relative w-full md:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm tên khách, SĐT, số bàn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* HIỂN THỊ DẠNG BẢNG (TABLE VIEW) - RÕ RÀNG, DỄ ĐỐI CHIẾU */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <th className="py-3 px-3.5 whitespace-nowrap">BÀN</th>
                <th className="py-3 px-3.5 whitespace-nowrap">THÔNG TIN NGƯỜI ĐẶT</th>
                <th 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-stone-200 transition-colors select-none group"
                  title="Nhấn để đổi chiều sắp xếp theo thời gian đến"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GIỜ ĐẾN & NGÀY ĐẾN</span>
                    {sortOrder === 'asc' ? (
                      <span className="flex items-center text-blue-600 gap-0.5 text-[11px] font-bold">
                        <ArrowUp className="w-3.5 h-3.5" /> (Sớm nhất)
                      </span>
                    ) : (
                      <span className="flex items-center text-blue-600 gap-0.5 text-[11px] font-bold">
                        <ArrowDown className="w-3.5 h-3.5" /> (Muộn nhất)
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-3.5 whitespace-nowrap">TRẠNG THÁI KHÓA GIỮ BÀN</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {sortedReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 text-xs">
                    Không có thông tin đặt bàn nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                sortedReservations.map((res) => {
                  const table = tables.find((t) => t.id === res.tableId);
                  const isHolding = res.status === 'locked_holding';
                  const isWaiting = res.status === 'upcoming_waiting';
                  const isCheckedIn = res.status === 'checked_in';
                  const isAutoCancelled = res.status === 'auto_cancelled';

                  return (
                    <tr 
                      key={res.id}
                      className={`hover:bg-stone-50 transition-colors ${
                        isHolding ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      {/* Cột 1: Bàn */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-sm text-stone-900">{res.tableName}</div>
                        <div className="text-[11px] text-stone-500">Sức chứa: {table?.capacity || 4} khách</div>
                      </td>

                      {/* Cột 2: Thông tin người đặt */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{res.customerName}</span>
                          <span className="font-semibold text-xs px-2 py-0.2 rounded-full bg-stone-100 text-stone-700">
                            {res.guestCount} người
                          </span>
                        </div>
                        <div className="text-stone-500 text-xs mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{res.phone}</span>
                        </div>
                        {res.note && (
                          <div className="text-[11px] text-stone-400 italic mt-0.5">"{res.note}"</div>
                        )}
                      </td>

                      {/* Cột 3: Giờ đến */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-base font-black text-stone-900">{res.bookingTime}</span>
                        </div>
                        <div className="text-xs font-semibold text-stone-600 mt-0.5">
                          Ngày: <b className="text-stone-800">{formatDateLabel(res.bookingDate)}</b> ({res.bookingDate})
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái khóa giữ bàn */}
                      <td className="py-3 px-3.5">
                        {isHolding && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-bold border border-blue-300">
                            <Lock className="w-3 h-3 text-blue-700" />
                            <span>Đang khóa bàn 3h (CẤM khách vãng lai)</span>
                          </div>
                        )}
                        {isWaiting && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Còn &gt;3h (Vẫn cho nhận khách vãng lai)</span>
                          </div>
                        )}
                        {isCheckedIn && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-purple-600" />
                            <span>Khách đã nhận bàn</span>
                          </div>
                        )}
                        {isAutoCancelled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Tự động hủy (Trễ quá 30p)
                          </span>
                        )}
                        <div className="text-[11px] text-stone-400 mt-1">
                          Khóa từ {res.lockFromTime} • Hủy sau {res.autoCancelTime}
                        </div>
                      </td>

                      {/* Cột 5: Thao tác khi khách đến */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {!isCheckedIn && !isAutoCancelled ? (
                          <button
                            type="button"
                            onClick={() => onCheckInReservation(res.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Khách đến (Vào bàn)
                          </button>
                        ) : isCheckedIn ? (
                          <span className="text-xs text-stone-500 font-medium">Đang ăn</span>
                        ) : (
                          <span className="text-xs text-stone-400">Đã hủy</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
};
