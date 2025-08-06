-- Test data for Learn2Play integration tests
-- This file contains sample data for testing various scenarios

-- Insert test users
INSERT INTO users (id, username, email, password_hash, email_verified, created_at, updated_at) VALUES
('test-user-1', 'testuser1', 'test1@example.com', '$2b$10$test.hash.for.testing', true, NOW(), NOW()),
('test-user-2', 'testuser2', 'test2@example.com', '$2b$10$test.hash.for.testing', true, NOW(), NOW()),
('test-user-3', 'testuser3', 'test3@example.com', '$2b$10$test.hash.for.testing', false, NOW(), NOW()),
('admin-user', 'admin', 'admin@example.com', '$2b$10$test.hash.for.testing', true, NOW(), NOW());

-- Insert test games
INSERT INTO games (id, name, description, difficulty, category, created_at, updated_at) VALUES
('test-game-1', 'Test Game 1', 'A simple test game for integration testing', 'easy', 'puzzle', NOW(), NOW()),
('test-game-2', 'Test Game 2', 'A medium difficulty test game', 'medium', 'strategy', NOW(), NOW()),
('test-game-3', 'Test Game 3', 'A hard test game for advanced testing', 'hard', 'action', NOW(), NOW());

-- Insert test questions
INSERT INTO questions (id, game_id, question_text, correct_answer, options, points, created_at, updated_at) VALUES
('test-question-1', 'test-game-1', 'What is 2 + 2?', '4', '["3", "4", "5", "6"]', 10, NOW(), NOW()),
('test-question-2', 'test-game-1', 'What color is the sky?', 'blue', '["red", "green", "blue", "yellow"]', 5, NOW(), NOW()),
('test-question-3', 'test-game-2', 'What is the capital of France?', 'Paris', '["London", "Berlin", "Paris", "Madrid"]', 15, NOW(), NOW()),
('test-question-4', 'test-game-2', 'How many sides does a triangle have?', '3', '["2", "3", "4", "5"]', 8, NOW(), NOW()),
('test-question-5', 'test-game-3', 'What is the largest planet in our solar system?', 'Jupiter', '["Earth", "Mars", "Saturn", "Jupiter"]', 20, NOW(), NOW());

-- Insert test game sessions
INSERT INTO game_sessions (id, game_id, host_id, status, max_players, current_players, created_at, updated_at) VALUES
('test-session-1', 'test-game-1', 'test-user-1', 'waiting', 4, 2, NOW(), NOW()),
('test-session-2', 'test-game-2', 'test-user-2', 'active', 6, 3, NOW(), NOW()),
('test-session-3', 'test-game-3', 'admin-user', 'completed', 4, 4, NOW(), NOW());

-- Insert test session participants
INSERT INTO session_participants (session_id, user_id, joined_at, score, status) VALUES
('test-session-1', 'test-user-1', NOW(), 0, 'ready'),
('test-session-1', 'test-user-2', NOW(), 0, 'ready'),
('test-session-2', 'test-user-2', NOW(), 25, 'playing'),
('test-session-2', 'test-user-3', NOW(), 15, 'playing'),
('test-session-2', 'admin-user', NOW(), 30, 'playing'),
('test-session-3', 'admin-user', NOW(), 100, 'completed'),
('test-session-3', 'test-user-1', NOW(), 85, 'completed'),
('test-session-3', 'test-user-2', NOW(), 90, 'completed'),
('test-session-3', 'test-user-3', NOW(), 75, 'completed');

-- Insert test leaderboard entries
INSERT INTO leaderboard (user_id, game_id, score, time_taken, difficulty, created_at) VALUES
('test-user-1', 'test-game-1', 150, 120, 'easy', NOW() - INTERVAL '1 day'),
('test-user-2', 'test-game-1', 140, 130, 'easy', NOW() - INTERVAL '2 days'),
('test-user-3', 'test-game-1', 160, 110, 'easy', NOW() - INTERVAL '3 days'),
('admin-user', 'test-game-2', 200, 180, 'medium', NOW() - INTERVAL '1 day'),
('test-user-1', 'test-game-2', 180, 200, 'medium', NOW() - INTERVAL '2 days'),
('test-user-2', 'test-game-3', 250, 300, 'hard', NOW() - INTERVAL '1 day'),
('admin-user', 'test-game-3', 300, 280, 'hard', NOW() - INTERVAL '2 days');

-- Insert test achievements
INSERT INTO achievements (id, name, description, points, icon, created_at) VALUES
('first-game', 'First Game', 'Complete your first game', 10, '🎮', NOW()),
('speed-demon', 'Speed Demon', 'Complete a game in under 60 seconds', 25, '⚡', NOW()),
('perfect-score', 'Perfect Score', 'Get a perfect score in any game', 50, '🏆', NOW()),
('social-butterfly', 'Social Butterfly', 'Play with 10 different players', 30, '🦋', NOW()),
('persistent', 'Persistent', 'Play 50 games', 100, '💪', NOW());

