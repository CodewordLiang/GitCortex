use std::time::Duration;

use crate::types::ClientConfig;

pub struct ReconnectPolicy {
    config: ClientConfig,
    attempt: u32,
}

impl ReconnectPolicy {
    pub fn new(config: ClientConfig) -> Self {
        Self { config, attempt: 0 }
    }

    /// Calculate next reconnect delay with jitter. Returns None if max retries exceeded.
    pub fn next_delay(&mut self) -> Option<Duration> {
        if self.config.reconnect_count >= 0 && self.attempt >= self.config.reconnect_count as u32 {
            return None;
        }
        let base_ms = self.config.reconnect_interval * 1000;
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

/// Simple jitter based on current system time
fn rand_jitter(max_ms: u64) -> u64 {
    if max_ms == 0 {
        return 0;
    }
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos() as u64;
    nanos % max_ms
}
