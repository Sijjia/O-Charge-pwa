# Full UI Redesign — Designer Mockups (Phase 1)

## Context

HTML-макеты от дизайнера в `pages(phase1)/` определяют новый UI для Red Petroleum EV. Текущее PWA использует стили EVPower (Lucide иконки, `#050507` фон, 5 табов навигации). Нужно полностью переверстать ВСЕ существующие экраны по макетам дизайнера.

**Решения пользователя:**
- Иконки: Lucide → Solar (Iconify) **по всему приложению**
- Навигация: 4 таба (Карта, История, Баланс, Профиль)
- Scope: сначала существующие страницы, guest/admin экраны позже

---

## Phase 0: Design System Foundation

Обновить базовые стили и конфигурацию до начала вёрстки страниц.

### 0.1 Цвета — `tailwind.config.js` + `theme.css` + `index.css`
- Background: `#050507` → `#0A0E17` (основной фон страниц)
- CSS var: `--ev-bg-primary: #0A0E17`
- CSS var: `--ev-bg-secondary: #111621` (карточки, панели)
- Добавить `--ev-bg-card: rgba(24, 24, 27, 0.4)` (glass panels)

### 0.2 Анимации — `tailwind.config.js`
Добавить keyframes:
```
rise-up-long — energy beams (для ChargingProcessPage)
ripple — пульсирующие круги
shine — background shimmer на карточках
charge-glow — SVG glow для зарядки
breathing-glow — для guest landing
```

### 0.3 CSS Utilities — `index.css`
```css
.glass-panel { background: rgba(24,24,27,0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
.font-display { font-family: 'Manrope', sans-serif; }
.hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scroll::-webkit-scrollbar { display: none; }
```

### 0.4 Иконки — убрать lucide-react, перейти на @iconify/react
- `@iconify/react` уже в dependencies
- Создать маппинг Lucide → Solar в отдельном файле `src/shared/icons.ts`
- Lucide `Map` → `solar:map-point-bold` / `solar:map-point-linear`
- Lucide `Zap` → `solar:bolt-bold` / `solar:bolt-linear`
- Lucide `User` → `solar:user-bold` / `solar:user-linear`
- Lucide `Clock` → `solar:clock-circle-linear`
- Lucide `ChevronLeft` → `solar:arrow-left-linear`
- Lucide `Heart` → `solar:heart-linear`
- Lucide `Wallet` → `solar:wallet-linear` / `solar:wallet-bold`
- Lucide `CreditCard` → `solar:card-linear`
- Lucide `Settings` → `solar:settings-linear`
- Lucide `LogOut` → `solar:logout-linear`
- И т.д. для всех используемых иконок (~30 шт.)

**Файлы:**
- `pwa-rp/tailwind.config.js`
- `pwa-rp/src/styles/theme.css`
- `pwa-rp/src/index.css`
- `pwa-rp/src/shared/icons.ts` (НОВЫЙ)

---

## Phase 1: Bottom Navigation

**Файл:** `src/shared/components/BottomNavigation.tsx`
**Макет:** screen-2-5-home-map.html (навбар), screen-2-14-balance-wallet.html (навбар)

### Изменения:
- 5 табов → **4 таба**: Карта, История, Баланс, Профиль
- Иконки: Lucide → Solar
  - Карта: `solar:map-point-bold` (active) / `solar:map-point-linear`
  - История: `solar:history-bold` / `solar:history-linear`
  - Баланс: `solar:wallet-bold` / `solar:wallet-linear`
  - Профиль: `solar:user-bold` / `solar:user-linear`
- Стиль: `bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 pb-safe`
- Active: `text-red-600` + красная точка-индикатор внизу иконки
- Inactive: `text-zinc-500`
- Убрать: Framer Motion layoutId animation (CSS достаточно)
- **Сохранить:** баннер активной зарядки (красный, сверху навбара)
- Маршруты: `/` (Карта), `/history` (История), `/payments` (Баланс), `/profile` (Профиль)

---

## Phase 2: Auth Flow (2 экрана)

### 2.1 PhoneAuthPage
**Файл:** `src/features/auth/pages/PhoneAuthPage.tsx`
**Макет:** `auth-phone.html`

- Фон: `bg-zinc-950` + декоративный gradient сверху (`from-red-900/10`)
- Header: кнопка назад (круглая, `bg-zinc-900`) + "Помощь"
- Badge: "Безопасный вход" (shield icon + text, `bg-zinc-900/80 border-zinc-800`)
- Заголовок: `text-3xl font-semibold font-display` "Вход или регистрация"
- Подзаголовок: `text-sm text-zinc-400`
- Input: большой `h-[72px]` с иконкой смартфона, prefix `+996`, `rounded-2xl`
  - Focus: `border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]`
