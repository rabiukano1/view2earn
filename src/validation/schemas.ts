import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  country: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
  address: z.string().min(1, 'Payment address is required'),
});

export const orderSchema = z.object({
  platform: z.enum(['facebook', 'tiktok', 'telegram', 'youtube']),
  followers: z.number().int().positive('Must request at least 1 follower'),
  page_id: z.string().optional(),
  page_url: z.string().url().optional(),
});

export const connectAccountSchema = z.object({
  platform: z.enum(['facebook', 'tiktok', 'telegram', 'youtube']),
  username: z.string().min(1, 'Username is required'),
});
