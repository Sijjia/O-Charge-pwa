-- =====================================================
-- Owner RPC Functions
-- =====================================================
-- Дата создания: 2025-11-17
-- Описание: SQL functions для Owner Dashboard
--           Оптимизированные запросы для статистики
-- =====================================================

-- =====================================================
-- Function: get_owner_stats
-- Описание: Получить агрегированную статистику для owner
-- =====================================================

CREATE OR REPLACE FUNCTION get_owner_stats(p_owner_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_stations', (
      SELECT COUNT(*)
      FROM stations
      WHERE user_id = p_owner_id
        AND status = 'active'
    ),
    'total_locations', (
      SELECT COUNT(*)
      FROM locations
      WHERE (user_id = p_owner_id OR admin_id = p_owner_id)
        AND status = 'active'
    ),
    'active_sessions', (
      SELECT COUNT(*)
      FROM charging_sessions cs
      INNER JOIN stations s ON cs.station_id = s.id
      WHERE s.user_id = p_owner_id
        AND cs.status = 'in_progress'
    ),
    'total_connectors', (
      SELECT COALESCE(SUM(connectors_count), 0)
      FROM stations
      WHERE user_id = p_owner_id
        AND status = 'active'
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(cs.amount), 0)
      FROM charging_sessions cs
      INNER JOIN stations s ON cs.station_id = s.id
      WHERE s.user_id = p_owner_id
        AND cs.status IN ('completed', 'stopped')
        AND cs.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'monthly_energy', (
      SELECT COALESCE(SUM(cs.energy), 0)
      FROM charging_sessions cs
      INNER JOIN stations s ON cs.station_id = s.id
      WHERE s.user_id = p_owner_id
        AND cs.status IN ('completed', 'stopped')
        AND cs.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'monthly_sessions', (
      SELECT COUNT(*)
      FROM charging_sessions cs
      INNER JOIN stations s ON cs.station_id = s.id
      WHERE s.user_id = p_owner_id
        AND cs.created_at >= date_trunc('month', CURRENT_DATE)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: get_station_revenue
-- Описание: Получить доход станции за период
-- =====================================================

CREATE OR REPLACE FUNCTION get_station_revenue(
  p_station_id TEXT,
  p_period TEXT DEFAULT 'month'
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_result JSON;
BEGIN
  -- Определяем начальную дату периода
  CASE p_period
    WHEN 'today' THEN
      v_start_date := date_trunc('day', CURRENT_TIMESTAMP);
    WHEN 'week' THEN
      v_start_date := date_trunc('week', CURRENT_TIMESTAMP);
    WHEN 'month' THEN
      v_start_date := date_trunc('month', CURRENT_TIMESTAMP);
    WHEN 'year' THEN
      v_start_date := date_trunc('year', CURRENT_TIMESTAMP);
    ELSE
      v_start_date := '1970-01-01'::TIMESTAMP; -- All time
  END CASE;

  SELECT json_build_object(
    'period', p_period,
    'start_date', v_start_date,
    'total_revenue', COALESCE(SUM(amount), 0),
    'total_energy', COALESCE(SUM(energy), 0),
    'total_sessions', COUNT(*),
    'completed_sessions', COUNT(*) FILTER (WHERE status = 'completed'),
    'avg_session_revenue', COALESCE(AVG(amount), 0),
    'avg_session_energy', COALESCE(AVG(energy), 0),
    'max_session_revenue', COALESCE(MAX(amount), 0),
    'min_session_revenue', COALESCE(MIN(amount), 0)
  )
  INTO v_result
  FROM charging_sessions
  WHERE station_id = p_station_id
    AND status IN ('completed', 'stopped')
    AND created_at >= v_start_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: get_revenue_by_stations
-- Описание: Получить разбивку дохода по всем станциям owner
-- =====================================================

CREATE OR REPLACE FUNCTION get_revenue_by_stations(
  p_owner_id TEXT,
  p_period TEXT DEFAULT 'month'
)
RETURNS TABLE (
  station_id TEXT,
  station_name TEXT,
  location_name TEXT,
  total_revenue NUMERIC,
  total_energy NUMERIC,
  sessions_count BIGINT,
  avg_session_revenue NUMERIC
) AS $$
DECLARE
  v_start_date TIMESTAMP;
BEGIN
  -- Определяем начальную дату периода
  CASE p_period
    WHEN 'today' THEN
      v_start_date := date_trunc('day', CURRENT_TIMESTAMP);
    WHEN 'week' THEN
      v_start_date := date_trunc('week', CURRENT_TIMESTAMP);
    WHEN 'month' THEN
      v_start_date := date_trunc('month', CURRENT_TIMESTAMP);
    WHEN 'year' THEN
      v_start_date := date_trunc('year', CURRENT_TIMESTAMP);
    ELSE
      v_start_date := '1970-01-01'::TIMESTAMP; -- All time
  END CASE;

  RETURN QUERY
  SELECT
    s.id AS station_id,
    COALESCE(s.model, s.serial_number) AS station_name,
    l.name AS location_name,
    COALESCE(SUM(cs.amount), 0) AS total_revenue,
    COALESCE(SUM(cs.energy), 0) AS total_energy,
    COUNT(cs.id) AS sessions_count,
    COALESCE(AVG(cs.amount), 0) AS avg_session_revenue
  FROM stations s
  LEFT JOIN locations l ON s.location_id = l.id
  LEFT JOIN charging_sessions cs ON cs.station_id = s.id
    AND cs.status IN ('completed', 'stopped')
    AND cs.created_at >= v_start_date
  WHERE s.user_id = p_owner_id
  GROUP BY s.id, s.model, s.serial_number, l.name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: get_connector_status
-- Описание: Получить статус всех разъёмов станции
-- =====================================================

CREATE OR REPLACE FUNCTION get_connector_status(p_station_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- NOTE: Connectors хранятся как jsonb в таблице stations
  -- Эта функция предполагает, что connectors хранятся отдельно
  -- Если у вас другая структура БД, адаптируйте запрос

  SELECT json_agg(
    json_build_object(
      'connector_number', connector_number,
      'connector_type', connector_type,
      'power_kw', power_kw,
      'status', COALESCE(cs.status, 'available'),
      'current_session_id', cs.id,
      'session_start', cs.created_at,
      'energy_delivered', cs.energy
    )
    ORDER BY connector_number
  )
  INTO v_result
  FROM (
    -- Генерируем список разъёмов на основе connectors_count
    SELECT generate_series(1, connectors_count) AS connector_number,
           'CCS2' AS connector_type, -- Default, можно расширить
           power_capacity AS power_kw
    FROM stations
    WHERE id = p_station_id
  ) connectors
  LEFT JOIN charging_sessions cs ON cs.station_id = p_station_id
    AND cs.connector_id::INTEGER = connectors.connector_number
    AND cs.status = 'in_progress';

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant permissions
-- =====================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION get_owner_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_station_revenue(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_by_stations(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connector_status(TEXT) TO authenticated;

-- =====================================================
-- Usage Examples
-- =====================================================

/*
-- Get owner stats
SELECT get_owner_stats('owner-uuid-here');

-- Get station revenue for current month
SELECT get_station_revenue('station-uuid-here', 'month');

-- Get revenue breakdown for all owner's stations
SELECT * FROM get_revenue_by_stations('owner-uuid-here', 'month');

-- Get connector status
SELECT get_connector_status('station-uuid-here');
*/

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================
