# PWA E2E Checklist

Отмечайте пункты при проверке на тестовом и прод окружении.

## Установка и обновления

- [ ] Приложение устанавливается через баннер (Chrome/Edge, Android)
- [ ] Инструкция для iOS (Share -> На экран Домой) работает
- [ ] Страница `/install` показывает кнопку/инструкции корректно
- [ ] `UpdatePrompt` появляется при новой версии (needRefresh=true)
- [ ] Кнопка "Обновить" выполняет skipWaiting и перезагрузку
- [ ] `/pwa/debug`: "Проверить" обновления, "Активировать" (skipWaiting), очистка кэшей, unregister работают

## Оффлайн

- [ ] Навигации без сети отдают `offline.html`
- [ ] Карта отображает кэшированные локации (бейдж "Оффлайн данные")
- [ ] Карточка станции в оффлайне рендерится из кэша, запуск зарядки заблокирован
- [ ] Прогрев кэша выполняется при старте (локации + последняя станция)

## Background Sync

- [ ] Безопасные мутации в оффлайне (исключая auth/charging/status/payments) ставятся в очередь
- [ ] Реплей происходит при восстановлении сети (см. метрику BG_SYNC_TRIGGER)

## Push Notifications

- [ ] Получение push (клиент): charging_started/completed/error, low_balance_warning
- [ ] Получение push (owner): new_session/session_completed, station_offline
- [ ] Клик по нотификации корректно навигирует по сценарию

## Метрики и отладка

- [ ] Метрики установки: beforeinstallprompt, accepted/dismissed, appinstalled приходят (Sentry STUB/логи)
- [ ] SW → App сообщения: OFFLINE_FALLBACK_USED, BG_SYNC_TRIGGER видны в логах/бредкрамбах
- [ ] `AboutPage`: версия, статус SW, кэши, локальные метрики отображаются

## Безопасность

- [ ] На проде установлены заголовки из `docs/SECURITY_HEADERS_DEPLOYMENT.md`
- [ ] CSP соответствует `docs/PROD_CSP.md` (без unsafe-eval/inline для скриптов; только nonce)
- [ ] Приватные запросы не кэшируются (Authorization/Supabase/charging/status)
- [ ] Service Worker обновляется предсказуемо (без auto-claim, через UpdatePrompt)

## UX детали

- [ ] InstallPrompt баннер не мешает навигации, корректно скрывается
- [ ] NetworkStatusBanner отображается при потере/восстановлении сети
- [ ] В оффлайне нет критичных ошибок/бесконечных лоадеров
