import React from 'react';
import { CompletedOrder } from '../types';
import { formatVND } from '../utils/formatters';
import { X, Printer, CheckCircle } from 'lucide-react';

interface BillPrintModalProps {
  order: CompletedOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div 
        id="bill-print-modal" 
        className="relative flex flex-col w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[95vh] border border-stone-200"
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-stone-900 text-white shrink-0">
          <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400 shrink-0" /> Hóa Đơn Thanh Toán Nhà Hàng
          </span>
          <button
            id="btn-close-bill"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Hóa đơn in nhiệt */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-stone-50 font-mono text-xs space-y-4 print:p-0 print:bg-white">
          <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
            <h3 className="font-sans text-base font-black tracking-wide text-stone-900">NHÀ HÀNG BẾP QUÊ QUÁN</h3>
            <p className="text-stone-500 text-[11px]">Hệ thống Gọi Món QR Code & Quản Lý Bàn</p>
            <p className="text-stone-500 text-[11px]">Địa chỉ: 128 Nguyễn Đình Chiểu, Quận 3, TP.HCM</p>
            <p className="text-stone-500 text-[11px]">Hotline: 0988.123.456</p>
          </div>

          <div className="space-y-1 text-stone-700">
            <div className="flex justify-between">
              <span>Mã hóa đơn:</span>
              <span className="font-bold text-stone-900">{order.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Bàn phục vụ:</span>
              <span className="font-bold text-stone-900">{order.tableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Giờ vào:</span>
              <span>{order.startedAt}</span>
            </div>
            <div className="flex justify-between">
              <span>Giờ thanh toán:</span>
              <span>{order.completedAt} (Thời gian: {order.durationMinutes} phút)</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân / Phục vụ:</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Hình thức TT:</span>
              <span className="uppercase font-semibold">
                {order.paymentMethod === 'transfer_qr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}
              </span>
            </div>
          </div>

          {/* Chi tiết từng đợt gọi món */}
          <div className="border-t border-b border-dashed border-stone-300 py-2 space-y-3">
            <div className="font-sans font-bold text-stone-800 text-xs">
              LỊCH SỬ CÁC LẦN GỌI MÓN:
            </div>
            {order.batches.map((batch) => (
              <div key={batch.id} className="space-y-1">
                <div className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] flex justify-between">
                  <span>Lần {batch.batchNumber} (Lúc {batch.timestamp})</span>
                  <span>{batch.source === 'qr_customer' ? 'QR tại bàn' : 'Staff'}</span>
                </div>
                {batch.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-stone-700 pl-1">
                    <span className="truncate max-w-[200px]">
                      {it.name} ×{it.quantity}
                    </span>
                    <span>{formatVND(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Tổng tiền */}
          <div className="space-y-1.5 font-sans pt-1">
            <div className="flex justify-between text-stone-600 text-xs">
              <span>Tạm tính tiền món:</span>
              <span className="font-mono">{formatVND(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs">
                <span>Giảm giá ({order.discountPercent}%):</span>
                <span className="font-mono">-{formatVND(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline font-black text-stone-950 text-base border-t border-dashed border-stone-400 pt-2">
              <span>TỔNG THANH TOÁN:</span>
              <span className="text-emerald-700 font-mono text-lg">{formatVND(order.finalAmount)}</span>
            </div>
          </div>

          <div className="text-center pt-3 text-[11px] text-stone-500 font-sans border-t border-dashed border-stone-300">
            <p className="font-semibold text-stone-800">Cảm ơn Quý khách & Hẹn gặp lại!</p>
            <p>Pass Wifi: quequan2026</p>
          </div>
        </div>

        {/* Nút In hóa đơn */}
        <div className="p-3.5 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Đóng
          </button>
          <button
            id="btn-print-bill-action"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>In hóa đơn (Print Bill)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
