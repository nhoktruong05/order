import { MenuItem, Table, CompletedOrder, OnlineReservation } from '../types';
import { getTodayDateString, getOffsetDateString, calculateLockFromTime, calculateAutoCancelTime } from '../utils/formatters';

export const MENU_ITEMS: MenuItem[] = [
  // Khai vị
  { id: 'm1', name: 'Khoai tây lắc phô mai giòn', category: 'Khai vị', price: 45000, unit: 'Đĩa', isPopular: true },
  { id: 'm2', name: 'Nem rán hải sản Hà Nội (6 cuốn)', category: 'Khai vị', price: 75000, unit: 'Đĩa', isPopular: true },
  { id: 'm3', name: 'Salad bò sốt chanh leo chua ngọt', category: 'Khai vị', price: 69000, unit: 'Đĩa' },
  { id: 'm4', name: 'Chả giò tôm thịt giòn rụm', category: 'Khai vị', price: 65000, unit: 'Đĩa' },

  // Món nướng
  { id: 'm5', name: 'Ba chỉ bò Mỹ ướp sốt tiêu đen', category: 'Món nướng', price: 129000, unit: 'Phần', isPopular: true },
  { id: 'm6', name: 'Bò Wagyu nướng đá sốt nấm Truffle', category: 'Món nướng', price: 219000, unit: 'Phần', isPopular: true },
  { id: 'm7', name: 'Dẻ sườn bò rút xương nướng sa tế', category: 'Món nướng', price: 169000, unit: 'Phần' },
  { id: 'm8', name: 'Sườn heo sốt BBQ mật ong thảo mộc', category: 'Món nướng', price: 119000, unit: 'Phần' },
  { id: 'm9', name: 'Mực ống nướng muối ớt xanh', category: 'Món nướng', price: 139000, unit: 'Phần' },

  // Món lẩu
  { id: 'm10', name: 'Lẩu Thái Tomyum hải sản chua cay (Nồi lớn)', category: 'Món lẩu', price: 289000, unit: 'Nồi', isPopular: true },
  { id: 'm11', name: 'Lẩu nấm gà tiềm thảo mộc thanh ngọt', category: 'Món lẩu', price: 259000, unit: 'Nồi' },
  { id: 'm12', name: 'Lẩu riêu cua bắp bò sườn sụn đặc biệt', category: 'Món lẩu', price: 319000, unit: 'Nồi', isPopular: true },

  // Món ăn kèm
  { id: 'm13', name: 'Rau tổng hợp & nấm tươi nhúng lẩu', category: 'Món ăn kèm', price: 45000, unit: 'Rổ' },
  { id: 'm14', name: 'Bò ba chỉ cuộn nấm kim châm thêm', category: 'Món ăn kèm', price: 65000, unit: 'Đĩa' },
  { id: 'm15', name: 'Mì tôm lẩu / Bún tươi ăn kèm (2 vắt)', category: 'Món ăn kèm', price: 20000, unit: 'Phần' },
  { id: 'm16', name: 'Kim chi Hàn Quốc & Dưa góp chua cay', category: 'Món ăn kèm', price: 25000, unit: 'Đĩa' },

  // Đồ uống
  { id: 'm17', name: 'Bia thủ công IPA ướp lạnh', category: 'Đồ uống', price: 45000, unit: 'Chai', isPopular: true },
  { id: 'm18', name: 'Trà đào cam sả hạt chia tươi mát', category: 'Đồ uống', price: 35000, unit: 'Ly', isPopular: true },
  { id: 'm19', name: 'Nước ép dưa hấu / ổi hồng tươi', category: 'Đồ uống', price: 39000, unit: 'Ly' },
  { id: 'm20', name: 'Cocacola / Pepsi không đường ướp lạnh', category: 'Đồ uống', price: 20000, unit: 'Lon' },
  { id: 'm21', name: 'Nước khoáng thiên nhiên đóng chai', category: 'Đồ uống', price: 15000, unit: 'Chai' },

  // Tráng miệng
  { id: 'm22', name: 'Chè bưởi An Giang cốt dừa béo ngậy', category: 'Tráng miệng', price: 28000, unit: 'Bát' },
  { id: 'm23', name: 'Kem dừa sáp Côn Đảo rắc đậu phộng', category: 'Tráng miệng', price: 35000, unit: 'Ly', isPopular: true },
];

