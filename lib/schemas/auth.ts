import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email').max(254, 'Email too long');

const strongPassword = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'Too long')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const SignInSchema = z.object({
  email,
  password: z.string().min(1, 'Required'),
});

export const SignUpSchema = z.object({
  email,
  password: strongPassword,
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const ForgotSchema = z.object({ email });

export const ResetSchema = z.object({
  password: strongPassword,
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
