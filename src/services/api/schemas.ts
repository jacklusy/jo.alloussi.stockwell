import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function envelopedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: item,
    meta: paginationMetaSchema.optional(),
  });
}

export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}
