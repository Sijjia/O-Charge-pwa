-- =====================================================
-- RLS Policies для Owner Dashboard
-- =====================================================
-- Дата создания: 2025-11-17
-- Описание: Row Level Security policies для таблиц
--           stations и locations для владельцев
-- =====================================================

-- =====================================================
-- 1. RLS POLICIES ДЛЯ ТАБЛИЦЫ stations
-- =====================================================

-- Owners могут видеть только свои станции
CREATE POLICY "owners_can_view_own_stations"
  ON public.stations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Owners могут создавать свои станции
CREATE POLICY "owners_can_create_own_stations"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Owners могут редактировать свои станции
CREATE POLICY "owners_can_update_own_stations"
  ON public.stations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Owners могут удалять свои станции (soft delete через update status)
CREATE POLICY "owners_can_delete_own_stations"
  ON public.stations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Public могут видеть только активные станции (для карты)
CREATE POLICY "public_can_view_active_stations"
  ON public.stations
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND is_available = true
  );

-- =====================================================
-- 2. RLS POLICIES ДЛЯ ТАБЛИЦЫ locations
-- =====================================================

-- Owners могут видеть только свои локации
CREATE POLICY "owners_can_view_own_locations"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Owners могут создавать свои локации
CREATE POLICY "owners_can_create_own_locations"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Owners могут редактировать свои локации
CREATE POLICY "owners_can_update_own_locations"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Owners могут удалять свои локации
CREATE POLICY "owners_can_delete_own_locations"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Public могут видеть только активные локации (для карты)
CREATE POLICY "public_can_view_active_locations"
  ON public.locations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- =====================================================
-- 3. RLS POLICIES ДЛЯ ТАБЛИЦЫ connectors
-- =====================================================

-- Owners могут видеть connectors своих станций
CREATE POLICY "owners_can_view_own_connectors"
  ON public.connectors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.user_id = auth.uid()::text
    )
  );

-- Owners могут создавать connectors для своих станций
CREATE POLICY "owners_can_create_own_connectors"
  ON public.connectors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.user_id = auth.uid()::text
    )
  );

-- Owners могут редактировать connectors своих станций
CREATE POLICY "owners_can_update_own_connectors"
  ON public.connectors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.user_id = auth.uid()::text
    )
  );

-- Owners могут удалять connectors своих станций
CREATE POLICY "owners_can_delete_own_connectors"
  ON public.connectors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.user_id = auth.uid()::text
    )
  );

-- Public могут видеть connectors активных станций
CREATE POLICY "public_can_view_active_connectors"
  ON public.connectors
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = connectors.station_id
        AND stations.status = 'active'
        AND stations.is_available = true
    )
  );

-- =====================================================
-- 4. RLS POLICIES ДЛЯ ТАБЛИЦЫ charging_sessions
-- =====================================================

-- Owners могут видеть sessions своих станций
CREATE POLICY "owners_can_view_own_sessions"
  ON public.charging_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations
      WHERE stations.id = charging_sessions.station_id
        AND stations.user_id = auth.uid()::text
    )
  );

-- Clients могут видеть только свои sessions
CREATE POLICY "clients_can_view_own_sessions"
  ON public.charging_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- =====================================================
-- 5. RLS POLICIES ДЛЯ ТАБЛИЦЫ users
-- =====================================================

-- Users могут видеть только себя
CREATE POLICY "users_can_view_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Users могут обновлять только себя
CREATE POLICY "users_can_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================

-- Примечания:
-- 1. Все policies используют auth.uid()::text для сравнения с user_id
-- 2. Public policies позволяют anon пользователям видеть активные станции/локации
-- 3. Owner policies проверяют владельца через user_id в таблице
-- 4. Connector и session policies используют EXISTS для проверки через связанные stations
