import type { DB } from '@op-engineering/op-sqlite';

import type { ConflictRecord } from '@/sync/types';

export class ConflictStore {
  constructor(private readonly db: DB) {}

  async record(queueItemId: string, localPayload: string, serverState: unknown): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO conflicts (
         queue_item_id, local_payload, server_state, detected_at, resolution
       ) VALUES (?, ?, ?, ?, NULL)`,
      [queueItemId, localPayload, JSON.stringify(serverState), Date.now()],
    );
  }

  async list(): Promise<ConflictRecord[]> {
    const result = await this.db.execute(
      `SELECT queue_item_id, local_payload, server_state, detected_at, resolution
       FROM conflicts ORDER BY detected_at ASC`,
    );
    return (
      result.rows as Array<{
        queue_item_id: string;
        local_payload: string;
        server_state: string;
        detected_at: number;
        resolution: string | null;
      }>
    ).map((row) => ({
      queueItemId: row.queue_item_id,
      localPayload: row.local_payload,
      serverState: row.server_state,
      detectedAt: row.detected_at,
      resolution: row.resolution,
    }));
  }

  async resolve(queueItemId: string, resolution: string): Promise<void> {
    await this.db.execute(`UPDATE conflicts SET resolution = ? WHERE queue_item_id = ?`, [
      resolution,
      queueItemId,
    ]);
  }

  async remove(queueItemId: string): Promise<void> {
    await this.db.execute(`DELETE FROM conflicts WHERE queue_item_id = ?`, [queueItemId]);
  }
}
