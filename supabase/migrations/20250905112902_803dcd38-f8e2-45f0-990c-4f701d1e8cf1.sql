-- Add comprehensive queue display and system settings with proper JSON formatting
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
-- Queue Display Visual Settings
('display_background_start', '"#3B82F6"', 'display', 'Queue display background gradient start color'),
('display_background_end', '"#1D4ED8"', 'display', 'Queue display background gradient end color'),
('display_animation_speed', '3', 'display', 'Background animation speed (1-10)'),
('display_particle_animation', 'true', 'display', 'Enable particle animation on display screen'),
('display_particle_speed', '2', 'display', 'Particle animation speed (1-5)'),
('display_header_text', '"Welcome to Our Healthcare Facility"', 'display', 'Sliding welcome header text'),
('display_header_font_size', '32', 'display', 'Header font size in pixels'),
('display_header_color', '"#FFFFFF"', 'display', 'Header text color'),
('display_token_card_size', '"lg"', 'display', 'Token card size (sm, md, lg, xl)'),
('display_token_glow', 'true', 'display', 'Enable token card glow effect'),
('display_ticker_font_size', '18', 'display', 'Ticker bar font size in pixels'),
('display_ticker_color', '"#FFFFFF"', 'display', 'Ticker bar text color'),
('display_ticker_speed', '50', 'display', 'Ticker scrolling speed in pixels per second'),
('display_ticker_position', '"bottom"', 'display', 'Ticker bar position (top, bottom)'),
('display_logo_enabled', 'true', 'display', 'Show hospital logo on display screen'),
('display_logo_size', '"md"', 'display', 'Logo size on display screen (sm, md, lg)'),
('display_logo_position', '"top-left"', 'display', 'Logo position on display screen'),
('display_token_font_size', '64', 'display', 'Token number font size in pixels'),
('display_department_font_size', '20', 'display', 'Department name font size in pixels'),
('display_datetime_font_size', '16', 'display', 'Date/time font size in pixels'),

-- Enhanced Voice Settings
('voice_gender', '"female"', 'announcement', 'Voice gender preference (male, female)'),
('voice_style', '"professional"', 'announcement', 'Voice style (professional, studio, conversational, energetic, calm)'),
('voice_accent', '"en-US"', 'announcement', 'Voice accent/language code'),
('global_announcement_template', '"Token {number}, please proceed to {department} at {hospitalName}."', 'announcement', 'Global default announcement template'),
('announcement_repeat_count', '2', 'announcement', 'How many times to repeat announcements'),
('announcement_delay', '500', 'announcement', 'Delay between chime and announcement in milliseconds'),

-- Role-based Access Settings
('staff_access_own_department', 'false', 'access', 'Restrict staff to their own department tokens only'),
('allow_cross_department_transfer', 'true', 'access', 'Allow transferring tokens between departments'),
('admin_only_settings', 'true', 'access', 'Restrict settings access to admin only'),

-- Print Settings Enhancement
('print_thermal_mode', 'true', 'print', 'Optimize for thermal printers (80mm/58mm)'),
('print_logo_size', '"md"', 'print', 'Logo size on printed tickets'),
('print_font_bold', 'true', 'print', 'Use bold fonts for better visibility'),
('print_include_qr', 'false', 'print', 'Include QR code on tickets'),

-- System Reliability Settings
('auto_backup_enabled', 'true', 'system', 'Enable automatic data backup'),
('error_notification_email', '""', 'system', 'Email for system error notifications'),
('maintenance_mode', 'false', 'system', 'Enable maintenance mode'),
('api_rate_limit', '100', 'system', 'API requests per minute limit'),

-- Display Screen Settings
('fullscreen_mode_default', 'false', 'display', 'Enable fullscreen mode by default'),
('auto_refresh_interval', '30', 'display', 'Auto refresh interval in seconds'),
('display_timeout_seconds', '300', 'display', 'Screen timeout in seconds'),
('emergency_alert_color', '"#DC2626"', 'display', 'Emergency alert color'),
('waiting_queue_limit', '50', 'display', 'Maximum waiting queue entries to display')

ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;