type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

export class RateLimiter {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private lastRequest = 0;
  private minIntervalMs: number;

  constructor(requestsPerMinute: number) {
    this.minIntervalMs = Math.ceil(60000 / requestsPerMinute);
  }

  async schedule<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequest;
      if (elapsed < this.minIntervalMs) {
        await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
      }

      const item = this.queue.shift()!;
      this.lastRequest = Date.now();

      try {
        const result = await item.execute();
        item.resolve(result);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }
}

// Shared instances
export const edsmLimiter = new RateLimiter(5);   // 5 req/min (conservative)
export const spanshLimiter = new RateLimiter(30); // 30 req/min
