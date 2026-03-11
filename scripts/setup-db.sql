-- ============================================================
-- setup-db.sql
-- Run ONCE against the database BEFORE the seed script.
-- Creates objects that Drizzle push cannot generate:
--   1. view_counter_achievements  (used by achievements controller)
--   2. get_number_of_quizzes()    (used by getActiveUnits in unit controller)
-- ============================================================

-- ── 1. view_counter_achievements ─────────────────────────────────────────────
-- Counts quiz stats per user. Used by checkAndAssignAchievements and
-- getAchievementsProgress to evaluate achievement thresholds.

CREATE OR REPLACE VIEW view_counter_achievements AS
SELECT
    q.user_id::text               AS user_id,
    COUNT(*)::int                 AS quizzes_done,
    COUNT(CASE WHEN q.score >= 70  THEN 1 END)::int AS quizzes_passed,
    COUNT(CASE WHEN q.score = 100  THEN 1 END)::int AS quizzes_perfect
FROM quizzes q
WHERE q.score IS NOT NULL
GROUP BY q.user_id;

-- ── 2. get_number_of_quizzes(unit_id) ────────────────────────────────────────
-- Returns how many distinct quiz "slots" exist for a unit.
-- Calculated as: floor(total active questions / questions_per_quiz).
-- Used in getActiveUnits extras → numberOfQuizzes (controls LessonButton path).

CREATE OR REPLACE FUNCTION get_number_of_quizzes(p_unit_id integer)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
    SELECT GREATEST(
        FLOOR(
            COUNT(q.id)::float
            /
            NULLIF(u.questions_per_quiz, 0)
        )::integer,
        1   -- always show at least 1 slot so the unit is usable
    )
    FROM questions q
    JOIN units u ON u.id = q.unit_id
    WHERE q.unit_id = p_unit_id
      AND q.active = true
    GROUP BY u.questions_per_quiz;
$$;

-- Grant execute if using a restricted DB role
-- GRANT EXECUTE ON FUNCTION get_number_of_quizzes(integer) TO your_app_role;
