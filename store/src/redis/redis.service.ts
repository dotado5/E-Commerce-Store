import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private available = false;

  constructor() {
    this.client = new Redis(
      process.env.REDIS_URL ?? 'redis://localhost:6379',
      {
        // Fail fast on individual commands instead of queueing them forever
        // when Redis is down — cache misses are handled gracefully.
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 1000, 30000),
      },
    );

    this.client.on('ready', () => {
      this.available = true;
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (err: Error) => {
      // Only log on the transition to unavailable to avoid spamming
      // the console on every reconnect attempt.
      if (this.available) {
        this.logger.warn(`Redis unavailable, caching disabled: ${err.message}`);
      }
      this.available = false;
    });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => this.client.disconnect());
  }

  isAvailable(): boolean {
    return this.available;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.available) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Cache write failures are non-fatal.
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.available || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // Cache invalidation failures are non-fatal (entries expire via TTL).
    }
  }
}
