import { z } from 'zod';

export const stockBalanceDtoSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  warehouse_id: z.string(),
  location_id: z.string(),
  product_id: z.string(),
  sku: z.string(),
  product_name: z.string(),
  location_code: z.string(),
  on_hand: z.number(),
  reserved: z.number(),
  version: z.number().int(),
  updated_at: z.string().or(z.number()),
});

export type StockBalanceDto = z.infer<typeof stockBalanceDtoSchema>;
