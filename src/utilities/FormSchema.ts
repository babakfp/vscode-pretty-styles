import * as v from "@valibot/valibot"
import { FormFile, isFormFile } from "multipart"

export const validateForm = (value: unknown) => v.safeParse(FormSchema, value)

const FormSchema = v.optional(
    v.object({
        font: v.optional(v.string()),
        css: v.optional(
            v.transform(
                v.special<FormFile>((input) => {
                    if (input === "") return true
                    if (!isFormFile(input)) return false
                    return input.type === "text/css"
                }),
                (input) => {
                    const DECODER = new TextDecoder()
                    return DECODER.decode(input.content)
                }
            )
        ),
        backup: v.optional(
            v.special<boolean>((input) => typeof input === "string")
        ),
    })
)
