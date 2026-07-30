# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mixed role-based operators at an Egyptian coworking / educational space:

- **Receptionist** — primary daily operator. Manages sessions, bookings, customers, billing, payments, bar orders, shifts, and expenses. Works long shifts (8–12 hours) at a reception desk.
- **Barista** — manages bar orders (Kanban workflow: new → preparing → ready), views products, basic expense recording. Works behind a bar counter.
- **Operations Manager** — full operational oversight, inventory management, reports, analytics, user management. Reviews dashboards and financial summaries.
- **Owner** — full access. Reviews KPIs, profit reports, and owner portal analytics. May not be on-site daily.

All roles are Egyptian Arabic speakers. The interface is Arabic-first with Western digits for financial values, phone numbers, dates, and IDs.

## Product Purpose

EDUVERSE (إديوفيرس) is an all-in-one operations management platform for coworking spaces, study cafés, and educational community venues in Egypt. It handles the complete daily workflow: customer registration, session tracking with live billing (hourly/daily/package), room and booking management, bar/café POS, invoicing, payment collection, expense tracking, inventory management, shift reconciliation, and subscription packages.

Success means: reception staff can handle a full day of operations — opening sessions, taking bar orders, closing invoices, recording expenses, and reconciling shifts — without switching to paper, spreadsheets, or external tools.

## Positioning

A single Arabic-native system purpose-built for Egyptian coworking/study spaces that combines session billing, room booking, café POS, and financial operations in one platform — eliminating the need for separate POS, booking, and accounting tools.

## Operating Context

- **Physical setup:** Desktop monitors at reception desks, tablets carried by staff on the floor, phones for quick checks.
- **Working hours:** Long shifts (typically 8–12+ hours). The UI must be comfortable for extended use.
- **Printing:** 80mm Xprinter thermal receipt printers for invoices/receipts. A4 printing for financial reports and summaries.
- **Connectivity:** Uses api.edu-vers.com API. Socket.io for real-time updates (bar orders, dashboard refresh).
- **Currency:** Egyptian Pound (EGP / ج.م). All financial values in EGP with two decimal places.
- **Language:** Arabic UI labels. Western (Latin) digits for phone numbers, invoice IDs, dates, times, prices, emails, and technical values.

## Capabilities and Constraints

**Core modules:**
- Customers (registration, types: student/employee/trainer/parent/visitor, status management, history)
- Sessions (hourly/daily/package billing, live elapsed time, room assignment, close with invoicing)
- Bookings (room reservations, conflict detection, calendar view)
- Bar Orders (café POS with Kanban workflow, guest ordering via QR code)
- Invoices & Payments (generation, collection, partial payment, refunds, thermal printing)
- Expenses (categories, vendors, financial summary, trends)
- Products (menu items, pricing, cost tracking, availability)
- Inventory (stock management, recipes, waste tracking, low-stock alerts)
- Shifts (open/close with cash reconciliation, expected vs actual cash)
- Rooms (types, capacity, rates, availability)
- Subscription Plans (daily/weekly/monthly packages with configurable pricing)
- Dashboards (role-specific: owner, operations manager, reception, barista)
- Audit Logs, Owner Portal (separate reporting interface)

**Technical stack:**
- Frontend: Next.js 16, React 19, Tailwind CSS v4, Zustand, React Query, lucide-react, sonner, framer-motion, socket.io-client
- Backend: NestJS, Prisma, PostgreSQL
- Current font: Cairo
- Current layout: RTL with sidebar navigation

**Constraints:**
- Must preserve all business logic, API calls, routes, calculations, and permissions
- Arabic-first RTL interface
- No gradients in the redesign
- No excessive animations
- Orange (#F79400) is brand accent, not dominant color
- Must work reliably on desktop, tablet, and phone

## Brand Commitments

- **Name:** إديوفيرس / EDUVERSE / Eduvers
- **Domain:** edu-vers.com
- **Brand color:** Orange (#F79400) as accent
- **Voice:** Professional Arabic operational language. Clear, direct, no jargon.
- **Logo:** `/logo.png` (referenced in structured data)

## Evidence on Hand

- Live production API at api.edu-vers.com
- Existing frontend implementation with all pages functional
- Backend with complete RBAC (Owner, Operations Manager, Receptionist, Barista roles)
- Prisma schema with full data model
- Guest ordering system via QR codes (public routes)
- Real customer, session, and financial data in production

No fabricated testimonials, case studies, or benchmarks exist.

## Product Principles

1. **Shift-long comfort** — Every screen must be usable for 8+ hours without fatigue. Calm surfaces, readable type, no visual noise.
2. **Arabic operational clarity** — Labels, errors, and statuses in clear Arabic. Numbers and IDs in isolated LTR formatting. No ambiguous bidi rendering.
3. **One action, one click** — Primary actions are obvious and reachable. Secondary actions are available but don't compete. Destructive actions require confirmation.
4. **Real-time operational awareness** — Active sessions, bar orders, and shift summaries stay live. Staff always knows the current state without refreshing.
5. **Financial precision** — Currency formatting, payment calculations, and shift reconciliation are exact and trustworthy. No rounding surprises.

## Accessibility & Inclusion

- WCAG AA color contrast required
- Keyboard navigation for all interactive elements
- Focus-visible states on all controls
- Semantic HTML (buttons, tables, headings, dialogs)
- Screen reader labels for all form fields
- 44px minimum touch targets for mobile/tablet
- Escape-to-close and focus trapping in dialogs/drawers
- Do not rely on color alone to communicate state
