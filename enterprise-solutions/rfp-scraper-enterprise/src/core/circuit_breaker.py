#!/usr/bin/env python3
"""
Circuit breaker pattern implementation for fault tolerance
"""
import time
import logging
from typing import Any, Callable


class CircuitBreaker:
    """Circuit breaker pattern for fault tolerance"""

    def __init__(self, failure_threshold=5, recovery_timeout=60, expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.logger = logging.getLogger(__name__)

    def __call__(self, func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            if self.state == 'OPEN':
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = 'HALF_OPEN'
                    self.logger.info("Circuit breaker transitioning to HALF_OPEN")
                else:
                    raise Exception("Circuit breaker is OPEN")

            try:
                result = func(*args, **kwargs)
                self.reset()
                return result
            except self.expected_exception as e:
                self.record_failure()
                raise e

        return wrapper

    def record_failure(self):
        """Record a failure and potentially open the circuit"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
            self.logger.warning(f"Circuit breaker OPENED after {self.failure_count} failures")

    def reset(self):
        """Reset the circuit breaker to closed state"""
        if self.failure_count > 0 or self.state != 'CLOSED':
            self.logger.info("Circuit breaker reset to CLOSED state")
        self.failure_count = 0
        self.state = 'CLOSED'

    def get_state(self) -> str:
        """Get current circuit breaker state"""
        return self.state