- Footer (sticky): красная кнопка "Продолжить" `h-14 bg-red-600 rounded-xl` + legal links

### 2.2 OTPVerifyPage
**Файл:** `src/features/auth/pages/OTPVerifyPage.tsx`
**Макет:** `auth-otp.html`

- Фон: `bg-[#050507]` (dark-bg)
- Nav: круглая кнопка назад (`bg-white/5 border-white/5`)
- Заголовок: "Введите код" + телефон `text-white/80`
- 6 инпутов: `aspect-square bg-[#111113] border-[#1C1C1F] rounded-lg font-mono`
  - Focus: `border-red-500 ring-1 ring-red-500/50`
- Toggle SMS/WhatsApp: сегментированный контрол
- Таймер: `text-cyan-400` "Отправить повторно через 0:59"
- Кнопка: `bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.2)]`
- Ambient: красный и синий blur в углах

---

## Phase 3: Map + Station Card (2 экрана)

### 3.1 MapPage
**Файл:** `src/pages/MapPage.tsx`
**Макеты:** `screen-2-5-home-map.html`, `map.html`

Карта остаётся (Yandex Maps). Изменения в UI обёртке:
- Search bar: `bg-zinc-900/80 backdrop-blur-md border-zinc-800 rounded-2xl`
  - Icon: `solar:magnifer-linear`
  - Filter button: `solar:tuning-2-linear`
- Quick filters: chips `bg-zinc-900/60 backdrop-blur-sm border-zinc-800 rounded-lg`
- Map controls: кнопки GPS + layers (`bg-zinc-900/80 backdrop-blur-md rounded-xl`)
- Маркеры: стиль ценника (красный для выбранного, серый для остальных)
  - Selected: `bg-red-600 rounded-xl` с ценой и bolt icon
  - Default: `bg-zinc-900 border-zinc-700` с ценой

### 3.2 Station Card Bottom Sheet
**Компонент:** `src/features/stations/components/StationCardSheet.tsx` (НОВЫЙ)
**Макет:** `screen-2-6-station-card.html`

- Glass panel: `rounded-[28px] border-zinc-800` с backdrop-blur
- Drag handle: `w-10 h-1 bg-zinc-700/50`
- Header: название + адрес + расстояние + badge статуса (emerald/amber/red)
- Connectors list: карточки с иконками типа коннектора, мощностью, ценой
  - Свободный: обычный стиль
  - Занят: `opacity-60` с пометкой "Занят"
- Promo block: ночной тариф (indigo palette)
- CTA: `bg-red-600 rounded-2xl` "Начать зарядку"

---

## Phase 4: Station Details + Charging Limits (2 экрана)

### 4.1 Station Details
**Файл:** `src/pages/ChargingPage.tsx` (или новый `StationDetailsPage.tsx`)
**Макет:** `screen-2-7-station-details.html`

- Photo slider: `h-[320px]` с gradient overlay
- Rounded content area: `-mt-6 rounded-t-[32px] bg-[#0A0E17]`
- Header: название + адрес + статус badge + расстояние
- Route button: `bg-zinc-800 rounded-2xl border-zinc-700`
- Amenities: chips (Кофе, Wi-Fi, Туалет) с иконками
- Tariff table: день/ночь с иконками (sun/moon), ночной тариф `-20%` indigo accent
- Connectors: карточки со статусами
- Sticky footer: красная кнопка "Начать зарядку"

### 4.2 Charging Limits
**Файл:** `src/features/charging/components/ChargingLimitsSelector.tsx`
**Макет:** `screen-2-10-set-limit.html`

- Header: "Лимит зарядки" centered
- Balance card: `bg-zinc-900/50 border-white/5 rounded-2xl`
- Radio options: "До полного" / "По сумме" (selected) / "По энергии"
  - Selected: `border-red-600 bg-zinc-900/50 shadow-[0_0_0_1px_rgba(220,38,38,0.2)]`
  - Unselected: `border-zinc-800 bg-zinc-900/30`
  - Radio dot: `border-red-600 bg-red-600` with inner dot
- Input: `bg-[#0A0E17] border-zinc-700 focus:border-red-600`
- Quick chips: 200, 500 (selected, red), 1000, Full
- Warning: amber alert `bg-amber-500/10 border-amber-500/20`
- Sticky CTA: "Далее" + arrow icon

