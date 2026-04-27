export function translateCustomerType(type?: string | null) {
  switch (type) {
    case "student":   return "طالب";
    case "employee":  return "موظف";
    case "trainer":   return "مدرب";
    case "parent":    return "ولي أمر";
    case "visitor":   return "زائر";
    default:          return type ?? "-";
  }
}

export function translateStatus(status?: string | null) {
  switch (status) {
    // customers
    case "active":          return "نشط";
    case "inactive":        return "موقوف";
    case "blacklisted":     return "محظور";
    // sessions
    case "closed":          return "اتقفلت";
    case "cancelled":       return "اتلغت";
    // bookings
    case "confirmed":       return "متأكد";
    case "draft":           return "مسودة";
    case "completed":       return "خلصت";
    // bar orders
    case "new":             return "جديد";
    case "in_preparation":  return "بيتجهز";
    case "ready":           return "جاهز";
    case "delivered":       return "اتسلّم";
    // payments
    case "unpaid":          return "لسه متدفعش";
    case "partially_paid":  return "متدفع جزء";
    case "paid":            return "متدفع";
    case "refunded":        return "اترد";
    // rooms
    case "available":       return "فاضية";
    case "occupied":        return "مشغولة";
    case "booked_soon":     return "قريب عليها حجز";
    case "under_prep":      return "بتتجهز";
    case "out_of_service":  return "متعطلة";
    default:                return status ?? "-";
  }
}

export function translateRoomType(type?: string | null) {
  switch (type) {
    case "coworking": return "كوورك";
    case "study":     return "مذاكرة";
    case "meeting":   return "اجتماعات";
    case "hall":      return "قاعة";
    default:          return type ?? "-";
  }
}

export function translateSessionType(type?: string | null) {
  switch (type) {
    case "hourly":          return "بالساعة";
    case "daily":           return "يومي";
    case "package":         return "باقة";
    case "booking_linked":  return "مرتبط بحجز";
    default:                return type ?? "-";
  }
}

export function translatePaymentMethod(method?: string | null) {
  switch (method) {
    case "cash":           return "كاش";
    case "bank_transfer":  return "تحويل بنكي";
    case "card":           return "بطاقة";
    case "mixed":          return "مختلط";
    default:               return method ?? "-";
  }
}

export function translateProductCategory(category?: string | null) {
  switch (category) {
    case "coffee":    return "☕ قهوة";
    case "tea":       return "🍵 شاي";
    case "juice":     return "🧃 عصير";
    case "snack":     return "🍿 سناك";
    case "dessert":   return "🍰 حلويات";
    case "sandwich":  return "🥪 ساندويتش";
    case "other":     return "📦 أخرى";
    default:          return category ?? "-";
  }
}

export function translateBookingType(type?: string | null) {
  switch (type) {
    case "meeting":  return "اجتماع";
    case "training": return "تدريب";
    case "event":    return "إيفنت";
    case "private":  return "خاص";
    default:         return type ?? "-";
  }
}

export function translateOperationalAlert(alert?: string | null) {
  if (!alert) return "-";
  // Backend English → Egyptian Arabic
  const map: Record<string, string> = {
    "High pending bar orders volume":        "📢 طلبات البار كتير — عدد المعلق عالي",
    "High active sessions load":             "📢 ضغط جلسات — الناس كتير جوا",
    "Bar queue is building up":              "⏳ طابور البار بيطول — تسرع التحضير",
    "High upcoming bookings in next 24h":    "📅 حجوزات كتير جاية — جهز المكان",
  };
  return map[alert] ?? alert;
}

export function translateAuditAction(action?: string | null) {
  const map: Record<string, string> = {
    "session.open":      "فتح جلسة",
    "session.close":     "قفل جلسة",
    "session.cancel":    "إلغاء جلسة",
    "booking.create":    "حجز جديد",
    "booking.complete":  "إنهاء حجز",
    "booking.cancel":    "إلغاء حجز",
    "invoice.generate":  "إصدار فاتورة",
    "payment.record":    "تسجيل دفع",
    "payment.refund":    "مرتجع دفع",
    "customer.create":   "تسجيل عميل",
    "customer.blacklist":"حظر عميل",
    "bar_order.create":  "طلب بار جديد",
    "bar_order.deliver": "تسليم طلب بار",
    "user.create":       "إضافة مستخدم",
    "user.deactivate":   "إيقاف مستخدم",
    "room.create":       "إضافة غرفة",
    "room.update":       "تعديل غرفة",
  };
  return map[action ?? ""] ?? action ?? "-";
}
