import * as v from "@valibot/valibot"

const cssSchema = v.union([
    v.string(),
    v.pipe(
        v.custom<File>(
            (input) => input instanceof File,
            "Expected a file!",
        ),
        v.check(
            (input) => input.type === "text/css",
            "Expected a CSS file!",
        ),
    ),
])

export const FormSchema = v.object({
    workbenchFontFamily: v.optional(v.string()),
    workbenchCSS: v.optional(cssSchema),
    iframeMarkdownCSS: v.optional(cssSchema),
    isRevertChanges: v.optional(
        v.pipe(
            v.literal("true"),
            v.transform(() => true),
        ),
    ),
})
