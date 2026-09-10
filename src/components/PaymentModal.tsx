import React, { useState } from 'react';
import { Table, CompletedOrder } from '../types';
import { formatVND, calculateSessionTotals, generateOrderCode, getCurrentTime } from '../utils/formatters';
import { 
  X, CheckCircle, Banknote, QrCode, Receipt, 
  Percent, ArrowRight, UserCheck, Printer
} from 'lucide-react';

interface PaymentModalProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (completedOrder: CompletedOrder) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  table,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_qr'>('transfer_qr');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashierName, setCashierName] = useState<string>('Thu Ngân Quầy');

  if (!isOpen || !table || !table.currentSession) return null;

  const session = table.currentSession;
  const totals = calculateSessionTotals(session);
  const discountAmount = Math.round((totals.subtotal * discountPercent) / 100);
  const finalAmount = Math.max(0, totals.subtotal - discountAmount);

  const handleFinishPayment = () => {
    const startedTime = session.startedAt;
    const completedTime = getCurrentTime();

    // Approximate duration in minutes
    let duration = 60;
    try {
      const [sh, sm] = startedTime.split(':').map(Number);
      const [eh, em] = completedTime.split(':').map(Number);
      duration = Math.max(1, (eh * 60 + em) - (sh * 60 + sm));
    } catch {
      duration = 45;
    }

    const order: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderCode: generateOrderCode(),
      tableId: table.id,
      tableName: table.name,
      guestCount: session.guestCount,
      startedAt: session.startedAt,
      completedAt: completedTime,
      durationMinutes: duration,
      batches: session.batches,
      subtotal: totals.subtotal,
      discountAmount,
      discountPercent,
      finalAmount,
      paymentMethod,
      cashierName,
      notes: `Khách đến quầy thu ngân thanh toán qua ${
        paymentMethod === 'transfer_qr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'
      }. Bàn được dọn sạch chuyển màu xanh.`,
    };

    onConfirmPayment(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div 
        id="payment-modal-container" 
        className="relative flex flex-col w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[94vh] sm:h-auto sm:max-h-[94vh] border border-stone-200"
      >
        {/* Header Quầy Thu Ngân */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">Quầy Thu Ngân: Thanh Toán</h2>
                <span className="text-[10px] sm:text-[11px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Tại Bàn Thu Ngân
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300">
                {table.name} • {session.guestCount} khách • Giờ vào: {session.startedAt}
              </p>
            </div>
          </div>
          <button
            id="btn-close-payment-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân hóa đơn thanh toán */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Thông báo khách đến quầy thu ngân */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Khách đã dùng bữa xong và đến <b>Bàn Thu Ngân</b> để kiểm tra các đợt gọi món và trả tiền.</span>
          </div>

          {/* Tóm tắt các đợt gọi món */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-sm">
            <div className="flex items-center justify-between font-bold text-stone-800 border-b border-stone-200 pb-2">
              <span>Lịch sử {totals.batchCount} đợt gọi món tại bàn:</span>
              <span className="text-xs text-stone-500 font-normal">{totals.totalItems} phần món</span>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {session.batches.map((batch) => (
                <div key={batch.id} className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between font-semibold text-stone-700">
                    <span className="bg-stone-100 text-stone-900 px-2 py-0.5 rounded font-bold text-[11px]">
                      Lần gọi {batch.batchNumber} (lúc {batch.timestamp})
                    </span>
                    <span className="text-stone-500 font-normal text-[11px]">
                      {batch.source === 'qr_customer' ? 'Khách quét QR' : 'Nhân viên'}
                    </span>
                  </div>
                  {batch.items.map((it) => (
                    <div key={it.id} className="flex justify-between pl-2 text-stone-600">
                      <span>• {it.name} <b className="text-stone-800">×{it.quantity}</b></span>
                      <span>{formatVND(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Phương thức thanh toán tại Quầy Thu Ngân: QR và Tiền mặt */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">
              Hình thức thanh toán tại quầy:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-payment-method-qr"
                type="button"
                onClick={() => setPaymentMethod('transfer_qr')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'transfer_qr'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500 font-semibold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold">Chuyển khoản QR</span>
                </div>
                <span className="text-[11px] text-stone-500">Quét mã VietQR động</span>
              </button>

              <button
                id="btn-payment-method-cash"
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500 font-semibold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold">Tiền mặt</span>
                </div>
                <span className="text-[11px] text-stone-500">Khách trả tiền mặt tại quầy</span>
              </button>
            </div>
          </div>

          {/* Chiết khấu & Thu ngân */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Giảm giá / Chiết khấu:
              </label>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      discountPercent === pct
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="input-cashier" className="block text-xs font-semibold text-stone-600 mb-1">
                Thu ngân phụ trách:
              </label>
              <input
                id="input-cashier"
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Bảng tính tổng tiền */}
          <div className="p-4 bg-stone-100 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Tổng tiền món ({totals.totalItems} món):</span>
              <span className="font-semibold text-stone-800">{formatVND(totals.subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá ({discountPercent}%):</span>
                <span>-{formatVND(discountAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline font-black text-stone-900">
              <span className="text-base">Số tiền thu của khách:</span>
              <span className="text-2xl text-emerald-700">{formatVND(finalAmount)}</span>
            </div>
          </div>

          {/* Mã VietQR động cho khách thanh toán tại quầy */}
          {paymentMethod === 'transfer_qr' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900 animate-fadeIn">
              <div className="p-2 bg-white rounded-lg border border-emerald-300 shrink-0">
                <QrCode className="w-10 h-10 text-emerald-800" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-950">Mã VietQR động: {formatVND(finalAmount)}</div>
                <div>Ngân hàng: MB Bank • STK: 8888.6868.999 (Nhà hàng Bếp Quê Quán)</div>
                <div>Nội dung: {table.name} thanh toan</div>
              </div>
            </div>
          )}

          {/* Hướng dẫn thu tiền mặt tại quầy */}
          {paymentMethod === 'cash' && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900 animate-fadeIn">
              <div className="p-2.5 bg-white rounded-lg border border-amber-300 shrink-0">
                <Banknote className="w-9 h-9 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-amber-950 text-sm">Thu Tiền Mặt Tại Quầy: {formatVND(finalAmount)}</div>
                <div className="text-amber-800">
                  Thu ngân nhận tiền mặt trực tiếp từ khách hàng, kiểm đếm và thối tiền thừa (nếu có).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Chuyển sang MÀU XANH LÁ để nhận khách tiếp theo */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            Bấm xác nhận để thu tiền, kết thúc đơn và <b className="text-emerald-700">chuyển bàn sang màu xanh</b> nhận khách mới.
          </div>
          <button
            id="btn-confirm-payment-finish"
            onClick={handleFinishPayment}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Thu Ngân Xác Nhận & Chuyển Bàn Sang Xanh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
