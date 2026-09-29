/** Contracts intentionally stay transport-only; persistence belongs to the backend. */
export type ApiError = { error: string; code?: string };
export type UserRole = "SUPER_ADMIN" | "COORDINATOR" | "FOOD_ADMIN" | "PARTICIPANT";