const today = getTodayDateString();
const tomorrow = getOffsetDateString(1);
const dayAfterTomorrow = getOffsetDateString(2);

export const INITIAL_RESERVATIONS: OnlineReservation[] = [
  {
    id: 'res-01',
    tableId: 'T-04',
    tableName: 'Bàn 04',
    customerName: 'Chị Hoàng Thu Thảo',
    phone: '0912.345.678',
    guestCount: 4,
    bookingDate: today,
    bookingTime: '19:30',
    lockFromTime: calculateLockFromTime('19:30'), // 16:30
    autoCancelTime: calculateAutoCancelTime('19:30'), // 20:00
    createdAt: '14:20:00',
    note: 'Tiệc sinh nhật gia đình, yêu cầu nến và hoa tươi',
    status: 'locked_holding', // ĐANG TRONG KHOẢNG 3 TIẾNG -> KHÓA BÀN
  },
  {
    id: 'res-02',
    tableId: 'T-08',
    tableName: 'Bàn 08',
    customerName: 'Anh Trần Quốc Huy',
    phone: '0988.777.666',
    guestCount: 6,
    bookingDate: today,
    bookingTime: '21:30',
    lockFromTime: calculateLockFromTime('21:30'), // 18:30
    autoCancelTime: calculateAutoCancelTime('21:30'), // 22:00
    createdAt: '15:10:00',
    note: 'Tiếp khách đối tác kinh doanh',
    status: 'upcoming_waiting', // HÔM NAY NHƯNG CÒN >3H -> BÀN VẪN MÀU XANH, ĐÓN KHÁCH VÃNG LAI BÌNH THƯỜNG!
  },
  {
    id: 'res-03',
    tableId: 'T-01',
    tableName: 'Bàn 01',
    customerName: 'Nguyễn Văn Nam',
    phone: '0903.111.222',
    guestCount: 4,
    bookingDate: tomorrow,
    bookingTime: '19:00',
    lockFromTime: calculateLockFromTime('19:00'), // 16:00 ngày mai
    autoCancelTime: calculateAutoCancelTime('19:00'), // 19:30 ngày mai
    createdAt: '11:00:00',
    note: 'ĐẶT NGÀY MAI: Bàn 01 hôm nay vẫn phục vụ đón khách vãng lai bình thường',
    status: 'upcoming_waiting', // NGÀY MAI -> BÀN HÔM NAY VẪN XANH LÁ
  },
  {
    id: 'res-04',
    tableId: 'T-09',
    tableName: 'Bàn 09',
    customerName: 'Lê Minh Khang',
    phone: '0977.889.900',
    guestCount: 8,
    bookingDate: dayAfterTomorrow,
    bookingTime: '18:30',
    lockFromTime: calculateLockFromTime('18:30'),
    autoCancelTime: calculateAutoCancelTime('18:30'),
    createdAt: '09:30:00',
    note: 'ĐẶT NGÀY KIA: Họp mặt nhóm bạn thân',
    status: 'upcoming_waiting', // NGÀY KIA -> BÀN HÔM NAY VẪN XANH LÁ
  },
  {
    id: 'res-05',
    tableId: 'T-07',
    tableName: 'Bàn 07',
    customerName: 'Trịnh Thanh Hằng',
    phone: '0933.445.566',
    guestCount: 4,
    bookingDate: today,
    bookingTime: '14:00',
    lockFromTime: calculateLockFromTime('14:00'),
    autoCancelTime: calculateAutoCancelTime('14:00'), // 14:30
    createdAt: '10:00:00',
    note: 'Khách hẹn 14:00 nhưng không tới, trễ quá 30 phút -> Hệ thống tự động hủy lúc 14:30',
    status: 'auto_cancelled', // QUÁ 30 PHÚT -> TỰ ĐỘNG HỦY, BÀN 07 ĐÃ MỞ LẠI XANH LÁ
    cancellationReason: 'Tự động hủy do khách trễ quá 30 phút không đến nhận bàn',
  },
];

