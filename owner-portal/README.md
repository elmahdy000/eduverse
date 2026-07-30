# Owner Portal — بوابة أصحاب المشروع

تطبيق Next.js **منفصل تماماً** لعرض التقارير المالية والتشغيلية لأصحاب المشروع (owners). لا يشترك مع واجهة الموظفين في الكود ولا في الـ deployment.

## الأمان

- role جديد اسمه `OwnerPortal` منفصل عن `Owner` العادي.
- كل مسارات الـ backend تحت `/api/owner-portal/*` محمية بـ `JwtAuthGuard + OwnerPortalGuard`.
- **حسابات Owner العادية لا يمكنها الوصول لهذه البوابة** — العزل مضمون على مستوى الـ Guard.
- كل التقارير للقراءة فقط (`GET`).
- استخدم كلمة مرور قوية مستقلة للبوابة ولا تشاركها مع حسابات التشغيل اليومية.

## التشغيل الأول

### 1) إنشاء الـ role والحسابات الافتراضية في الـ backend

من مجلد `backend/` عيّن كلمة مرور قوية في متغير البيئة، ثم شغّل الـ seed:

```bash
export OWNER_PORTAL_SEED_PASSWORD='ضع-كلمة-مرور-قوية-هنا'
npx ts-node prisma/seed_owner_portal.ts
```

هذا ينشئ role `OwnerPortal` وحسابين مستقلين:

| البريد | كلمة المرور |
|---|---|
| owner-portal@eduvers.com | القيمة الآمنة في `OWNER_PORTAL_SEED_PASSWORD` |
| elmahdy-portal@eduvers.com | القيمة الآمنة في `OWNER_PORTAL_SEED_PASSWORD` |

### 2) تشغيل تطبيق الـ owner-portal

من مجلد `owner-portal/`:

```bash
npm install
cp .env.example .env
# تأكد من ضبط NEXT_PUBLIC_API_URL في .env
npm run dev
```

الافتراضي: البوابة تعمل على `http://localhost:3010` والـ backend على `http://localhost:3001`.

> ملاحظة: CORS في الـ backend مضبوط افتراضياً ليقبل من `:3010`، فمش محتاج تضيف حاجة في env الباك اند.

## الشاشات المتاحة

- `/dashboard` — لوحة KPI بأهم المؤشرات ومقارنة بالفترة السابقة.
- `/reports/activity` — سجل موحّد لكل الجلسات والحجوزات والطلبات والمدفوعات والمصروفات والورديات والاشتراكات وتغييرات النظام.
- `/reports/revenue` — تقرير الدخل الكامل (فواتير، مدفوعات، طرق دفع، فواتير معلّقة).
- `/reports/expenses` — تقرير المصروفات تفصيلي بالتصنيف والمورد.
- `/reports/profit` — صافي الربح مع مقارنة الفترات ومخطط اتجاه.
- `/reports/bar` — تفاصيل مبيعات البار (المنتجات، التصنيفات، أنواع العملاء).
- `/reports/inventory` — حالة المخزون والهالك والأصناف تحت الحد.

## البنية

```
owner-portal/
├── app/                    # صفحات Next.js (App Router)
│   ├── layout.tsx
│   ├── page.tsx            # redirect
│   ├── login/
│   ├── dashboard/
│   └── reports/
│       ├── revenue/
│       ├── expenses/
│       ├── profit/
│       ├── bar/
│       └── inventory/
├── components/             # مكونات مشتركة
├── lib/                    # API client + helpers
└── package.json
```
