/**
 * Contract / schema definitions for the Users API boundary.
 *
 * These Zod schemas act as the "golden" shape that both the API layer
 * and any consumer (components, slices) agree on.  The companion
 * *.contract.test.js file asserts that real (or representative) API
 * responses conform to these schemas.
 */
import { z } from "zod";

// ── Single User ──────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
});

// ── Collections ──────────────────────────────────────────────────────
export const UserListSchema = z.array(UserSchema).min(0);

// ── Create / Update request body ─────────────────────────────────────
export const CreateUserRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const UpdateUserRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
});

// ── Delete response (typically the deleted user or an id) ────────────
export const DeleteUserResponseSchema = z.union([
  UserSchema,
  z.object({ id: z.number().int().positive() }),
]);