use std::time::Duration;

use crate::types::ClientConfig;

/// Maximum backoff cap to prevent unbounded delays (5 minutes).
const MAX_BACKOFF_SECS: u64 = 300;

pub struct ReconnectPolicy {
    config: ClientConfig,
    attempt: u32,
}

impl ReconnectPolicy {
    pub fn new(config: ClientConfig) -> Self {
        Self { config, attempt: 0 }
    }

    /// Calculate next reconnect delay with exponential backoff and jitter.
    /// Returns None if max retries exceeded.
    pub fn next_delay(&mut self) -> Option<Duration> {
        if self.config.reconnect_count >= 0 && self.attempt >= self.config.reconnect_count as u32 {
            return None;
        }
        // G32-011: Exponential backoff: base * 2^attempt, capped at MAX_BACKOFF_SECS
        let base_secs = self.config.reconnect_interval;
        let backoff_secs = base_secs.saturating_mul(1u64.checked_shl(self.attempt).unwrap_or(u64::MAX));
        let capped_secs = backoff_secs.min(MAX_BACKOFF_SECS);
        let base_ms = capped_secs * 1000;
        // G32-010: Improved jitter using mixed bits instead of raw nanoseconds
        let jitter_ms = if self.config.reconnect_nonce > 0 {
            rand_jitter(self.config.reconnect_nonce * 1000)
        } else {
            0
        };
        self.attempt += 1;
        Some(Duration::from_millis(base_ms + jitter_ms))
    }

    pub fn reset(&mut self) {
        self.attempt = 0;
    }

    pub fn update_config(&mut self, new_config: ClientConfig) {
        self.config = new_config;
        self.attempt = 0;
    }
}

/// Jitter using mixed bits from system time for better distribution.
fn rand_jitter(max_ms: u64) -> u64 {
    if max_ms == 0 {
        return 0;
    }
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    // Mix subsec_nanos with lower bits of seconds for better entropy
    let mixed = (dur.subsec_nanos() as u64) ^ (dur.as_secs().wrapping_mul(6364136223846793005));
    mixed % max_ms
}
