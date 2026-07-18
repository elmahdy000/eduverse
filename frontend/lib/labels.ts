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
    case "staff":
      return "طاقم عمل (50%)";
    case "owner_discount":
      return "مالك (70%)";
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

export function normalizeCategoryKey(category?: string | null): string {
  if (!category) return "";
  const key = category.toLowerCase().trim().replace(/[\s\-_']+/g, "-");

  if (key === "yogurt") return "yougert";
  if (key === "boba-additions") return "boba-drinks";
  if (key === "fresh-juice") return "juice";
  if (key === "indomy-add-ons") return "indomy-addons";
  if (key === "extras") return "additions";

  return key;
}

export function translateProductCategory(category?: string | null) {
  const key = normalizeCategoryKey(category);
  switch (key) {
    case "coffee":
      return "قهوة";
    case "tea":
      return "شاي";
    case "frappe":
      return "فرابيه";
    case "cold-coffee":
      return "قهوة مثلجة";
    case "hot-drinks":
      return "مشروبات ساخنة";
    case "frappuccino":
      return "فرابوتشينو";
    case "milk-shake":
      return "ميلك شيك";
    case "smoothies":
      return "سموذي";
    case "yougert":
      return "زبادي";
    case "cans":
      return "كانز";
    case "water":
      return "مياه";
    case "mocktails":
      return "موكتيل";
    case "indomy":
      return "إندومي";
    case "indomy-addons":
      return "إضافات إندومي";
    case "boba-drinks":
      return "بوبا";
    case "additions":
      return "إضافات";
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
    "High active sessions load": "ضغط أوقات مرتفع - عدد الحضور كبير",
    "Bar queue is building up": "طابور البار بيزيد - يلزم تسريع التحضير",
    "High upcoming bookings in next 24h": "حجوزات كثيرة خلال 24 ساعة - جهز المكان",
  };
  return map[alert] ?? alert;
}

export function translateAuditAction(action?: string | null) {
  const map: Record<string, string> = {
    "session.open": "بدء وقت",
    "session.close": "إنهاء وقت",
    "session.cancel": "إلغاء وقت",
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

const productTranslations: Record<string, string> = {
  // Coffee
  "Turkish Coffee (M)": "قهوة تركي (وسط)",
  "Turkish Coffee (L)": "قهوة تركي (كبير)",
  "French Coffee (M)": "قهوة فرنساوي (وسط)",
  "French Coffee (L)": "قهوة فرنساوي (كبير)",
  "Nescafe (M)": "نسكافيه (وسط)",
  "Nescafe (L)": "نسكافيه (كبير)",
  "Espresso (M)": "إسبريسو (وسط)",
  "Espresso (L)": "إسبريسو (كبير)",
  "Latte (M)": "لاتيه (وسط)",
  "Latte (L)": "لاتيه (كبير)",
  "Cappuccino (M)": "كابتشينو (وسط)",
  "Cappuccino (L)": "كابتشينو (كبير)",
  "Mocha (M)": "موكا (وسط)",
  "Mocha (L)": "موكا (كبير)",
  "Caramel Macchiato (M)": "كراميل ماكياتو (وسط)",
  "Caramel Macchiato (L)": "كراميل ماكياتو (كبير)",
  "Macchiato": "ماكياتو",
  "Flat White": "فلات وايت",
  "Cortada": "كورتادو",
  "Coffee Flavour": "نكهة قهوة",
  "Coffee Nutella": "قهوة نوتيلا",
  "Latte Pistachio": "لاتيه بستاشيو",
  "Latte Lotus": "لاتيه لوتس",
  "Latte Kinder": "لاتيه كيندر",
  "Spanish Latte": "سبانش لاتيه",

  // Tea
  "Tea": "شاي",
  "Milk Tea": "شاي بلبن",
  "Green Tea": "شاي أخضر",
  "Tea Flavour": "نكهة شاي",
  "Karak Tea": "شاي كرك",

  // Cold Coffee
  "Ice Latte": "آيس لاتيه",
  "Ice Americano": "آيس أمريكانو",
  "Ice Mocha": "آيس موكا",
  "Ice Spanish Latte": "آيس سبانش لاتيه",
  "Ice Caramel Macchiato": "آيس كراميل ماكياتو",
  "Ice Special": "آيس سبيشيال",
  "Ice Creme Brulee": "آيس كريم بروليه",
  "Ice Latte Pistachio": "آيس لاتيه بستاشيو",
  "Ice Latte Lotus": "آيس لاتيه لوتس",
  "Ice Latte Kinder": "آيس لاتيه كيندر",

  // Hot Drinks
  "Hot Chocolate (M)": "هوت شوكليت (وسط)",
  "Hot Chocolate (L)": "هوت شوكليت (كبير)",
  "Hot Oreo (M)": "هوت أوريو (وسط)",
  "Hot Oreo (L)": "هوت أوريو (كبير)",
  "Hot Lotus (M)": "هوت لوتس (وسط)",
  "Hot Lotus (L)": "هوت لوتس (كبير)",
  "Hot Cidar (M)": "هوت سيدار (وسط)",
  "Hot Cidar (L)": "هوت سيدار (كبير)",
  "Herbs": "أعشاب",
  "Mix Herbs": "ميكس أعشاب",
  "Hot Kinder": "هوت كيندر",
  "Hot Pistachio": "هوت بستاشيو",

  // Frappe
  "Dark Chocolate": "شوكولاتة داكنة",
  "White Chocolate": "شوكولاتة بيضاء",
  "Oreo": "أوريو",
  "Lotus": "لوتس",
  "Nutella": "نوتيلا",
  "Frappe Special": "فرابيه سبيشيال",

  // Frappuccino
  "Creme Brulee": "كريم بروليه",
  "Kinder": "كيندر",
  "Pistachio": "بستاشيو",

  // Milk Shake
  "Vanilla": "فانيليا",
  "Caramel": "كراميل",
  "Cheese Cake": "تشيز كيك",
  "Cheese Cake Kinder": "تشيز كيك كيندر",
  "Cheese Cake Lotus": "تشيز كيك لوتس",
  "Cheese Cake Blueberry": "تشيز كيك بلوبري",
  "Cheese Cake Oreo": "تشيز كيك أوريو",
  "Fruits": "فواكه",

  // Yogurt
  "Honey": "عسل",
  "Mix Fruits": "ميكس فواكه",

  // Cans
  "Redbull": "ريدبول",
  "Twist": "تويست",
  "V7": "في 7",
  "Spiro Spathes": "سبيرو سباتس",
  "Buzz": "باز",
  "Water": "مياه",
  "Suntop": "سن توب",
  "Mix Mara3y": "ميكس المراعي",

  // Mocktails
  "Sunshine (S)": "سان شاين (صغير)",
  "Sunshine (R)": "سان شاين (كبير)",
  "Sunrise (S)": "سان رايز (صغير)",
  "Sunrise (R)": "سان رايز (كبير)",
  "Mohito (S)": "موهيتو (صغير)",
  "Mohito (R)": "موهيتو (كبير)",
  "Cherry Cola (S)": "شيري كولا (صغير)",
  "Cherry Cola (R)": "شيري كولا (كبير)",
  "Hawaii (S)": "هاواي (صغير)",
  "Hawaii (R)": "هاواي (كبير)",
  "Apple Breeze (S)": "أبل بريز (صغير)",
  "Apple Breeze (R)": "أبل بريز (كبير)",
  "Tropical Fruits (S)": "فواكه استوائية (صغير)",
  "Tropical Fruits (R)": "فواكه استوائية (كبير)",
  "Pina Colada (S)": "بينا كولادا (صغير)",
  "Pina Colada (R)": "بينا كولادا (كبير)",
  "Soda Up (S)": "صودا أب (صغير)",
  "Soda Up (R)": "صودا أب (كبير)",
  "Phantom (S)": "فانتم (صغير)",
  "Phantom (R)": "فانتم (كبير)",
  "Mango Caller (S)": "مانجو كولر (صغير)",
  "Mango Caller (R)": "مانجو كولر (كبير)",
  "Power Drink (R)": "باور درينك (كبير)",

  // Smoothies / Additions / Other
  "Coffee": "قهوة",
  "Bubble Gum": "بابل جوم",
  "Mango": "مانجو",
  "Strawberry": "فراولة",
  "Peach": "خوخ",
  "Blue Berry": "بلوبري",
  "Passion Fruit": "باشون فروت",
  "Smoothies": "سموذي",
  "Fresh Juice": "عصير طازج",
  // Indomy types
  "Indomy": "إندومي",
  "Indomy Plain": "إندومي عادي",
  "Indomy with Cheese": "إندومي بجبنة",
  "Indomy with Hot Dog": "إندومي بهوت دوج",
  "Indomy with Turkey": "إندومي بتركي",
  "Indomy with Egg": "إندومي بالبيض",
  "Indomy Spicy": "إندومي حار",
  "Indomy with Butter": "إندومي بالزبدة",
  "Indomy Special": "إندومي سبيشيال",
  // Indomy Add-ons
  "Add Cheese": "إضافة جبنة",
  "Add Mix Cheese": "إضافة ميكس جبن",
  "Add Hot Dog": "إضافة هوت دوج",
  "Add Turkey": "إضافة تركي",
  "Add Egg": "إضافة بيضة",
  "Add Butter": "إضافة زبدة",
  "Flavour": "نكهة",
  "Milk": "حليب",
  "Cheese": "جبنة",
  "Hot Dog": "هوت دوج",
  "Turkey": "تركي",
};

export function translateProductName(name: string): string {
  const ar = productTranslations[name];
  if (!ar) return name;
  return `${name} - ${ar}`;
}

