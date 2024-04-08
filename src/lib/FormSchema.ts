import * as v from "@valibot/valibot"
import { FormFile, isFormFile } from "multipart"

export const validateForm = (value: unknown) => v.safeParse(FormSchema, value)

const FormSchema = v.optional(
    v.object({
        font: v.optional(v.string()),
        css: v.optional(
            v.union([
                v.string(),
                v.transform(
                    v.special<FormFile>((input) => {
                        if (!isFormFile(input)) return false
                        return input.type === "text/css"
                    }),
                    (input) => new TextDecoder().decode(input.content)
                ),
            ])
        ),
        backup: v.coerce(v.boolean(), (input) => input === ""),
    })
)
