-- =====================================================
-- Owner Auth Integration - UPDATED 2025-11-17
-- =====================================================
-- Описание: Эта миграция БОЛЬШЕ НЕ НУЖНА!
--           Синхронизация auth.users → public.users происходит
--           через ЕДИНЫЙ триггер handle_new_user()
--
-- Триггер handle_new_user() автоматически:
-- 1. Проверяет raw_user_meta_data.user_type
-- 2. Если user_type = 'client' → создает в public.clients
-- 3. Если user_type IN ('operator', 'admin', 'superadmin') → создает в public.users
--
-- Для создания нового owner:
-- 1. Superadmin создает пользователя в Supabase Auth Dashboard
-- 2. Устанавливает user_metadata: { user_type: 'admin' }
-- 3. Триггер автоматически создаст запись в public.users
-- =====================================================

-- ПРИМЕЧАНИЕ: Все функции handle_new_owner(), handle_owner_update(),
-- handle_owner_delete() УДАЛЕНЫ, так как дублируют handle_new_user()

-- Документация для создания owner вручную:
-- 1. Через Supabase Auth Dashboard:
--    - Authentication → Users → Add User
--    - Email: owner@example.com
--    - Password: <secure-password>
--    - User Metadata: { "user_type": "admin" }
--
-- 2. Через SQL (только для superadmin):
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'owner@example.com',
  crypt('secure-password-here', gen_salt('bf')),
  now(),
  '{"user_type": "admin", "name": "Owner Name"}'::jsonb,
  now(),
  now()
);
*/

-- Триггер handle_new_user() автоматически создаст запись в public.users

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================