-- Insert test user achievements
INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
('test-user-1', 'first-game', NOW() - INTERVAL '5 days'),
('test-user-1', 'speed-demon', NOW() - INTERVAL '3 days'),
('test-user-2', 'first-game', NOW() - INTERVAL '4 days'),
('admin-user', 'first-game', NOW() - INTERVAL '10 days'),
('admin-user', 'perfect-score', NOW() - INTERVAL '2 days'),
('admin-user', 'persistent', NOW() - INTERVAL '1 day');

-- Insert test settings
INSERT INTO user_settings (user_id, theme, language, sound_enabled, notifications_enabled, created_at, updated_at) VALUES
('test-user-1', 'dark', 'en', true, true, NOW(), NOW()),
('test-user-2', 'light', 'de', false, true, NOW(), NOW()),
('test-user-3', 'dark', 'en', true, false, NOW(), NOW()),
('admin-user', 'light', 'en', true, true, NOW(), NOW());

-- Insert test chat messages
INSERT INTO chat_messages (id, session_id, user_id, message, message_type, created_at) VALUES
('msg-1', 'test-session-1', 'test-user-1', 'Hello everyone!', 'text', NOW() - INTERVAL '5 minutes'),
('msg-2', 'test-session-1', 'test-user-2', 'Hi there!', 'text', NOW() - INTERVAL '4 minutes'),
('msg-3', 'test-session-2', 'test-user-2', 'Good game!', 'text', NOW() - INTERVAL '3 minutes'),
('msg-4', 'test-session-2', 'admin-user', 'Thanks!', 'text', NOW() - INTERVAL '2 minutes'),
('msg-5', 'test-session-2', 'test-user-3', 'Well played!', 'text', NOW() - INTERVAL '1 minute');

-- Insert test game statistics
INSERT INTO game_statistics (user_id, game_id, games_played, total_score, average_score, best_score, total_time, created_at, updated_at) VALUES
('test-user-1', 'test-game-1', 5, 750, 150, 180, 600, NOW(), NOW()),
('test-user-2', 'test-game-1', 3, 420, 140, 160, 390, NOW(), NOW()),
('test-user-3', 'test-game-1', 2, 320, 160, 160, 220, NOW(), NOW()),
('admin-user', 'test-game-2', 8, 1600, 200, 250, 1440, NOW(), NOW()),
('test-user-1', 'test-game-2', 4, 720, 180, 200, 800, NOW(), NOW()),
('test-user-2', 'test-game-3', 2, 500, 250, 250, 600, NOW(), NOW()),
('admin-user', 'test-game-3', 3, 900, 300, 300, 840, NOW(), NOW());

-- Insert test notifications
INSERT INTO notifications (id, user_id, type, title, message, read, created_at) VALUES
('notif-1', 'test-user-1', 'achievement', 'Achievement Unlocked!', 'You earned the First Game achievement!', false, NOW() - INTERVAL '5 days'),
('notif-2', 'test-user-1', 'game_invite', 'Game Invitation', 'testuser2 invited you to play Test Game 1', false, NOW() - INTERVAL '1 hour'),
('notif-3', 'test-user-2', 'achievement', 'Achievement Unlocked!', 'You earned the Speed Demon achievement!', true, NOW() - INTERVAL '3 days'),
('notif-4', 'admin-user', 'system', 'System Update', 'New features are available!', false, NOW() - INTERVAL '1 day'),
('notif-5', 'test-user-3', 'game_result', 'Game Result', 'You finished Test Game 2 with a score of 75!', false, NOW() - INTERVAL '30 minutes');

