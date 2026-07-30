import { z } from 'zod';

/** Server → client live stock event (doc 15 §9). */
export const stockBalanceUpdatedSchema = z.object({
  type: z.literal('stock.balance.updated'),
  payload: z.object({
    balanceId: z.string().min(1),
    onHand: z.number().finite(),
    reserved: z.number().finite(),
    version: z.number().int().positive(),
    updatedAt: z.number().finite(),
    warehouseId: z.string().min(1).optional(),
  }),
});

export type StockBalanceUpdatedEvent = z.infer<typeof stockBalanceUpdatedSchema>;

export type StockBalanceDelta = StockBalanceUpdatedEvent['payload'];
