import React, { useState } from 'react';
import { Table, MenuItem, OnlineReservation } from '../types';
import { MENU_ITEMS } from '../data/mockData';
import { formatVND, getCurrentTime, formatDateLabel } from '../utils/formatters';
import { QrCode, Plus, Minus, Send, X, Utensils, CheckCircle2, ShoppingBag, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CustomerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  reservations?: OnlineReservation[];
  preSelectedTableId?: string;
  onPlaceOrder: (tableId: string, items: { menuItem: MenuItem; quantity: number; note?: string }[], guestCount: number) => void;
}

export const CustomerQrModal: React.FC<CustomerQrModalProps> = ({
  isOpen,
  onClose,
  tables,
  reservations = [],
  preSelectedTableId,
  onPlaceOrder,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(
    preSelectedTableId || tables[0]?.id || 'T-01'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [cart, setCart] = useState<Record<string, { quantity: number; note?: string }>>({});
  const [guestCount, setGuestCount] = useState<number>(2);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastBatchNumber, setLastBatchNumber] = useState<number>(1);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === selectedTableId);
  const isTableOccupied = currentTable?.status === 'occupied' || currentTable?.status === 'payment_pending';
  const isTableReserved = currentTable?.status === 'reserved';
  const existingBatchesCount = currentTable?.currentSession?.batches?.length || 0;
  const nextBatchNumber = existingBatchesCount + 1;

  // Lấy thông tin đặt bàn nếu có
  const activeReservation = reservations.find(
    (r) => r.tableId === selectedTableId && (r.status === 'locked_holding' || r.status === 'upcoming_waiting')
  );

  const categories = ['Tất cả', 'Khai vị', 'Món nướng', 'Món lẩu', 'Món ăn kèm', 'Đồ uống', 'Tráng miệng'];

  const filteredMenuItems = selectedCategory === 'Tất cả'
    ? MENU_ITEMS
    : MENU_ITEMS.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (itemId: string) => {
    if (isTableReserved) return;
    setCart((prev) => ({
      ...prev,
      [itemId]: {
        quantity: (prev[itemId]?.quantity || 0) + 1,
        note: prev[itemId]?.note || '',
      },
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const currentQty = prev[itemId]?.quantity || 0;
      if (currentQty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: currentQty - 1,
        },
      };
    });
  };

  const handleUpdateNote = (itemId: string, note: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        note,
      },
    }));
  };

  const cartItemIds = Object.keys(cart);
  const totalItemsInCart = cartItemIds.reduce((sum, id) => sum + (cart[id]?.quantity || 0), 0);
  const totalCartPrice = cartItemIds.reduce((sum, id) => {
    const item = MENU_ITEMS.find((m) => m.id === id);
    return sum + (item ? item.price * (cart[id]?.quantity || 0) : 0);
  }, 0);

  const handleSubmitOrder = () => {
    if (isTableReserved) return;
    if (cartItemIds.length === 0) return;

    const itemsToOrder = cartItemIds.map((id) => {
      const menuItem = MENU_ITEMS.find((m) => m.id === id)!;
      return {
        menuItem,
        quantity: cart[id].quantity,
        note: cart[id].note,
      };
    });

    onPlaceOrder(selectedTableId, itemsToOrder, isTableOccupied ? (currentTable?.currentSession?.guestCount || guestCount) : guestCount);
    setLastBatchNumber(nextBatchNumber);
    setOrderSuccess(true);
    setCart({});

    setTimeout(() => {
      setOrderSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div 
        id="customer-qr-modal-container" 
        className="relative flex flex-col w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[94vh] sm:h-auto sm:max-h-[90vh] border border-stone-200"
      >
        {/* Header mô phỏng quét QR */}
        <div className={`flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-white shrink-0 ${
          isTableReserved 
            ? 'bg-gradient-to-r from-blue-700 to-indigo-900' 
            : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Mô phỏng Quét QR
                </span>
                {isTableReserved ? (
                  <span className="text-[10px] sm:text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Lock className="w-3 h-3" /> ĐANG KHÓA BÀN
                  </span>
                ) : isTableOccupied ? (
                  <span className="text-[10px] sm:text-xs font-medium bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Gọi thêm (Lần {nextBatchNumber})
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-medium bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Gọi món mới (Lần 1)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight mt-0.5">Menu Đặt Món Trực Tiếp Tại Bàn</h2>
            </div>
          </div>
          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh chọn bàn & số khách */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-sm shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label htmlFor="select-table-qr" className="font-semibold text-stone-700 text-xs sm:text-sm shrink-0">
              Vị trí bàn:
            </label>
            <select
              id="select-table-qr"
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setCart({});
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - {t.status === 'available' ? '🟢 Bàn trống (Cho khách vào)' : t.status === 'reserved' ? '🔒 Đang khóa giữ bàn 3h (CẤM khách vãng lai)' : '🟡 Đang có khách ăn'}
                </option>
              ))}
            </select>
          </div>

          {!isTableOccupied && !isTableReserved && (
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="text-stone-600 text-xs sm:text-sm">Số lượng khách:</span>
              <div className="flex items-center bg-white border border-stone-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-l-lg font-bold"
                >
                  -
                </button>
                <span className="px-3 font-semibold text-stone-800 text-sm">{guestCount}</span>
                <button
                  type="button"
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-r-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CẢNH BÁO NẾU BÀN ĐANG TRONG KHUNG GIỜ KHÓA 3 TIẾNG */}
        {isTableReserved && (
          <div className="p-5 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-950">
                BÀN ĐANG TRONG KHUNG GIỜ KHÓA 3 TIẾNG — KHÔNG CHO NHẬN KHÁCH VÃNG LAI!
              </h4>
              <p className="text-xs text-rose-800 mt-1">
                Theo quy định nghiệp vụ: Bàn này đã được khách đặt online hẹn đến lúc <b>{activeReservation?.bookingTime || 'tối nay'}</b> ({activeReservation ? formatDateLabel(activeReservation.bookingDate) : 'hôm nay'}). Hệ thống tự động khóa trước 3 tiếng để chuẩn bị bàn và đón khách đặt.
              </p>
              <p className="text-xs text-rose-700 font-semibold mt-1">
                ➔ Khách vãng lai vui lòng chọn bàn màu xanh khác hoặc chờ nhân viên sắp xếp.
              </p>
            </div>
          </div>
        )}

        {/* THÔNG BÁO NẾU BÀN CÓ HẸN TƯƠNG LAI NHƯNG CÒN > 3 TIẾNG (VẪN ĐÓN ĐƯỢC KHÁCH) */}
        {!isTableReserved && activeReservation && activeReservation.status === 'upcoming_waiting' && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-950 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Bàn có lịch hẹn lúc <b>{activeReservation.bookingTime}</b> ({formatDateLabel(activeReservation.bookingDate)}). 
              Hiện tại còn hơn 3 tiếng nên <b>VẪN CHO NHẬN KHÁCH VÃNG LAI</b> bình thường!
            </span>
          </div>
        )}

        {orderSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-stone-800">
              {isTableOccupied ? `Đã gửi gọi thêm (Lần ${lastBatchNumber}) thành công!` : 'Đã gửi gọi món (Lần 1) thành công!'}
            </h3>
            <p className="text-stone-600 max-w-md">
              Hệ thống đã nhận yêu cầu của {currentTable?.name} lúc {getCurrentTime()}. Bếp và nhân viên phục vụ đang tiếp nhận đơn ngay tức thì!
            </p>
          </div>
        ) : (
          <>
            {/* Thanh danh mục món */}
            <div className="px-5 py-2.5 border-b border-stone-200 overflow-x-auto flex gap-2 no-scrollbar bg-white">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu danh sách món */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-stone-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMenuItems.map((item) => {
                  const qty = cart[item.id]?.quantity || 0;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between ${
                        isTableReserved ? 'opacity-50' : ''
                      } ${
                        qty > 0 ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-sm bg-stone-100 text-stone-600 font-medium">
                              {item.category}
                            </span>
                            {item.isPopular && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 font-semibold">
                                ★ Hot
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-stone-900 text-sm mt-1 leading-snug">{item.name}</h4>
                          <div className="text-emerald-700 font-bold text-sm mt-1">
                            {formatVND(item.price)}
                            <span className="text-stone-400 font-normal text-xs"> / {item.unit}</span>
                          </div>
                        </div>

                        {!isTableReserved && (
                          qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.id)}
                              className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Chọn</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 rounded-lg p-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-emerald-800 hover:bg-emerald-200 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center font-bold text-sm">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.id)}
                                className="w-6 h-6 flex items-center justify-center bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      {!isTableReserved && qty > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-100">
                          <input
                            type="text"
                            placeholder="Ghi chú (Ví dụ: Ít đá, không ớt...)"
                            value={cart[item.id]?.note || ''}
                            onChange={(e) => handleUpdateNote(item.id, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-200 rounded-md text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Bar: Giỏ món và nút Gửi */}
            <div className="p-3 sm:p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative p-2 sm:p-2.5 bg-stone-100 rounded-xl text-stone-700">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItemsInCart > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {totalItemsInCart}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-stone-500 font-medium">
                      {isTableReserved 
                        ? 'Bàn đang bị khóa giữ trước 3 tiếng'
                        : totalItemsInCart > 0 ? `${totalItemsInCart} món đã chọn` : 'Chưa chọn món nào'}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-stone-900">
                      {formatVND(totalCartPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {isTableReserved ? (
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300 text-center">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Bàn đã khóa giữ 3h — Không nhận khách vãng lai</span>
                </div>
              ) : (
                <button
                  id="btn-submit-qr-order"
                  disabled={totalItemsInCart === 0}
                  onClick={handleSubmitOrder}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md min-h-[44px] ${
                    totalItemsInCart > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isTableOccupied
                      ? `Gửi gọi thêm (Lần ${nextBatchNumber})`
                      : 'Gửi gọi món (Lần 1)'}
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
