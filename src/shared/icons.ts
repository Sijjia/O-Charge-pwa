/**
 * Solar Icon Mapping — замена Lucide → Solar (Iconify)
 *
 * Использование:
 *   import { Icon } from "@iconify/react";
 *   import { ICONS } from "@/shared/icons";
 *   <Icon icon={ICONS.arrowLeft} width={24} />
 */

export const ICONS = {
  // Navigation
  arrowLeft: "solar:arrow-left-linear",
  arrowRight: "solar:arrow-right-linear",
  chevronLeft: "solar:alt-arrow-left-linear",
  chevronRight: "solar:alt-arrow-right-linear",
  chevronDown: "solar:alt-arrow-down-linear",
  close: "solar:close-circle-linear",
  x: "solar:close-linear",
  externalLink: "solar:square-arrow-right-up-linear",
  moreHorizontal: "solar:menu-dots-bold",

  // Map & Location
  map: "solar:map-point-linear",
  mapBold: "solar:map-point-bold",
  mapPin: "solar:map-point-linear",
  navigation: "solar:routing-2-linear",
  gps: "solar:gps-linear",
  layers: "solar:layers-linear",

  // User & Auth
  user: "solar:user-linear",
  userBold: "solar:user-bold",
  phone: "solar:phone-linear",
  smartphone: "solar:smartphone-linear",
  mail: "solar:letter-linear",
  logOut: "solar:logout-linear",
  eye: "solar:eye-linear",
  eyeOff: "solar:eye-closed-linear",
  shieldCheck: "solar:shield-check-linear",

  // Charging & Energy
  zap: "solar:bolt-linear",
  zapBold: "solar:bolt-bold",
  zapDuotone: "solar:bolt-bold-duotone",
  battery: "solar:battery-charge-linear",
  lightning: "solar:lightning-linear",
  plugCircle: "solar:plug-circle-bold",
  plugCircleLinear: "solar:plug-circle-linear",
  chargingStation: "solar:ev-station-linear",
  boltCircle: "solar:bolt-circle-linear",
  boltCircleBold: "solar:bolt-circle-bold",
  stopCircle: "solar:stop-circle-bold",

  // Finance & Wallet
  wallet: "solar:wallet-linear",
  walletBold: "solar:wallet-bold",
  walletAdd: "solar:wallet-add-linear",
  walletMoney: "solar:wallet-money-linear",
  creditCard: "solar:card-linear",
  cardReceive: "solar:card-recive-linear",
  dollarSign: "solar:dollar-minimalistic-linear",
  tagPrice: "solar:tag-price-linear",

  // Time & History
  clock: "solar:clock-circle-linear",
  history: "solar:history-linear",
  historyBold: "solar:history-bold",
  calendar: "solar:calendar-linear",
  calendarDate: "solar:calendar-date-linear",

  // Status
  checkCircle: "solar:check-circle-bold",
  checkRead: "solar:check-read-linear",
  alertCircle: "solar:danger-circle-linear",
  alertTriangle: "solar:danger-triangle-linear",
  info: "solar:info-circle-linear",
  xCircle: "solar:close-circle-linear",
  circle: "solar:record-circle-linear",

  // Actions
  search: "solar:magnifer-linear",
  filter: "solar:tuning-2-linear",
  plus: "solar:add-circle-linear",
  download: "solar:alt-arrow-down-linear",
  share: "solar:share-linear",
  save: "solar:diskette-linear",
  refresh: "solar:refresh-linear",
  loader: "solar:loading-linear",
  trash: "solar:trash-bin-trash-linear",
  calculator: "solar:calculator-linear",

  // Content & Media
  heart: "solar:heart-linear",
  heartBold: "solar:heart-bold",
  star: "solar:star-linear",
  starBold: "solar:star-bold",
  sparkles: "solar:stars-minimalistic-linear",
  lightbulb: "solar:lightbulb-linear",

  // Files & Documents
  fileText: "solar:file-text-linear",
  fileSpreadsheet: "solar:document-text-linear",
  link: "solar:link-linear",

  // Communication
  messageSquare: "solar:chat-square-linear",
  bell: "solar:bell-linear",
  question: "solar:question-circle-linear",

  // System & Settings
  settings: "solar:settings-linear",
  wrench: "solar:wrench-linear",
  activity: "solar:graph-new-linear",
  wifi: "solar:wi-fi-square-linear",
  wifiOff: "solar:wi-fi-router-minimalistic-linear",

  // Arrows & Indicators
  arrowUpCircle: "solar:arrow-up-linear",
  arrowDownCircle: "solar:arrow-down-linear",
  arrowUpDown: "solar:sort-vertical-linear",
  trendingUp: "solar:graph-up-linear",
  trendingDown: "solar:graph-down-linear",

  // Weather / Time of day
  sun: "solar:sun-2-bold",
  moon: "solar:moon-bold",
  moonStars: "solar:moon-stars-bold",

  // Amenities
  coffee: "solar:cup-hot-linear",
  bath: "solar:bath-linear",

  // Station-specific
  gasStation: "solar:ev-station-linear",
  lockPassword: "solar:lock-password-linear",
  addCircle: "solar:add-circle-linear",
} as const;

export type IconName = keyof typeof ICONS;