export const INITIAL_TABLES: Table[] = [
  {
    id: 'T-01',
    name: 'Bàn 01',
    capacity: 4,
    status: 'available', // XANH LÁ: Có lịch đặt ngày mai nhưng hôm nay vẫn đón khách vãng lai
    activeReservationId: 'res-03',
  },
  {
    id: 'T-02',
    name: 'Bàn 02',
    capacity: 4,
    status: 'occupied', // Đang có khách và đã gọi 2 lần
    currentSession: {
      sessionId: 'sess-101',
      tableId: 'T-02',
      tableName: 'Bàn 02',
      startedAt: '18:15:30',
      fullStartDateTime: '2026-09-10 18:15:30',
      guestCount: 3,
      status: 'active',
      batches: [
        {
          id: 'b-101-1',
          batchNumber: 1,
          timestamp: '18:16:10',
          fullDateTime: '2026-09-10 18:16:10',
          source: 'qr_customer',
          note: 'Khách quét QR lần đầu tại bàn',
          items: [
            { id: 'it-1', menuItemId: 'm5', name: 'Ba chỉ bò Mỹ ướp sốt tiêu đen', price: 129000, quantity: 2, status: 'served', orderedAt: '18:16:10' },
            { id: 'it-2', menuItemId: 'm1', name: 'Khoai tây lắc phô mai giòn', price: 45000, quantity: 1, status: 'served', orderedAt: '18:16:10' },
            { id: 'it-3', menuItemId: 'm17', name: 'Bia thủ công IPA ướp lạnh', price: 45000, quantity: 3, status: 'served', orderedAt: '18:16:10' },
          ],
        },
        {
          id: 'b-101-2',
          batchNumber: 2,
          timestamp: '18:48:45',
          fullDateTime: '2026-09-10 18:48:45',
          source: 'qr_customer',
          note: 'Khách gọi thêm đợt 2: Thêm sườn và bia',
          items: [
            { id: 'it-4', menuItemId: 'm8', name: 'Sườn heo sốt BBQ mật ong thảo mộc', price: 119000, quantity: 1, status: 'preparing', orderedAt: '18:48:45' },
            { id: 'it-5', menuItemId: 'm17', name: 'Bia thủ công IPA ướp lạnh', price: 45000, quantity: 2, status: 'served', orderedAt: '18:48:45' },
          ],
        },
      ],
    },
  },
  {
    id: 'T-03',
    name: 'Bàn 03',
    capacity: 2,
    status: 'available', // XANH LÁ
  },
  {
    id: 'T-04',
    name: 'Bàn 04',
    capacity: 4,
    status: 'reserved', // KHÓA BÀN: Đang trong khoảng 3 tiếng trước giờ hẹn (19:30) -> CẤM KHÁCH VÃNG LAI
    activeReservationId: 'res-01',
  },
  {
    id: 'T-05',
    name: 'Bàn 05',
    capacity: 6,
    status: 'occupied', // Đang có khách và đã gọi 3 lần
    currentSession: {
      sessionId: 'sess-102',
      tableId: 'T-05',
      tableName: 'Bàn 05',
      startedAt: '18:40:00',
      fullStartDateTime: '2026-09-10 18:40:00',
      guestCount: 5,
      status: 'active',
      batches: [
        {
          id: 'b-102-1',
          batchNumber: 1,
          timestamp: '18:42:15',
          fullDateTime: '2026-09-10 18:42:15',
          source: 'qr_customer',
          note: 'Lần 1: Khai vị & Lẩu hải sản',
          items: [
            { id: 'it-6', menuItemId: 'm2', name: 'Nem rán hải sản Hà Nội (6 cuốn)', price: 75000, quantity: 2, status: 'served', orderedAt: '18:42:15' },
            { id: 'it-7', menuItemId: 'm10', name: 'Lẩu Thái Tomyum hải sản chua cay (Nồi lớn)', price: 289000, quantity: 1, status: 'served', orderedAt: '18:42:15', note: 'Cay vừa, nhiều sả' },
            { id: 'it-8', menuItemId: 'm18', name: 'Trà đào cam sả hạt chia tươi mát', price: 35000, quantity: 4, status: 'served', orderedAt: '18:42:15' },
          ],
        },
        {
          id: 'b-102-2',
          batchNumber: 2,
          timestamp: '19:15:30',
          fullDateTime: '2026-09-10 19:15:30',
          source: 'qr_customer',
          note: 'Lần 2: Gọi thêm đồ nhúng lẩu',
          items: [
            { id: 'it-9', menuItemId: 'm14', name: 'Bò ba chỉ cuộn nấm kim châm thêm', price: 65000, quantity: 2, status: 'served', orderedAt: '19:15:30' },
            { id: 'it-10', menuItemId: 'm13', name: 'Rau tổng hợp & nấm tươi nhúng lẩu', price: 45000, quantity: 2, status: 'served', orderedAt: '19:15:30' },
            { id: 'it-11', menuItemId: 'm15', name: 'Mì tôm lẩu / Bún tươi ăn kèm (2 vắt)', price: 20000, quantity: 2, status: 'served', orderedAt: '19:15:30' },
          ],
        },
        {
          id: 'b-102-3',
          batchNumber: 3,
          timestamp: '19:42:10',
          fullDateTime: '2026-09-10 19:42:10',
          source: 'qr_customer',
          note: 'Lần 3: Gọi tráng miệng sau ăn',
          items: [
            { id: 'it-12', menuItemId: 'm23', name: 'Kem dừa sáp Côn Đảo rắc đậu phộng', price: 35000, quantity: 4, status: 'preparing', orderedAt: '19:42:10' },
            { id: 'it-13', menuItemId: 'm22', name: 'Chè bưởi An Giang cốt dừa béo ngậy', price: 28000, quantity: 1, status: 'preparing', orderedAt: '19:42:10' },
          ],
        },
      ],
    },
  },
  {
    id: 'T-06',
    name: 'Bàn 06',
    capacity: 4,
    status: 'payment_pending', // KHÁCH ĐẾN BÀN THU NGÂN ĐỂ THANH TOÁN
    currentSession: {
      sessionId: 'sess-103',
      tableId: 'T-06',
      tableName: 'Bàn 06',
      startedAt: '17:50:00',
      fullStartDateTime: '2026-09-10 17:50:00',
      guestCount: 2,
      status: 'requesting_bill',
      batches: [
        {
          id: 'b-103-1',
          batchNumber: 1,
          timestamp: '17:52:10',
          fullDateTime: '2026-09-10 17:52:10',
          source: 'qr_customer',
          items: [
            { id: 'it-14', menuItemId: 'm6', name: 'Bò Wagyu nướng đá sốt nấm Truffle', price: 219000, quantity: 2, status: 'served', orderedAt: '17:52:10' },
            { id: 'it-15', menuItemId: 'm3', name: 'Salad bò sốt chanh leo chua ngọt', price: 69000, quantity: 1, status: 'served', orderedAt: '17:52:10' },
            { id: 'it-16', menuItemId: 'm17', name: 'Bia thủ công IPA ướp lạnh', price: 45000, quantity: 2, status: 'served', orderedAt: '17:52:10' },
          ],
        },
      ],
    },
  },
  {
    id: 'T-07',
    name: 'Bàn 07',
    capacity: 4,
    status: 'available', // XANH LÁ (đã mở lại sau khi khách hẹn 14:00 trễ quá 30 phút tự hủy)
  },
  {
    id: 'T-08',
    name: 'Bàn 08',
    capacity: 6,
    status: 'available', // XANH LÁ: Có hẹn 21:30 tối nay, nhưng còn >3h -> Vẫn đón khách vãng lai!
    activeReservationId: 'res-02',
  },
  {
    id: 'T-09',
    name: 'Bàn 09',
    capacity: 8,
    status: 'available', // XANH LÁ: Có hẹn ngày kia, hôm nay vẫn đón khách vãng lai
    activeReservationId: 'res-04',
  },
  {
    id: 'T-10',
    name: 'Bàn 10',
    capacity: 6,
    status: 'available', // XANH LÁ
  },
  {
    id: 'T-11',
    name: 'Bàn 11',
    capacity: 4,
    status: 'available', // XANH LÁ
  },
  {
    id: 'T-12',
    name: 'Bàn 12',
    capacity: 10,
    status: 'available', // XANH LÁ
  },
];

