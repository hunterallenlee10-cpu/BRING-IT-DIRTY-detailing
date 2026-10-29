"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { maskPhone } from "@/lib/phone";

export interface DetailsValues {
  name: string;
  phone: string;
  email?: string;
  website?: string;
}

export function DetailsForm({
  register,
  errors,
  idPrefix = "bk",
}: {
  register: UseFormRegister<DetailsValues & Record<string, unknown>>;
  errors: FieldErrors<DetailsValues>;
  idPrefix?: string;
}) {
  const phone = register("phone");
  return (
    <div className="flex flex-col gap-3">
      <Field id={`${idPrefix}-name`} label="Name" error={errors.name?.message}>
        <input
          id={`${idPrefix}-name`}
          className="input"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${idPrefix}-name-err` : undefined}
          {...register("name")}
        />
      </Field>
      <Field id={`${idPrefix}-phone`} label="Phone" error={errors.phone?.message} hint="We text your confirmation here.">
        <input
          id={`${idPrefix}-phone`}
          className="input tabular"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(555) 000-0000"
          aria-invalid={!!errors.phone}
          aria-describedby={`${idPrefix}-phone-hint${errors.phone ? ` ${idPrefix}-phone-err` : ""}`}
          {...phone}
          onChange={(e) => {
            e.target.value = maskPhone(e.target.value);
            phone.onChange(e);
          }}
        />
      </Field>
      <Field id={`${idPrefix}-email`} label="Email" optional error={errors.email?.message}>
        <input
          id={`${idPrefix}-email`}
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      {/* honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input id={`${idPrefix}-website`} tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-text/90">
        <span>{label}</span>
        {optional && <span className="text-[12px] font-normal text-muted">optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] text-[#ff8a80]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
