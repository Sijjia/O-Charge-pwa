-- =====================================================
-- Complete Owner RLS Policies - ДОПОЛНЕНИЯ
-- =====================================================
-- Дата создания: 2025-11-17
-- Описание: Дополнительные RLS policies для Owner Dashboard
--           Расширенная безопасность и разделение прав
-- =====================================================

-- =====================================================
-- ENABLE RLS на всех таблицах (если еще не включено)
-- =====================================================

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Дополнительные policies для разделения ролей
-- =====================================================

-- Superadmin может видеть все станции
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stations'
    AND policyname = 'superadmin_can_view_all_stations'
  ) THEN
    CREATE POLICY "superadmin_can_view_all_stations"
      ON public.stations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()::text
            AND users.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- Superadmin может редактировать все станции
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stations'
    AND policyname = 'superadmin_can_update_all_stations'
  ) THEN
    CREATE POLICY "superadmin_can_update_all_stations"
      ON public.stations
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()::text
            AND users.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- Superadmin может видеть все локации
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations'
    AND policyname = 'superadmin_can_view_all_locations'
  ) THEN
    CREATE POLICY "superadmin_can_view_all_locations"
      ON public.locations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()::text
            AND users.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- Admin может видеть локации где он назначен admin_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations'
    AND policyname = 'admin_can_view_managed_locations'
  ) THEN
    CREATE POLICY "admin_can_view_managed_locations"
      ON public.locations
      FOR SELECT
      TO authenticated
      USING (
        admin_id = auth.uid()::text
        OR user_id = auth.uid()::text
      );
  END IF;
END $$;

-- =====================================================
-- Защита от изменения owner_id
-- =====================================================

-- Prevent changing station ownership (только superadmin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stations'
    AND policyname = 'prevent_ownership_change'
  ) THEN
    CREATE POLICY "prevent_ownership_change"
      ON public.stations
      FOR UPDATE
      TO authenticated
      USING (
        -- Allow only if user_id не меняется ИЛИ user is superadmin
        user_id = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()::text
            AND users.role = 'superadmin'
        )
      )
      WITH CHECK (
        user_id = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()::text
            AND users.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- =====================================================
-- Audit Log для критичных операций
-- =====================================================

-- Create audit log table (если еще нет)
CREATE TABLE IF NOT EXISTS public.owner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.owner_audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmin can view audit log
CREATE POLICY "only_superadmin_can_view_audit_log"
  ON public.owner_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text
        AND users.role = 'superadmin'
    )
  );

-- =====================================================
-- Triggers для audit log
-- =====================================================

-- Function to log station changes
CREATE OR REPLACE FUNCTION log_station_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.owner_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid()::text,
      'UPDATE',
      'stations',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.owner_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_data
    ) VALUES (
      auth.uid()::text,
      'DELETE',
      'stations',
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on stations table
DROP TRIGGER IF EXISTS audit_station_changes ON public.stations;
CREATE TRIGGER audit_station_changes
  AFTER UPDATE OR DELETE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION log_station_changes();

-- =====================================================
-- Проверки безопасности
-- =====================================================

-- Prevent deleting station with active sessions
CREATE OR REPLACE FUNCTION prevent_delete_active_station()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.charging_sessions
    WHERE station_id = OLD.id
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Cannot delete station with active charging sessions';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_active_sessions_before_delete ON public.stations;
CREATE TRIGGER check_active_sessions_before_delete
  BEFORE DELETE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_active_station();

-- =====================================================
-- ПРОВЕРКА УСТАНОВЛЕННЫХ POLICIES
-- =====================================================

-- Query to check all policies
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('stations', 'locations', 'charging_sessions', 'users')
ORDER BY tablename, policyname;
*/

-- =====================================================
-- GRANT необходимых прав
-- =====================================================

-- Authenticated users can read from audit log (если superadmin)
GRANT SELECT ON public.owner_audit_log TO authenticated;

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================

-- Примечания:
-- 1. Все критичные операции логируются в owner_audit_log
-- 2. Superadmin имеет доступ ко всем данным
-- 3. Обычные owners видят только свои данные
-- 4. Невозможно удалить станцию с активными сессиями
-- 5. Изменение владельца станции доступно только superadmin
