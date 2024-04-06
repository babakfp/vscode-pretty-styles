import { Hono } from "hono/mod.ts"
import { serveStatic } from "hono/middleware.ts"
import { join } from "std/path/join.ts"
import * as v from "valibot"
import { operation } from "../utilities/operation.ts"

const app = new Hono()

app.get("/", (c) =>
    c.html(Deno.readTextFileSync(join(Deno.cwd(), "/src/pages/index.html")))
)

const FormSchema = v.optional(
    v.object({
        font: v.optional(v.string()),
        css: v.optional(v.string()),
        backup: v.optional(
            v.special<boolean>((input) => typeof input === "string")
        ),
    })
)

app.post("/", async (c) => {
    const formData = v.safeParse(FormSchema, await c.req.parseBody())

    if (!formData.success) {
        return c.redirect("/")
    }

    try {
        await operation({
            font: formData.output?.font,
            css: formData.output?.css,
            backup: formData.output?.backup,
        })

        return c.redirect("/")
    } catch (error: unknown) {
        if (!(error instanceof Error)) throw error
        return c.text(error.message)
    }
})

app.use("*", serveStatic({ root: "/src/static" }))

Deno.serve(
    {
        onListen: ({ port }) => {
            console.log("✅ The HTTP server is running.")
            console.log(`👉 http://localhost:${port}`)
        },
    },
    app.fetch
)
