export function translateApiError(message?: string | string[]) {
  const raw = Array.isArray(message) ? message[0] : message;

  switch (raw) {
    case "Invalid email or password":
      return "الإيميل أو الباسورد غلط.";
    case "Unauthorized: Invalid or missing JWT token":
      return "الجلسة خلصت، سجل دخول تاني.";
    case "Insufficient permissions":
      return "مالكش صلاحية تعمل الحركة دي.";
    case "Customer not found":
      return "العميل ده مش موجود.";
    case "Session not found":
      return "الجلسة دي مش موجودة.";
    case "Customer already has an active session":
      return "العميل ده عنده جلسة مفتوحة بالفعل.";
    case "Only active sessions can be closed":
      return "مينفعش تقفل غير جلسة شغالة.";
    case "Only active sessions can be cancelled":
      return "مينفعش تلغي غير جلسة شغالة.";
    case "Room is not available for the selected time range":
      return "الغرفة دي مش فاضية في المعاد ده.";
    case "Room not found":
      return "الغرفة مش موجودة.";
    case "Room is out of service":
      return "الغرفة دي خارج الخدمة دلوقتي.";
    case "Participant count exceeds room capacity":
      return "عدد الحضور أكبر من سعة الغرفة.";
    case "Invoice not found":
      return "الفاتورة مش موجودة.";
    case "Invoice already exists for this session":
      return "الفاتورة دي متسجلة قبل كده على الجلسة.";
    case "Payment amount exceeds remaining invoice amount":
      return "المبلغ أكبر من المتبقي في الفاتورة.";
    case "Payment not found":
      return "عملية الدفع مش موجودة.";
    case "Refund amount cannot exceed original payment amount":
      return "المرتجع مينفعش يبقى أكبر من أصل المبلغ.";
    case "Booking not found":
      return "الحجز مش موجود.";
    case "Cancelled or completed bookings cannot be edited":
      return "الحجز الملغي أو اللي خلص مينفعش يتعدل.";
    case "Product not found":
      return "المنتج مش موجود.";
    case "Active product with this name already exists":
      return "في منتج بنفس الاسم ومتفعّل بالفعل.";
    case "Another active product already uses this name":
      return "في منتج تاني متفعّل بنفس الاسم.";
    default:
      return raw || "حصلت مشكلة مش متوقعة، جرّب تاني.";
  }
}
