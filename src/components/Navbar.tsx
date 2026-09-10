import React, { useState, useEffect } from 'react';
import { LayoutGrid, ReceiptText, QrCode, Clock, Bell, Sparkles, RefreshCw } from 'lucide-react';
import { getCurrentTime } from '../utils/formatters';

interface NavbarProps {
  currentView: 'staff' | 'orders';
  onSwitchView: (view: 'staff' | 'orders') => void;
  onOpenQrSimulator: () => void;
  occupiedCount: number;
  availableCount: number;
  onResetDemoData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSwitchView,
  onOpenQrSimulator,
  occupiedCount,
  availableCount,
  onResetDemoData,
}) => {
  const [time, setTime] = useState<string>(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-white shadow-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Tên Quán */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-sm">
              BQ
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  BẾP QUÊ QUÁN
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  THU NGÂN & QR
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-stone-400 font-medium">
                Hệ Thống Phục Vụ Bàn & Quản Lý Đơn
              </p>
            </div>
          </div>

          {/* 2 Giao diện Chuyển đổi chính (Tabs) */}
          <div className="flex items-center p-1 bg-stone-800/90 rounded-xl border border-stone-700/60 shadow-inner">
            <button
              id="tab-staff-view"
              type="button"
              onClick={() => onSwitchView('staff')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'staff'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden lg:inline">Giao diện 1:</span>
              <span className="hidden sm:inline">Phục Vụ Bàn (Staff)</span>
              <span className="sm:hidden">Sơ đồ bàn</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-900/50 font-bold">
                {occupiedCount}
              </span>
            </button>

            <button
              id="tab-orders-view"
              type="button"
              onClick={() => onSwitchView('orders')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'orders'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden lg:inline">Giao diện 2:</span>
              <span className="hidden sm:inline">Quản Lý Đơn Hàng</span>
              <span className="sm:hidden">Đơn hàng</span>
            </button>
          </div>

          {/* Nút Phụ & Giờ Thực tế */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Đồng hồ */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-stone-300 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-white">{time}</span>
            </div>

            {/* Nút mô phỏng khách quét QR */}
            <button
              id="btn-simulate-qr"
              type="button"
              onClick={onOpenQrSimulator}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
              title="Mô phỏng khách quét QR gọi món mới hoặc gọi thêm lần 2, lần 3"
            >
              <QrCode className="w-4 h-4 text-white shrink-0" />
              <span className="hidden sm:inline">Khách Quét QR</span>
              <span className="sm:hidden">Quét QR</span>
            </button>

            {/* Reset data if needed */}
            <button
              type="button"
              onClick={onResetDemoData}
              title="Đặt lại dữ liệu mẫu"
              className="p-1.5 sm:p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
