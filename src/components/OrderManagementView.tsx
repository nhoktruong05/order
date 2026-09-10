import React, { useState } from 'react';
import { CompletedOrder, OrderBatch, Table, OnlineReservation } from '../types';
import { formatVND, formatDateLabel } from '../utils/formatters';
import { 
  Receipt, Clock, Search, Filter, Calendar, QrCode, 
  Banknote, Eye, Printer, ChevronRight, ArrowUpDown, History,
  TrendingUp, Utensils, CheckCircle2, DollarSign, Users, Phone,
  Lock, Unlock, AlertTriangle, XCircle, UserCheck, ArrowLeft
} from 'lucide-react';

interface OrderManagementViewProps {
  completedOrders: CompletedOrder[];
  tables: Table[];
  reservations?: OnlineReservation[];
  onPrintOrder: (order: CompletedOrder) => void;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  completedOrders,
  tables,
  reservations = [],
  onPrintOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations'>('orders');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<CompletedOrder | null>(
    completedOrders[0] || null
  );
  const [mobileDetailView, setMobileDetailView] = useState<boolean>(false);

  // Thống kê tổng hợp
  const totalRevenue = completedOrders.reduce((sum, ord) => sum + ord.finalAmount, 0);
  const totalOrdersCount = completedOrders.length;
  const totalBatchesCount = completedOrders.reduce((sum, ord) => sum + ord.batches.length, 0);
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Lọc các đặt bàn online
  const activeHoldingCount = reservations.filter((r) => r.status === 'locked_holding').length;
  const upcomingWaitingCount = reservations.filter((r) => r.status === 'upcoming_waiting').length;

  // Lọc đơn hàng
  const filteredOrders = completedOrders.filter((order) => {
    const matchSearch =
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMethod = selectedMethod === 'all' || order.paymentMethod === selectedMethod;

    return matchSearch && matchMethod;
  });

  return (
    <div id="order-management-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-stone-900 text-white rounded-full">
              Giao diện 2: Quản Lý Đơn Hàng & Lịch Sử Gọi Món
            </span>
            <span className="text-xs text-stone-500 font-medium">Toàn bộ nhà hàng (1 Khu Vực Chung)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Lịch Sử Các Lần Gọi Món & Thanh Toán Tại Bàn Thu Ngân
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Theo dõi chi tiết khách gọi món từ mấy giờ, tại bàn nào, lịch sử đợt 1, 2, 3 và thời gian thanh toán hoàn tất tại quầy.
          </p>
        </div>

        {/* Nút in nhanh hoặc xuất */}
        <div className="flex items-center gap-2">
          {selectedOrderForDetail && (
            <button
              type="button"
              onClick={() => onPrintOrder(selectedOrderForDetail)}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>In đơn {selectedOrderForDetail.orderCode}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Khối Thống Kê Tổng Quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-500">Doanh thu thu ngân</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-700 mt-1.5 sm:mt-2 truncate">
            {formatVND(totalRevenue)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 sm:mt-1 truncate">Tại quầy thu ngân</div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-500">Đơn đã phục vụ</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-stone-900 mt-1.5 sm:mt-2">
            {totalOrdersCount} đơn
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 sm:mt-1 truncate">Đã chuyển xanh</div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-500">Tổng đợt gọi món</span>
            <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-stone-900 mt-1.5 sm:mt-2">
            {totalBatchesCount} lượt gọi
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 sm:mt-1 truncate">Khách quét QR 1, 2, 3...</div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-500">Đặt bàn online</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-blue-800 mt-1.5 sm:mt-2">
            {reservations.length} lượt hẹn
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 sm:mt-1 truncate">
            {activeHoldingCount} đang khóa 3h • {upcomingWaitingCount} chờ nhận khách
          </div>
        </div>
      </div>

      {/* Tabs chuyển đổi giữa Lịch sử Đơn hàng và Danh sách Đặt bàn Online */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Lịch Sử Đơn Hàng & Các Lần Gọi ({filteredOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Quản Lý Lịch Đặt Bàn Đa Ngày (Khóa 3h & Tự Hủy) ({reservations.length})</span>
        </button>
      </div>

      {activeTab === 'reservations' ? (
        /* TAB 2: QUẢN LÝ TẤT CẢ CÁC ĐẶT BÀN ONLINE ĐA NGÀY */
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Toàn Bộ Lịch Đặt Bàn Online (Hôm nay, Ngày mai, Ngày kia)
              </h3>
              <p className="text-xs text-stone-500">
                Tự động khóa bàn trước 3 tiếng trước giờ khách đến. Nếu sau 30 phút khách không tới thì hệ thống tự động hủy.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full shrink-0">
              Quy tắc: Khóa trước 3 tiếng • Tự hủy sau 30 phút
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              Chưa có lịch đặt bàn nào trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...reservations]
                .sort((a, b) => `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`))
                .map((res) => {
                const targetTable = tables.find((t) => t.id === res.tableId);
                const isHolding = res.status === 'locked_holding';
                const isWaiting = res.status === 'upcoming_waiting';
                const isAutoCancelled = res.status === 'auto_cancelled';
                const isCancelled = res.status === 'cancelled';
                const isCheckedIn = res.status === 'checked_in';

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      isHolding
                        ? 'border-blue-300 bg-gradient-to-b from-blue-50/70 to-white ring-2 ring-blue-200 shadow-xs'
                        : isWaiting
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isAutoCancelled
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-stone-200 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-900">{res.tableName}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {formatDateLabel(res.bookingDate)}
                        </span>
                      </div>

                      {isHolding && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Đang khóa bàn (3h)
                        </span>
                      )}
                      {isWaiting && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Còn &gt;3h (Đón khách)
                        </span>
                      )}
                      {isAutoCancelled && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ Tự hủy (Trễ 30p)
                        </span>
                      )}
                      {isCancelled && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                          Đã hủy
                        </span>
                      )}
                      {isCheckedIn && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          ✓ Đã nhận bàn
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-700">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Khách đặt:</span>
                        <b className="text-stone-900">{res.customerName} ({res.guestCount} người)</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Số điện thoại:</span>
                        <b className="text-stone-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" /> {res.phone}
                        </b>
                      </div>
                      <div className="flex justify-between bg-stone-100 p-2 rounded-lg">
                        <span className="font-medium text-stone-700">Giờ hẹn đến:</span>
                        <b className="text-stone-900 font-bold">{res.bookingTime}</b>
                      </div>
                      <div className="flex justify-between bg-blue-50 p-2 rounded-lg text-blue-950 font-medium">
                        <span>Khóa trước 3 tiếng từ:</span>
                        <b>{res.lockFromTime}</b>
                      </div>
                      <div className="flex justify-between bg-rose-50 p-2 rounded-lg text-rose-950 font-medium">
                        <span>Tự hủy nếu trễ:</span>
                        <b>{res.autoCancelTime}</b>
                      </div>
                      {res.note && (
                        <div className="text-[11px] text-stone-500 italic pt-0.5">
                          "{res.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 1: LỊCH SỬ ĐƠN HÀNG */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: BẢNG DANH SÁCH ĐƠN HÀNG (7 cols) */}
          <div className={`space-y-4 ${mobileDetailView ? 'hidden lg:block lg:col-span-7' : 'lg:col-span-7'}`}>
            {/* Thanh công cụ lọc & tìm kiếm */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm mã đơn, tên bàn (vd: Bàn 02)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Lọc phương thức thanh toán */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'transfer_qr', label: 'VietQR' },
                  { id: 'cash', label: 'Tiền mặt' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedMethod === m.id
                        ? 'bg-stone-900 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách đơn dạng cards */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-stone-200 text-center text-stone-500 text-sm">
                  Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderForDetail?.id === order.id;
                  const totalDishes = order.batches.reduce(
                    (sum, b) => sum + b.items.reduce((s, it) => s + it.quantity, 0),
                    0
                  );

                  return (
                    <div
                      key={order.id}
                      id={`order-row-${order.id}`}
                      onClick={() => {
                        setSelectedOrderForDetail(order);
                        setMobileDetailView(true);
                      }}
                      className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{order.orderCode}</span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-800">
                              {order.tableName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              {order.startedAt} → {order.completedAt} ({order.durationMinutes}p)
                            </span>
                            <span>•</span>
                            <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                              {order.batches.length} đợt gọi ({totalDishes} món)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-stone-900">
                            {formatVND(order.finalAmount)}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Đã TT tại Quầy
                            </span>
                            <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              {order.paymentMethod === 'transfer_qr' ? 'VietQR' : 'Tiền mặt'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline tóm tắt nhanh các lần gọi */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-stone-500 overflow-x-auto">
                          <span className="font-semibold text-stone-700 shrink-0">Lịch sử:</span>
                          {order.batches.map((b) => (
                            <span key={b.id} className="text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 shrink-0">
                              Lần {b.batchNumber}: {b.timestamp}
                            </span>
                          ))}
                        </div>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5 text-xs shrink-0">
                          Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT ĐƠN HÀNG & LỊCH SỬ CÁC LẦN GỌI (5 cols) */}
          <div className={`${!mobileDetailView ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-5'}`}>
            {selectedOrderForDetail ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden sticky top-4">
                {/* Nút quay lại trên mobile */}
                <div className="lg:hidden p-3 bg-stone-100 border-b border-stone-200 flex items-center">
                  <button
                    type="button"
                    onClick={() => setMobileDetailView(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng
                  </button>
                </div>

                {/* Header chi tiết */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
                  <div>
                    <div className="text-xs text-stone-400 font-medium">Chi tiết Đơn hàng</div>
                    <h3 className="text-base sm:text-lg font-bold">{selectedOrderForDetail.orderCode}</h3>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                      {selectedOrderForDetail.tableName} • Đã thanh toán tại Bàn Thu Ngân
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPrintOrder(selectedOrderForDetail)}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                    title="In hóa đơn này"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Thông tin thời gian & phục vụ */}
                <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-stone-600">
                    <span>Thời gian bắt đầu gọi:</span>
                    <b className="text-stone-800">{selectedOrderForDetail.startedAt}</b>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Thời gian thanh toán tại quầy:</span>
                    <b className="text-stone-800">{selectedOrderForDetail.completedAt} ({selectedOrderForDetail.durationMinutes} phút)</b>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Số lượng khách:</span>
                    <b className="text-stone-800">{selectedOrderForDetail.guestCount} người</b>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Thu ngân phụ trách:</span>
                    <b className="text-stone-800">{selectedOrderForDetail.cashierName}</b>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Hình thức thanh toán:</span>
                    <b className="text-emerald-700 font-bold uppercase">
                      {selectedOrderForDetail.paymentMethod === 'transfer_qr'
                        ? 'Chuyển khoản VietQR'
                        : 'Tiền mặt'}
                    </b>
                  </div>
                </div>

                {/* PHẦN QUAN TRỌNG: LỊCH SỬ CÁC LẦN GỌI MÓN (TỪ MẤY GIỜ, TẠI BÀN NÀY) */}
                <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    LỊCH SỬ TỪNG ĐỢT GỌI MÓN (TỪ MẤY GIỜ):
                  </div>

                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {selectedOrderForDetail.batches.map((batch: OrderBatch) => {
                      const batchSum = batch.items.reduce((s, it) => s + it.price * it.quantity, 0);

                      return (
                        <div key={batch.id} className="relative group">
                          {/* Dot trên timeline */}
                          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></div>

                          {/* Thẻ đợt gọi */}
                          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                                  Lần gọi {batch.batchNumber}
                                </span>
                                <span className="text-stone-500 font-medium">
                                  Lúc <b>{batch.timestamp}</b>
                                </span>
                              </div>
                              <span className="font-bold text-stone-800">
                                {formatVND(batchSum)}
                              </span>
                            </div>

                            <div className="text-[11px] text-stone-400">
                              {batch.source === 'qr_customer' ? '📱 Khách quét mã QR tại bàn' : '👨‍🍳 Nhân viên ghi bàn'}
                              {batch.note && ` • Ghi chú: "${batch.note}"`}
                            </div>

                            {/* Danh sách món gọi ở lần này */}
                            <div className="divide-y divide-stone-200/60 pt-1 text-xs">
                              {batch.items.map((it) => (
                                <div key={it.id} className="py-1.5 flex justify-between items-center text-stone-700">
                                  <div>
                                    <span className="font-semibold text-stone-900">{it.name}</span>
                                    {it.note && <span className="text-[10px] text-stone-400 block">"{it.note}"</span>}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-stone-500">
                                      {it.quantity} × {formatVND(it.price)}
                                    </span>
                                    <div className="font-bold text-stone-800">
                                      {formatVND(it.price * it.quantity)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Tổng kết thanh toán */}
                <div className="p-4 bg-stone-100 border-t border-stone-200 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600 text-xs">
                    <span>Tạm tính tiền món:</span>
                    <span>{formatVND(selectedOrderForDetail.subtotal)}</span>
                  </div>
                  {selectedOrderForDetail.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                      <span>Giảm giá ({selectedOrderForDetail.discountPercent}%):</span>
                      <span>-{formatVND(selectedOrderForDetail.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline font-black text-stone-900 text-base pt-1 border-t border-stone-300">
                    <span>Tổng tiền đã thu tại quầy:</span>
                    <span className="text-emerald-700 text-xl font-mono">
                      {formatVND(selectedOrderForDetail.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
                Chọn một đơn hàng từ danh sách để xem lịch sử chi tiết các lần gọi món.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