export const INITIAL_COMPLETED_ORDERS: CompletedOrder[] = [
  {
    id: 'order-c1',
    orderCode: 'HD-260910-001',
    tableId: 'T-03',
    tableName: 'Bàn 03',
    guestCount: 2,
    startedAt: '16:30:15',
    completedAt: '17:45:00',
    durationMinutes: 75,
    subtotal: 488000,
    discountPercent: 0,
    discountAmount: 0,
    finalAmount: 488000,
    paymentMethod: 'transfer_qr',
    cashierName: 'Thu Ngân Quầy',
    notes: 'Khách đến quầy thu ngân thanh toán chuyển khoản VietQR thành công',
    batches: [
      {
        id: 'b-c1-1',
        batchNumber: 1,
        timestamp: '16:32:00',
        fullDateTime: '2026-09-10 16:32:00',
        source: 'qr_customer',
        note: 'Khách quét QR lần 1 vào bàn',
        items: [
          { id: 'it-c1', menuItemId: 'm12', name: 'Lẩu riêu cua bắp bò sườn sụn đặc biệt', price: 319000, quantity: 1, status: 'served', orderedAt: '16:32:00' },
          { id: 'it-c2', menuItemId: 'm20', name: 'Cocacola / Pepsi không đường ướp lạnh', price: 20000, quantity: 2, status: 'served', orderedAt: '16:32:00' },
        ],
      },
      {
        id: 'b-c1-2',
        batchNumber: 2,
        timestamp: '17:05:22',
        fullDateTime: '2026-09-10 17:05:22',
        source: 'qr_customer',
        note: 'Khách gọi lần 2: Gọi thêm bắp bò & chè bưởi',
        items: [
          { id: 'it-c3', menuItemId: 'm14', name: 'Bò ba chỉ cuộn nấm kim châm thêm', price: 65000, quantity: 1, status: 'served', orderedAt: '17:05:22' },
          { id: 'it-c4', menuItemId: 'm22', name: 'Chè bưởi An Giang cốt dừa béo ngậy', price: 28000, quantity: 2, status: 'served', orderedAt: '17:05:22' },
        ],
      },
    ],
  },
  {
    id: 'order-c2',
    orderCode: 'HD-260910-002',
    tableId: 'T-07',
    tableName: 'Bàn 07',
    guestCount: 4,
    startedAt: '17:00:00',
    completedAt: '18:25:10',
    durationMinutes: 85,
    subtotal: 1045000,
    discountPercent: 10,
    discountAmount: 104500,
    finalAmount: 940500,
    paymentMethod: 'cash',
    cashierName: 'Thu Ngân Quầy',
    notes: 'Khách thanh toán tiền mặt tại quầy, giảm 10%',
    batches: [
      {
        id: 'b-c2-1',
        batchNumber: 1,
        timestamp: '17:02:40',
        fullDateTime: '2026-09-10 17:02:40',
        source: 'qr_customer',
        note: 'Lần 1: Khai vị và món nướng đá',
        items: [
          { id: 'it-c5', menuItemId: 'm6', name: 'Bò Wagyu nướng đá sốt nấm Truffle', price: 219000, quantity: 2, status: 'served', orderedAt: '17:02:40' },
          { id: 'it-c6', menuItemId: 'm2', name: 'Nem rán hải sản Hà Nội (6 cuốn)', price: 75000, quantity: 2, status: 'served', orderedAt: '17:02:40' },
          { id: 'it-c7', menuItemId: 'm17', name: 'Bia thủ công IPA ướp lạnh', price: 45000, quantity: 4, status: 'served', orderedAt: '17:02:40' },
        ],
      },
      {
        id: 'b-c2-2',
        batchNumber: 2,
        timestamp: '17:35:15',
        fullDateTime: '2026-09-10 17:35:15',
        source: 'qr_customer',
        note: 'Lần 2: Nướng thêm sườn & mực',
        items: [
          { id: 'it-c8', menuItemId: 'm8', name: 'Sườn heo sốt BBQ mật ong thảo mộc', price: 119000, quantity: 1, status: 'served', orderedAt: '17:35:15' },
          { id: 'it-c9', menuItemId: 'm9', name: 'Mực ống nướng muối ớt xanh', price: 139000, quantity: 1, status: 'served', orderedAt: '17:35:15' },
        ],
      },
      {
        id: 'b-c2-3',
        batchNumber: 3,
        timestamp: '18:02:00',
        fullDateTime: '2026-09-10 18:02:00',
        source: 'qr_customer',
        note: 'Lần 3: Trà hoa quả tráng miệng',
        items: [
          { id: 'it-c10', menuItemId: 'm18', name: 'Trà đào cam sả hạt chia tươi mát', price: 35000, quantity: 2, status: 'served', orderedAt: '18:02:00' },
        ],
      },
    ],
  },
];
