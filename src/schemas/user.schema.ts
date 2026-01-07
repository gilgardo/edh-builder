import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  image: z.string().url().optional(),
});

// Type exports
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
