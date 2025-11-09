import { z } from "zod";

const nonEmptyString = z.string().trim().min(1, "Debe contener al menos un carácter");

const dateSchema = z
  .coerce
  .date({
    invalid_type_error: "Debe ser una fecha válida",
    required_error: "Este campo es obligatorio"
  })
  .refine((date) => !Number.isNaN(date.getTime()), "La fecha no es válida");

export const createSessionSchema = z
  .object({
    usuarioId: nonEmptyString.optional(),
    intereses: z
      .array(nonEmptyString)
      .min(1, "Debe proporcionar al menos un interés"),
    fechaInicio: dateSchema,
    fechaFin: dateSchema,
    tipoExperiencia: nonEmptyString,
    numeroViajeros: z
      .coerce
      .number({
        invalid_type_error: "Debe ser un número",
        required_error: "Debe indicar el número de viajeros"
      })
      .int("Debe ser un número entero")
      .min(1, "Debe haber al menos un viajero")
      .max(99, "El número de viajeros no puede exceder 99"),
    restricciones: z.array(nonEmptyString).default([])
  })
  .superRefine((data, ctx) => {
    if (data.fechaFin < data.fechaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        path: ["fechaFin"]
      });
    }
  });

export type CreateSessionSchema = z.infer<typeof createSessionSchema>;

