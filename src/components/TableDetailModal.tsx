import React, { useState } from 'react';
import { Table, ItemStatus, OrderBatch, MenuItem, OnlineReservation } from '../types';
import { MENU_ITEMS } from '../data/mockData';
import { formatVND, calculateSessionTotals, formatDateLabel } from '../utils/formatters';
import { 
  X, Clock, Users, Utensils, CheckCircle, AlertCircle, 
  Receipt, Plus, QrCode, ChefHat, Sparkles, Calendar, 
  Phone, UserCheck, XCircle, ArrowRight, Lock, Unlock
} from 'lucide-react';

interface TableDetailModalProps {
  table: Table | null;
  reservations?: OnlineReservation[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateItemStatus: (tableId: string, batchId: string, itemId: string, newStatus: ItemStatus) => void;
  onOpenCustomerQrForTable: (tableId: string) => void;
  onStaffAddItems: (tableId: string, items: { menuItem: MenuItem; quantity: number; note?: string }[]) => void;
  onRequestPayment: (table: Table) => void;
  onCheckInReservation?: (reservationId: string) => void;
  onCancelReservation?: (reservationId: string) => void;
  onOpenReservationModal?: (tableId: string) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  table,
  reservations = [],
  isOpen,
  onClose,
  onUpdateItemStatus,
  onOpenCustomerQrForTable,
  onStaffAddItems,
  onRequestPayment,
  onCheckInReservation,
  onCancelReservation,
  onOpenReservationModal,
}) => {
  const [showAddDishDrawer, setShowAddDishDrawer] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedStaffItems, setSelectedStaffItems] = useState<Record<string, number>>({});

  if (!isOpen || !table) return null;

  const session = table.currentSession;
  const isOccupied = table.status === 'occupied' || table.status === 'payment_pending';
  const isReserved = table.status === 'reserved';
  const totals = calculateSessionTotals(session);

  // Tìm thông tin đặt bàn đang hoạt động
  const activeReservation = reservations.find(
    (r) => r.tableId === table.id && (r.status === 'locked_holding' || r.status === 'upcoming_waiting')
  );

  const handleStaffConfirmAdd = () => {
    const itemsToAdd = Object.entries(selectedStaffItems)
      .filter(([_, qty]) => typeof qty === 'number' && qty > 0)
      .map(([id, quantity]) => ({
        menuItem: MENU_ITEMS.find((m) => m.id === id)!,
        quantity: Number(quantity),
      }));

    if (itemsToAdd.length > 0) {
      onStaffAddItems(table.id, itemsToAdd);
      setSelectedStaffItems({});
      setShowAddDishDrawer(false);
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Đã ra món
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
            <ChefHat className="w-3 h-3" /> Đang chế biến
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-800">
            Đã hủy
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" /> Chờ làm
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div 
        id="table-detail-modal" 
        className="relative flex flex-col w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[94vh] sm:h-auto sm:max-h-[92vh] border border-stone-200"
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-white shrink-0 ${
          table.status === 'available'
            ? 'bg-gradient-to-r from-emerald-600 to-green-600'
            : table.status === 'reserved'
            ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
            : table.status === 'payment_pending'
            ? 'bg-gradient-to-r from-rose-600 to-stone-900'
            : 'bg-gradient-to-r from-amber-600 to-amber-700'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/20 rounded-xl shrink-0">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold">{table.name}</h2>
                {table.status === 'available' && (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold whitespace-nowrap">
                    🟢 BÀN TRỐNG
                  </span>
                )}
                {table.status === 'reserved' && (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-950 font-bold flex items-center gap-1 whitespace-nowrap">
                    <Lock className="w-3 h-3" /> 🔵 ĐANG KHÓA BÀN 3H
                  </span>
                )}
                {table.status === 'occupied' && (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold whitespace-nowrap">
                    🟡 ĐANG DÙNG ({session?.batches.length || 0} LẦN GỌI)
                  </span>
                )}
                {table.status === 'payment_pending' && (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 font-bold animate-pulse whitespace-nowrap">
                    🔴 TẠI QUẦY THU NGÂN
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-white/80 mt-0.5">
                Sức chứa: {table.capacity} khách
                {session && ` • Giờ vào: ${session.startedAt} • Số khách: ${session.guestCount}`}
              </p>
            </div>
          </div>

          <button
            id="btn-close-table-detail"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chính dựa trên trạng thái */}

        {/* 1. TRẠNG THÁI ĐANG KHÓA BÀN (TRƯỚC 3 TIẾNG) */}
        {isReserved && activeReservation && (
          <div className="p-8 space-y-6 bg-stone-50/50 my-auto">
            <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-blue-900 border-b border-blue-100 pb-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Thông Tin Khách Đặt Bàn</h3>
                  <p className="text-xs text-stone-500">Khóa bàn trước 3 tiếng • Tự hủy sau 30 phút</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tên khách hàng:</span>
                  <b className="text-stone-900">{activeReservation.customerName}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số điện thoại:</span>
                  <b className="text-stone-900 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> {activeReservation.phone}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ngày đến:</span>
                  <b className="text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
                    {formatDateLabel(activeReservation.bookingDate)}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số lượng người:</span>
                  <b className="text-stone-900">{activeReservation.guestCount} người</b>
                </div>
                <div className="flex justify-between bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  <span className="text-blue-900 font-medium">Giờ khách hẹn:</span>
                  <b className="text-blue-950 text-base">{activeReservation.bookingTime}</b>
                </div>
                <div className="flex justify-between bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-indigo-900 font-medium">Khóa giữ bàn từ:</span>
                  <b className="text-indigo-950 font-bold">{activeReservation.lockFromTime} (trước 3 tiếng)</b>
                </div>
                <div className="flex justify-between bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                  <span className="text-rose-900 font-medium">Tự hủy nếu trễ:</span>
                  <b className="text-rose-950 font-bold">{activeReservation.autoCancelTime} (sau 30 phút)</b>
                </div>
                {activeReservation.note && (
                  <div className="pt-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    Ghi chú: "{activeReservation.note}"
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center gap-3 border-t border-stone-200">
                {onCancelReservation && (
                  <button
                    type="button"
                    onClick={() => {
                      onCancelReservation(activeReservation.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Hủy giữ bàn</span>
                  </button>
                )}

                {onCheckInReservation && (
                  <button
                    type="button"
                    onClick={() => {
                      onCheckInReservation(activeReservation.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Khách đến & Nhận bàn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. TRẠNG THÁI BÀN TRỐNG (MÀU XANH) */}
        {table.status === 'available' && (
          <div className="p-10 flex flex-col items-center justify-center text-center my-auto space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-800">Bàn này hiện đang trống (Màu xanh)</h3>
              <p className="text-stone-500 text-sm max-w-md mt-1">
                Bàn sạch sẽ sẵn sàng đón khách. Khách có thể quét mã QR tại bàn gọi món lần 1, hoặc đặt trước online cho ngày hôm nay, ngày mai, ngày kia.
              </p>
            </div>

            {/* Nếu có đặt trước tương lai (>3h) */}
            {activeReservation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs max-w-md text-left">
                <div className="font-bold text-blue-950 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Bàn có lịch hẹn: {activeReservation.bookingTime} ({formatDateLabel(activeReservation.bookingDate)})
                </div>
                <div className="text-stone-600 mt-0.5">
                  Khách: <b>{activeReservation.customerName}</b> ({activeReservation.guestCount} người).
                  Vì còn hơn 3 tiếng nữa mới đến giờ nên bàn <b>vẫn được đón khách vãng lai bình thường</b>!
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                id="btn-open-qr-first-time"
                onClick={() => onOpenCustomerQrForTable(table.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Khách quét QR gọi món (Lần 1)</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. TRẠNG THÁI ĐANG PHỤC VỤ HOẶC CHỜ THU NGÂN */}
        {isOccupied && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Thanh tóm tắt */}
            <div className="bg-stone-50 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm shrink-0">
              <div className="flex items-center gap-2 sm:gap-4 text-stone-600 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-stone-400" /> Vào lúc: <b className="text-stone-800">{session?.startedAt}</b>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-stone-400" /> Khách: <b className="text-stone-800">{session?.guestCount} người</b>
                </span>
                <span className="flex items-center gap-1 font-medium bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs">
                  {totals.batchCount} đợt gọi ({totals.totalItems} món)
                </span>
              </div>

              {/* Nút hành động thêm món */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  id="btn-qr-add-more"
                  onClick={() => onOpenCustomerQrForTable(table.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>Quét QR gọi thêm (Lần {totals.batchCount + 1})</span>
                </button>
                <button
                  id="btn-staff-add-item"
                  onClick={() => setShowAddDishDrawer(!showAddDishDrawer)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Nhân viên thêm món</span>
                </button>
              </div>
            </div>

            {/* Khung thêm món nhanh của nhân viên nếu mở */}
            {showAddDishDrawer && (
              <div className="p-4 bg-amber-50/60 border-b border-amber-200 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Chọn món nhân viên ghi thêm trực tiếp
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm nhanh tên món..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="text-xs px-2.5 py-1 bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                  {MENU_ITEMS.filter((m) => m.name.toLowerCase().includes(quickSearch.toLowerCase())).map((item) => {
                    const count = selectedStaffItems[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="bg-white p-2 rounded-lg border border-stone-200 text-xs flex items-center justify-between"
                      >
                        <div className="truncate mr-1">
                          <div className="font-medium text-stone-800 truncate">{item.name}</div>
                          <div className="text-emerald-700 font-semibold">{formatVND(item.price)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {count > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStaffItems((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                }))
                              }
                              className="w-5 h-5 bg-stone-100 rounded text-stone-700 font-bold flex items-center justify-center hover:bg-stone-200"
                            >
                              -
                            </button>
                          )}
                          {count > 0 && <span className="font-bold w-4 text-center">{count}</span>}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStaffItems((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1,
                              }))
                            }
                            className="w-5 h-5 bg-amber-600 rounded text-white font-bold flex items-center justify-center hover:bg-amber-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffItems({});
                      setShowAddDishDrawer(false);
                    }}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleStaffConfirmAdd}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Xác nhận thêm món
                  </button>
                </div>
              </div>
            )}

            {/* DANH SÁCH TẤT CẢ CÁC MÓN THEO TỪNG LẦN GỌI */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/40">
              {session?.batches && session.batches.length > 0 ? (
                session.batches.map((batch: OrderBatch) => {
                  const batchTotal = batch.items.reduce(
                    (sum, it) => (it.status !== 'cancelled' ? sum + it.price * it.quantity : sum),
                    0
                  );

                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm px-2 py-0.5 bg-stone-200 rounded-md">
                            Lần gọi {batch.batchNumber}
                          </span>
                          <span className="text-stone-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Gửi lúc: <b className="text-stone-700">{batch.timestamp}</b>
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {batch.source === 'qr_customer' ? 'Khách quét QR tại bàn' : 'Nhân viên ghi tại bàn'}
                          </span>
                        </div>
                        <div className="font-bold text-stone-800 text-sm">
                          {formatVND(batchTotal)}
                        </div>
                      </div>

                      {batch.note && (
                        <div className="px-4 py-1.5 bg-amber-50/80 text-amber-800 text-xs italic border-b border-amber-100">
                          Ghi chú: {batch.note}
                        </div>
                      )}

                      <div className="divide-y divide-stone-100">
                        {batch.items.map((item) => (
                          <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-sm hover:bg-stone-50/80 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-stone-900">{item.name}</span>
                                {getStatusBadge(item.status)}
                              </div>
                              {item.note && (
                                <p className="text-xs text-stone-500 italic mt-0.5">
                                  Ghi chú: "{item.note}"
                                </p>
                              )}
                              <div className="text-xs text-stone-500 mt-1">
                                {formatVND(item.price)} × {item.quantity} phần = <span className="font-bold text-stone-800">{formatVND(item.price * item.quantity)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.status !== 'served' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateItemStatus(table.id, batch.id, item.id, 'served')}
                                  title="Đánh dấu đã ra món"
                                  className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                  Đã ra món
                                </button>
                              )}
                              {item.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateItemStatus(table.id, batch.id, item.id, 'preparing')}
                                  title="Bếp nhận làm"
                                  className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                  Đang nấu
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-stone-500">Chưa có món nào được gọi.</div>
              )}
            </div>

            {/* Footer Tính tiền tại BÀN THU NGÂN */}
            <div className="p-3.5 sm:p-5 bg-white border-t border-stone-200 shadow-lg shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex sm:flex-col justify-between items-baseline sm:items-start">
                  <div className="text-[11px] sm:text-xs text-stone-500 font-medium">
                    Tổng cộng ({totals.totalItems} món • {totals.batchCount} đợt):
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    {formatVND(totals.subtotal)}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    id="btn-checkout-finish-table"
                    onClick={() => onRequestPayment(table)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer min-h-[44px]"
                  >
                    <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ra Bàn Thu Ngân Thanh toán</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
