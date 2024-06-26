import * as v from "@valibot/valibot"

export const FormSchema = v.optional(
    v.object({
        font: v.optional(v.string()),
        css: v.optional(
            v.union([
                v.string(),
                v.pipe(
                    v.custom<File>(
                        (input) => input instanceof File,
                        "Expected a file!"
                    ),
                    v.check(
                        (input) => input.type === "text/css",
                        "Expected a CSS file!"
                    )
                ),
            ])
        ),
        backup: v.optional(
            v.pipe(
                v.literal("true"),
                v.transform(() => true)
            )
        ),
    })
)