-- Insert test friend relationships
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES
('test-user-1', 'test-user-2', 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('test-user-2', 'test-user-1', 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('test-user-1', 'test-user-3', 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('test-user-3', 'test-user-1', 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('admin-user', 'test-user-1', 'accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('test-user-1', 'admin-user', 'accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- Insert test game categories
INSERT INTO game_categories (id, name, description, icon, created_at) VALUES
('puzzle', 'Puzzle Games', 'Brain teasers and logic puzzles', '🧩', NOW()),
('strategy', 'Strategy Games', 'Strategic thinking and planning', '🎯', NOW()),
('action', 'Action Games', 'Fast-paced action and reflexes', '⚡', NOW()),
('educational', 'Educational', 'Learning and knowledge games', '📚', NOW()),
('social', 'Social Games', 'Multiplayer and social interaction', '👥', NOW());

-- Insert test game tags
INSERT INTO game_tags (game_id, tag) VALUES
('test-game-1', 'beginner'),
('test-game-1', 'quick'),
('test-game-2', 'intermediate'),
('test-game-2', 'strategy'),
('test-game-3', 'advanced'),
('test-game-3', 'challenging');

-- Insert test user preferences
INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at) VALUES
('test-user-1', 'auto_join_games', 'true', NOW(), NOW()),
('test-user-1', 'show_tutorials', 'false', NOW(), NOW()),
('test-user-2', 'auto_join_games', 'false', NOW(), NOW()),
('test-user-2', 'show_tutorials', 'true', NOW(), NOW()),
('test-user-3', 'auto_join_games', 'true', NOW(), NOW()),
('test-user-3', 'show_tutorials', 'true', NOW(), NOW()),
('admin-user', 'auto_join_games', 'false', NOW(), NOW()),
('admin-user', 'show_tutorials', 'false', NOW(), NOW());

-- Insert test game feedback
INSERT INTO game_feedback (id, user_id, game_id, rating, comment, created_at) VALUES
('feedback-1', 'test-user-1', 'test-game-1', 5, 'Great game for beginners!', NOW() - INTERVAL '3 days'),
('feedback-2', 'test-user-2', 'test-game-1', 4, 'Enjoyable puzzle game', NOW() - INTERVAL '2 days'),
('feedback-3', 'admin-user', 'test-game-2', 5, 'Excellent strategy game', NOW() - INTERVAL '1 day'),
('feedback-4', 'test-user-3', 'test-game-3', 3, 'Too difficult for me', NOW() - INTERVAL '1 day');

-- Insert test system logs
INSERT INTO system_logs (id, level, message, user_id, session_id, created_at) VALUES
('log-1', 'info', 'User testuser1 logged in', 'test-user-1', NULL, NOW() - INTERVAL '1 hour'),
('log-2', 'info', 'Game session test-session-1 created', NULL, 'test-session-1', NOW() - INTERVAL '2 hours'),
('log-3', 'warning', 'High memory usage detected', NULL, NULL, NOW() - INTERVAL '30 minutes'),
('log-4', 'error', 'Database connection timeout', NULL, NULL, NOW() - INTERVAL '15 minutes'),
('log-5', 'info', 'User testuser2 joined game session', 'test-user-2', 'test-session-1', NOW() - INTERVAL '1 hour');

-- Insert test API rate limiting data
INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start, created_at) VALUES
('192.168.1.100', '/api/auth/login', 3, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '10 minutes'),
('192.168.1.101', '/api/games', 15, NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '5 minutes'),
('192.168.1.102', '/api/users/profile', 1, NOW() - INTERVAL '1 minute', NOW() - INTERVAL '2 minutes');

-- Insert test email templates
INSERT INTO email_templates (id, name, subject, body, variables, created_at, updated_at) VALUES
('welcome', 'Welcome Email', 'Welcome to Learn2Play!', 'Hello {{username}}, welcome to Learn2Play!', '["username"]', NOW(), NOW()),
('password-reset', 'Password Reset', 'Reset Your Password', 'Click here to reset your password: {{resetLink}}', '["resetLink"]', NOW(), NOW()),
('game-invite', 'Game Invitation', 'You''ve been invited to play!', '{{inviterName}} invited you to play {{gameName}}', '["inviterName", "gameName"]', NOW(), NOW()),
('achievement', 'Achievement Unlocked', 'Congratulations!', 'You earned the {{achievementName}} achievement!', '["achievementName"]', NOW(), NOW());

-- Insert test email queue
INSERT INTO email_queue (id, template_id, user_id, variables, status, created_at, sent_at) VALUES
('email-1', 'welcome', 'test-user-1', '{"username": "testuser1"}', 'sent', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('email-2', 'password-reset', 'test-user-2', '{"resetLink": "http://localhost:3000/reset?token=abc123"}', 'pending', NOW() - INTERVAL '1 hour', NULL),
('email-3', 'game-invite', 'test-user-3', '{"inviterName": "testuser1", "gameName": "Test Game 1"}', 'sent', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes'),
('email-4', 'achievement', 'admin-user', '{"achievementName": "Perfect Score"}', 'sent', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Insert test audit logs
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, created_at) VALUES
('audit-1', 'test-user-1', 'login', 'user', 'test-user-1', '{"method": "email", "success": true}', '192.168.1.100', NOW() - INTERVAL '1 hour'),
('audit-2', 'test-user-1', 'create', 'game_session', 'test-session-1', '{"game_id": "test-game-1", "max_players": 4}', '192.168.1.100', NOW() - INTERVAL '2 hours'),
('audit-3', 'test-user-2', 'join', 'game_session', 'test-session-1', '{"session_id": "test-session-1"}', '192.168.1.101', NOW() - INTERVAL '1 hour'),
('audit-4', 'admin-user', 'update', 'user', 'test-user-1', '{"field": "email_verified", "old_value": false, "new_value": true}', '192.168.1.102', NOW() - INTERVAL '30 minutes'),
('audit-5', 'test-user-3', 'delete', 'game_session', 'test-session-3', '{"session_id": "test-session-3", "reason": "completed"}', '192.168.1.103', NOW() - INTERVAL '15 minutes'); 