---

## Phase 5: Confirmation + Active Charging + Success (3 экрана)

### 5.1 Confirmation
**Файл:** `src/pages/ChargingPage.tsx` (секция confirmation)
**Макет:** `screen-2-11-confirmation.html`

- Summary card: `rounded-[24px] border-zinc-800`
  - Station row: icon + название + адрес
  - Connector row: icon + тип + мощность badge
- Financial card: тариф, резерв, info box (blue accent)
- Checkbox: "Я подключил кабель" custom checkbox (red)
- CTA: "Начать зарядку" с shine animation на hover

### 5.2 Active Charging (ChargingProcessPage)
**Файл:** `src/pages/ChargingProcessPage.tsx`
**Макет:** `screen-2-12-active-charging.html`

- **Energy beams background**: 7 анимированных лучей (rise-up-long)
- **SVG gauge**: progress circle с neon glow (`drop-shadow red`)
  - Track: `stroke-zinc-800/50`
  - Progress: `stroke-red-600` с pulse-glow animation
- Center: `text-6xl font-bold` процент + badge "Зарядка идет..."
- **Ripple circles**: 2 пульсирующих круга `border-red-600/20`
- Data grid: 2x2 (Энергия, Время, Мощность, Стоимость)
  - Каждая: `bg-zinc-900/40 rounded-2xl border-zinc-800 backdrop-blur-sm`
- Charging graph: SVG с red gradient line
- Stop button: `bg-zinc-900 border-zinc-700 text-red-500` "Остановить зарядку"

### 5.3 Charging Complete
**Файл:** `src/pages/ChargingCompletePage.tsx`
**Макет:** `screen-2-13-success.html`

- Ambient glow: emerald top glow
- Success animation: SVG checkmark (stroke-dasharray animation) + particles
- Title: "Зарядка завершена!"
- Receipt card: `bg-zinc-900 rounded-3xl`
  - Total: `text-4xl font-semibold`
  - Stats grid: Объём + Время
  - Divider: dashed
  - Refund row: emerald accent
  - Download button: PDF чек
- Rating: 5 звёзд (Solar star icons)
- CTA: **белая** кнопка "На главную" `bg-white text-black`

---

## Phase 6: Balance/Wallet + Profile (2 экрана)

### 6.1 Balance/Wallet
**Файл:** `src/pages/PaymentsPage.tsx` (или `BalancePage.tsx`)
**Макет:** `screen-2-14-balance-wallet.html`

- Ambient glows: красный вверху-справа, синий внизу-слева
- Header: аватар + имя + bell icon с badge
- Wallet card: `rounded-3xl` с gradient `from-zinc-800 to-zinc-950` + grain texture + red glow
  - Баланс: `text-5xl font-bold font-display`
  - Actions: "Пополнить" (белая кнопка) + "Карты" (zinc кнопка)
- Transaction history: `bg-zinc-900/50 rounded-3xl`
  - Items: icon + name + date + amount (green/white)
  - Dividers: `h-px w-[80%] mx-auto bg-zinc-800/50`

### 6.2 Profile
**Файл:** `src/pages/ProfilePage.tsx`
**Макет:** `screen-2-23-partner-profile.html`

- Ambient: red glows
- Header: back + "Профиль" + settings icon
- Avatar: `w-24 h-24 rounded-full` с online indicator + red glow
- Name + phone
- Client menu: `bg-[#111621] rounded-2xl border-zinc-800`
  - Items: icon circle + label + chevron
  - История зарядок, Избранное
- Partner section (if owner): красный header + items
  - Мои станции (с badge count), Мой доход, Статистика, Акты сверки
- Logout button

---

## Phase 7: QR Payment + Owner Revenue (2 компонента)

### 7.1 QR Payment
**Компонент:** `src/features/balance/components/QRTopup.tsx`
**Макет:** `screen-2-16-qr-payment.html`

- Ambient: indigo glow
- White card: `bg-white text-zinc-900 rounded-[32px]` — стоимость + QR код
- Timer: red badge
- Bank logos grid: 3x2

### 7.2 Owner Revenue
**Файл:** `src/pages/owner/OwnerRevenuePage.tsx`
**Макет:** `screen-2-26-partner-revenue.html`

- Period selector: pill button
- Total revenue: `text-4xl font-bold` + info badge (доля 80%)
- Chart: SVG area chart с red gradient + animated path + tooltip dot
- Station breakdown: list с progress bars

---

