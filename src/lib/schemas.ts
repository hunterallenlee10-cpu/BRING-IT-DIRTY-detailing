import { z } from "zod";
import { isValidUSPhone } from "./phone";

export const vehicleEnum = z.enum(["coupe", "sedan", "suv", "truck"]);
export const serviceEnum = z.enum(["wash", "polish", "ceramic"]);
export const leadStatusEnum = z.enum(["new", "booked", "quote", "follow_up", "done", "lost"]);
export const leadKindEnum = z.enum(["booking", "question", "quote"]);

const name = z.string().trim().min(1, "Add your name").max(80, "That name is too long");
const phone = z.string().trim().refine(isValidUSPhone, "Enter a 10-digit US number");
const email = z
  .string()
  .trim()
  .max(120)
  .optional()
  .refine((v) => !v || z.email().safeParse(v).success, "That email doesn't look right");
const attribution = {
  source: z.string().trim().max(40).optional(),
  utm: z.record(z.string(), z.string().max(120)).optional(),
  /** honeypot: real people never fill this */
  website: z.string().max(200).optional(),
};

/** Shared by the drawer (client) and POST /api/bookings (server). */
export const bookingSchema = z.object({
  vehicle: vehicleEnum,
  service: serviceEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
  name,
  phone,
  email,
  ...attribution,
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const questionSchema = z.object({
  name,
  phone,
  email,
  message: z.string().trim().min(2, "What would you like to ask?").max(1000),
  vehicle: vehicleEnum.optional(),
  service: serviceEnum.optional(),
  kind: z.enum(["question", "quote"]).default("question"),
  ...attribution,
});
export type QuestionInput = z.infer<typeof questionSchema>;

export const leadPatchSchema = z.object({
  status: leadStatusEnum.optional(),
  notes: z.string().max(4000).optional(),
  follow_up: z.string().max(120).optional(),
});

export interface AvailabilitySlot {
  time: string;
  start: string;
  remaining: number;
  available: boolean;
}
export interface AvailabilityDay {
  date: string;
  weekday: number;
  weekdayShort: string;
  weekdayLong: string;
  status: "today" | "tomorrow" | "open" | "few" | "full";
  label: string;
  remaining: number;
  slots: AvailabilitySlot[];
}
export interface AvailabilityResponse {
  tz: string;
  bays: number;
  days: AvailabilityDay[];
}

export interface BookingResult {
  ok: true;
  id: string;
  firstName: string;
  /** e.g. "THURSDAY · 10:00 · CERAMIC" */
  slotLabel: string;
  readyLabel: string | null;
}
