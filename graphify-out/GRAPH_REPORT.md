# Graph Report - D:\coders\eduvers  (2026-04-30)

## Corpus Check
- 113 files · ~116,019 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 544 nodes · 593 edges · 85 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `ExpensesController` - 12 edges
2. `ExpensesService` - 12 edges
3. `CustomersController` - 11 edges
4. `CustomersService` - 11 edges
5. `UsersController` - 11 edges
6. `UsersService` - 11 edges
7. `BookingsService` - 10 edges
8. `DashboardsService` - 10 edges
9. `BarOrdersGateway` - 9 edges
10. `BarOrdersService` - 9 edges

## Surprising Connections (you probably didn't know these)
- `onSubmit()` --calls--> `roleHomePath()`  [INFERRED]
  D:\coders\eduvers\frontend\app\login\page.tsx → D:\coders\eduvers\frontend\lib\api.ts
- `onSubmit()` --calls--> `translateApiError()`  [INFERRED]
  D:\coders\eduvers\frontend\app\login\page.tsx → D:\coders\eduvers\frontend\lib\errors.ts
- `statusBadgeTone()` --calls--> `translateStatus()`  [INFERRED]
  D:\coders\eduvers\frontend\app\(protected)\customers\page.tsx → D:\coders\eduvers\frontend\lib\labels.ts
- `money()` --calls--> `translatePaymentMethod()`  [INFERRED]
  D:\coders\eduvers\frontend\app\(protected)\billing\page.tsx → D:\coders\eduvers\frontend\lib\labels.ts
- `printSelectedInvoice()` --calls--> `translateStatus()`  [INFERRED]
  D:\coders\eduvers\frontend\app\(protected)\reports\page.tsx → D:\coders\eduvers\frontend\lib\labels.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (8): AuditLogsService, ExpensesController, ExpensesService, bootstrap(), readAllowedOrigins(), validateEnvironment(), main(), main()

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (4): CustomersService, ProductsService, RoomsService, SessionsService

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (4): BarOrdersController, BarOrdersGateway, BarOrdersService, GuestOrdersController

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (4): AuthService, JwtConfigService, PasswordService, UsersService

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (2): BookingsController, BookingsService

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (16): dateTime(), money(), translateStatus(), actionLabel(), ActiveSessionRow(), asObject(), entityLabel(), explainAction() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (5): DashboardsService, getDate(), goToNextWeek(), goToPreviousWeek(), goToToday()

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (5): BaristaGuard, OpsManagerGuard, OwnerGuard, ReceptionistGuard, RoleGuard

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (2): InvoicesController, InvoicesService

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (5): refreshAccessToken(), roleHomePath(), AuthController, translateApiError(), onSubmit()

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (2): handleSendChat(), WaitBadge()

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (1): CustomersController

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (1): UsersController

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (3): onCreateSubmit(), onUpdateSubmit(), roleLabel()

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (1): RoomsController

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (2): translatePaymentMethod(), money()

### Community 16 - "Community 16"
Cohesion: 0.36
Nodes (1): AuditLogsInterceptor

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (1): ProductsController

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (1): DashboardsController

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (1): SessionsController

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (1): PaymentsService

### Community 22 - "Community 22"
Cohesion: 0.73
Nodes (5): apiRequest(), assertSuccess(), firstListItem(), login(), main()

### Community 23 - "Community 23"
Cohesion: 0.73
Nodes (5): apiRequest(), isAllowedStatus(), login(), main(), runRoleSimulation()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (5): CreateCustomerDto, CustomerResponseDto, CustomersListResponseDto, SearchCustomerDto, UpdateCustomerDto

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): PaymentsController

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, CreateUserDto, UpdateUserDto, UserResponseDto, UsersListResponseDto

### Community 27 - "Community 27"
Cohesion: 0.4
Nodes (1): AppController

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (1): AuditLogsController

### Community 29 - "Community 29"
Cohesion: 0.4
Nodes (4): AuthResponseDto, LoginDto, LoginResponseDto, RegisterDto

### Community 30 - "Community 30"
Cohesion: 0.4
Nodes (1): PrismaService

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (4): CreateCategoryDto, CreateExpenseDto, CreateVendorDto, UpdateExpenseDto

### Community 32 - "Community 32"
Cohesion: 0.4
Nodes (4): CreateRoomDto, RoomAvailabilityDto, RoomResponseDto, UpdateRoomDto

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (1): minutesSince()

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (2): loadMenu(), readBarMenuFromExcel()

### Community 35 - "Community 35"
Cohesion: 0.5
Nodes (1): AppService

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (1): JwtAuthGuard

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (1): JwtStrategy

### Community 38 - "Community 38"
Cohesion: 0.5
Nodes (3): CreateBarOrderDto, CreateBarOrderItemDto, UpdateBarOrderStatusDto

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (3): BookingConflictQueryDto, CreateBookingDto, UpdateBookingDto

### Community 40 - "Community 40"
Cohesion: 0.5
Nodes (3): CloseSessionDto, CreateSessionDto, SessionResponseDto

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (2): RecordPaymentDto, RefundPaymentDto

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): CreateProductDto, UpdateProductDto

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): AppModule

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): AuditLogsModule

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): AuthModule

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): BarOrdersModule

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): BookingsModule

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): PrismaModule

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): CustomersModule

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): DashboardsModule

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): ExpensesModule

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): InvoicesModule

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): CreateInvoiceDto

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): PaymentsModule

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): ProductsModule

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): RoomsModule

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): SessionsModule

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): UsersModule

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **51 isolated node(s):** `AppModule`, `AuditLogsModule`, `AuthModule`, `LoginDto`, `RegisterDto` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 44`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `AuditLogsModule`, `audit-logs.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `AuthModule`, `auth.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `BarOrdersModule`, `bar-orders.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `BookingsModule`, `bookings.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `prisma.module.ts`, `PrismaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `CustomersModule`, `customers.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `dashboards.module.ts`, `DashboardsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `expenses.module.ts`, `ExpensesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `invoices.module.ts`, `InvoicesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `invoice.dto.ts`, `CreateInvoiceDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `payments.module.ts`, `PaymentsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `products.module.ts`, `ProductsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `rooms.module.ts`, `RoomsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `sessions.module.ts`, `SessionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `users.module.ts`, `UsersModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `error.tsx`, `ErrorPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `not-found.tsx`, `NotFound()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `layout.tsx`, `ProtectedLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `page.tsx`, `DashboardPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `page.tsx`, `handleClickOutside()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `page.tsx`, `openEdit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `AuthGate()`, `auth-gate.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `providers.tsx`, `Providers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `app.controller.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `app.e2e-spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `app-shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `InvoiceReceipt.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `auth-store.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomsService` connect `Community 1` to `Community 0`, `Community 14`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `ExpensesController` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `onSubmit()` connect `Community 9` to `Community 5`, `Community 6`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `AppModule`, `AuditLogsModule`, `AuthModule` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._