## Phase 8: Shared Components Update

Обновить все shared компоненты для консистентности:

### Иконки (batch sed + manual)
Заменить все `import { Icon } from "lucide-react"` → `import { Icon } from "@iconify/react"` + обновить имена иконок в файлах:
- `BottomNavigation.tsx`
- `ProfilePage.tsx`
- `ChargingPage.tsx`
- `ChargingProcessPage.tsx`
- `ChargingCompletePage.tsx`
- `HistoryPage.tsx`
- `PaymentsPage.tsx`
- `SettingsPage.tsx`
- `SupportPage.tsx`
- `AboutPage.tsx`
- `StationCard.tsx`, `StationCardCompact.tsx`
- `ChargingLimitsSelector.tsx`
- `QRScanner.tsx`
- `BalanceCard.tsx`
- `SimpleTopup.tsx`
- `ExportButton.tsx`
- `StatusBadge.tsx`
- `ConnectorStatusDots.tsx`
- `ConfirmDialog.tsx`
- `ErrorDisplay.tsx`
- `LoadingScreen.tsx`
- `OnboardingSlides.tsx`
- `InstallPrompt.tsx`
- `OwnerLayout.tsx`, owner components (~10 файлов)
- Auth components (`VerifyForm.tsx`, `PhoneAuthForm.tsx`)

### LoadingScreen.tsx (Splash)
**Макет:** `index.html`
- Фон: `bg-[#050507]` + red glow `bg-red-600/20 blur-[100px]`
- Логотип: "Red Petroleum EV" (red span для "EV")
- Subtitle: "Energy Network" `text-white/40 tracking-widest uppercase`
- Version: `text-white/20 font-mono`

---

## Phase 9: Router Updates

**Файл:** `src/app/Router.tsx`

- Обновить маршруты навигации: убрать `/stations`, `/favorites`, `/support` из bottom nav
- Добавить `/history` → `HistoryPage` (если ещё нет)
- `/payments` → `PaymentsPage` (Баланс tab)
- Убедиться что все existing routes работают

---

## Phase 10: Build & Verify

1. `npx tsc --noEmit` — type check
2. `npx vite build` — production build
3. Визуальная проверка каждого экрана
4. Commit

---

## Implementation Order (параллелизация)

**Batch 1** (Foundation — последовательно):
- Phase 0: Design System Foundation

**Batch 2** (параллельно):
- Phase 1: BottomNavigation
- Phase 2: Auth Flow (2 экрана)
- Phase 8: Icon replacement (batch)

**Batch 3** (параллельно):
- Phase 3: Map + Station Card
- Phase 5: Charging Flow (3 экрана)
- Phase 6: Balance + Profile

**Batch 4** (параллельно):
- Phase 4: Station Details + Limits
- Phase 7: QR Payment + Owner Revenue

**Batch 5**:
- Phase 9: Router
- Phase 10: Build & Verify

---

## Key Files

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Цвета, анимации, шрифты |
| `src/styles/theme.css` | CSS переменные |
| `src/index.css` | Глобальные стили, утилиты |
| `src/shared/icons.ts` | Маппинг Solar иконок (НОВЫЙ) |
| `src/shared/components/BottomNavigation.tsx` | 4-tab навигация |
| `src/features/auth/pages/PhoneAuthPage.tsx` | Вход по телефону |
| `src/features/auth/pages/OTPVerifyPage.tsx` | OTP верификация |
| `src/pages/MapPage.tsx` | Главная карта |
| `src/pages/ChargingPage.tsx` | Детали станции + лимиты + подтверждение |
| `src/pages/ChargingProcessPage.tsx` | Активная зарядка |
| `src/pages/ChargingCompletePage.tsx` | Завершение |
| `src/pages/PaymentsPage.tsx` | Кошелёк/Баланс |
| `src/pages/ProfilePage.tsx` | Профиль |
| `src/pages/owner/OwnerRevenuePage.tsx` | Доход партнёра |
| `src/app/Router.tsx` | Маршруты |

## Excluded (Phase 2 later)
- `screen-3-1-guest-landing.html` → GuestLandingPage (НОВЫЙ)
- `screen-3-3-guest-payment.html` → GuestPaymentPage (НОВЫЙ)
- `screen-3-5-guest-charging.html` → GuestChargingPage (НОВЫЙ)
- `screen-5-2-dashboard.html` → AdminDashboardPage (НОВЫЙ)
- `screen-5-9-reserves-monitor.html` → AdminReservesPage (НОВЫЙ)
