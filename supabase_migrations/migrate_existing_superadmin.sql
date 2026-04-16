-- =====================================================
-- Миграция существующего superadmin в Supabase Auth
-- =====================================================
-- Дата создания: 2025-11-17
-- Описание: Создает пользователя в auth.users для
--           существующего superadmin@example.com
--           чтобы он мог войти через Owner Dashboard
-- =====================================================

-- ВАЖНО: Эту миграцию нужно выполнить ВРУЧНУЮ один раз!
--         После выполнения она больше не понадобится.

DO $$
DECLARE
  v_existing_owner_id text;
  v_existing_email text;
  v_new_auth_user_id uuid;
BEGIN
  -- Получаем данные существующего superadmin
  SELECT id, email
  INTO v_existing_owner_id, v_existing_email
  FROM public.users
  WHERE email = 'superadmin@example.com'
  LIMIT 1;

  IF v_existing_owner_id IS NULL THEN
    RAISE NOTICE 'Superadmin not found in public.users. Skipping migration.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found existing superadmin: % (ID: %)', v_existing_email, v_existing_owner_id;

  -- Проверяем, есть ли уже этот пользователь в auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id::text = v_existing_owner_id) THEN
    RAISE NOTICE 'User already exists in auth.users. Skipping creation.';
    RETURN;
  END IF;

  -- Создаем пользователя в auth.users с тем же ID
  -- ВАЖНО: Пароль нужно установить через Supabase Dashboard!
  -- Это просто заглушка для создания записи
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_existing_owner_id::uuid,
    'authenticated',
    'authenticated',
    v_existing_email,
    -- Временный хеш, НУЖ НО УСТАНОВИТЬ РЕАЛЬНЫЙ ПАРОЛЬ ЧЕРЕЗ DASHBOARD!
    crypt('CHANGE_THIS_PASSWORD', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'user_type', 'superadmin',
      'name', 'Super Admin',
      'migrated_from_legacy', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW(),
    NOW(),
    '',
    ''
  );

  RAISE NOTICE 'Created auth.users record for superadmin: %', v_existing_email;
  RAISE WARNING '⚠️  ВАЖНО: Установите новый пароль через Supabase Dashboard!';
  RAISE WARNING '⚠️  Authentication → Users → % → Reset Password', v_existing_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Migration failed: %', SQLERRM;
    RAISE NOTICE 'You may need to create the user manually through Supabase Dashboard';
END $$;

-- =====================================================
-- ИНСТРУКЦИЯ ПО УСТАНОВКЕ ПАРОЛЯ
-- =====================================================

-- После выполнения этой миграции:
--
-- 1. Перейдите в Supabase Dashboard
-- 2. Authentication → Users
-- 3. Найдите superadmin@example.com
-- 4. Нажмите "..." → "Reset Password"
-- 5. Установите новый надежный пароль
-- 6. Superadmin сможет войти через /owner/login

-- Альтернативный способ (через SQL в Supabase SQL Editor):
/*
UPDATE auth.users
SET encrypted_password = crypt('YOUR_NEW_SECURE_PASSWORD', gen_salt('bf'))
WHERE email = 'superadmin@example.com';
*/

-- =====================================================
-- ПРОВЕРКА МИГРАЦИИ
-- =====================================================

-- Проверить что пользователь создан:
-- SELECT
--   au.id as auth_id,
--   au.email,
--   au.raw_user_meta_data->>'user_type' as user_type,
--   au.email_confirmed_at,
--   u.id as public_users_id,
--   u.role,
--   u.is_active
-- FROM auth.users au
-- LEFT JOIN public.users u ON au.id::text = u.id
-- WHERE au.email = 'superadmin@example.com';

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================
