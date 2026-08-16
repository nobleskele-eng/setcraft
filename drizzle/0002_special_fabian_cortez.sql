CREATE INDEX `password_reset_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_expiry_idx` ON `password_reset_tokens` (`expires_at`);