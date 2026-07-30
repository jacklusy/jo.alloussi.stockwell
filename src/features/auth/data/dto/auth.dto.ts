import { z } from 'zod';

export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    display_name: z.string(),
    role: z.string(),
  }),
  tenant_id: z.string().min(1),
});

export type LoginResponseDto = z.infer<typeof loginResponseSchema>;
