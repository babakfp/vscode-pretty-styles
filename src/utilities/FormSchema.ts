import * as v from "@valibot/valibot"

export const validateForm = (value: unknown) => v.safeParse(FormSchema, value)

const FormSchema = v.optional(
    v.object({
        font: v.optional(v.string()),
        css: v.optional(v.string()),
        backup: v.optional(
            v.special<boolean>((input) => typeof input === "string")
        ),
    })
)
