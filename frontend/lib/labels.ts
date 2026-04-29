export function translateCustomerType(type?: string | null) {
  switch (type) {
    case "student":
      return "طالب";
    case "employee":
      return "موظف";
    case "trainer":
      return "مدرب";
    case "parent":
      return "ولي أمر";
    case "visitor":
      return "زائر";
    default:
      return type ?? "-";
  }
}

export function translateStatus(status?: string | null) {
  switch (status) {
    case "active":
      return "نشط";
    case "inactive":
      return "موقوف";
    case "blacklisted":
      return "محظور";
    case "closed":
      return "مغلقة";
    case "cancelled":
      return "ملغية";
    case "confirmed":
      return "مؤكد";
    case "draft":
      return "مسودة";
    case "completed":
      return "مكتمل";
    case "new":
      return "جديد";
    case "in_preparation":
      return "قيد التحضير";
    case "ready":
      return "جاهز للتسليم";
    case "delivered":
      return "تم التسليم";
    case "unpaid":
      return "غير مدفوع";
    case "partially_paid":
      return "مدفوع جزئيًا";
    case "paid":
      return "مدفوع بالكامل";
    case "refunded":
      return "تم الاسترجاع";
    case "available":
      return "متاح";
    case "occupied":
      return "مشغول";
    case "booked_soon":
      return "محجوز قريبًا";
    case "under_prep":
      return "قيد التجهيز";
    case "out_of_service":
      return "خارج الخدمة";
    default:
      return status ?? "-";
  }
}

export function translateRoomType(type?: string | null) {
  switch (type) {
    case "coworking":
      return "كووركينج";
    case "study":
      return "مذاكرة";
    case "meeting":
      return "اجتماعات";
    case "hall":
      return "قاعة";
    default:
      return type ?? "-";
  }
}

export function translateSessionType(type?: string | null) {
  switch (type) {
    case "hourly":
      return "بالساعة";
    case "daily":
      return "يومي";
    case "package":
      return "باقة";
    case "booking_linked":
      return "مرتبط بحجز";
    default:
      return type ?? "-";
  }
}

export function translatePaymentMethod(method?: string | null) {
  switch (method) {
    case "cash":
      return "كاش";
    case "bank_transfer":
      return "تحويل بنكي";
    case "card":
      return "بطاقة";
    case "mixed":
      return "مختلط";
    default:
      return method ?? "-";
  }
}

export function translateProductCategory(category?: string | null) {
  switch (category) {
    case "coffee":
      return "قهوة";
    case "tea":
      return "شاي";
    case "juice":
      return "عصير";
    case "snack":
      return "سناك";
    case "dessert":
      return "حلويات";
    case "sandwich":
      return "ساندويتش";
    case "other":
      return "أخرى";
    default:
      return category ?? "-";
  }
}

export function translateBookingType(type?: string | null) {
  switch (type) {
    case "meeting":
      return "اجتماع";
    case "training":
      return "تدريب";
    case "event":
      return "فعالية";
    case "private":
      return "خاص";
    default:
      return type ?? "-";
  }
}

export function translateOperationalAlert(alert?: string | null) {
  if (!alert) return "-";
  const map: Record<string, string> = {
    "High pending bar orders volume": "طلبات البار كثيرة - عدد المعلق مرتفع",
    "High active sessions load": "ضغط جلسات مرتفع - عدد الحضور كبير",
    "Bar queue is building up": "طابور البار بيزيد - يلزم تسريع التحضير",
    "High upcoming bookings in next 24h": "حجوزات كثيرة خلال 24 ساعة - جهز المكان",
  };
  return map[alert] ?? alert;
}

export function translateAuditAction(action?: string | null) {
  const map: Record<string, string> = {
    "session.open": "فتح جلسة",
    "session.close": "قفل جلسة",
    "session.cancel": "إلغاء جلسة",
    "booking.create": "حجز جديد",
    "booking.complete": "إنهاء حجز",
    "booking.cancel": "إلغاء حجز",
    "invoice.generate": "إصدار فاتورة",
    "payment.record": "تسجيل دفع",
    "payment.refund": "تسجيل مرتجع",
    "customer.create": "تسجيل عميل",
    "customer.blacklist": "حظر عميل",
    "bar_order.create": "طلب بار جديد",
    "bar_order.deliver": "تسليم طلب بار",
    "user.create": "إضافة مستخدم",
    "user.deactivate": "إيقاف مستخدم",
    "room.create": "إضافة غرفة",
    "room.update": "تعديل غرفة",
  };
  return map[action ?? ""] ?? action ?? "-";
}
