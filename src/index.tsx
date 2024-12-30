import { getAvailablePort } from "@std/net"
import { STATUS_CODE } from "@std/http/status"
import { Hono } from "@hono/hono"
import { getCookie, setCookie } from "@hono/hono/cookie"
import { validator } from "@hono/hono/validator"
import { serveStatic } from "@hono/hono/deno"
import * as v from "@valibot/valibot"
import { FormSchema } from "./utils/FormSchema.ts"
import { updateVsCodeStyles } from "./utils/updateVsCodeStyles.ts"
import Index from "./views/pages/Index.tsx"

const PRODUCTION_FLAG = "-p"

const app = new Hono()

app.get("/", (c) => {
    const font = decodeURIComponent(
        getCookie(c, "vscode-custom-styles-font") ?? "",
    )

    return c.html("<!DOCTYPE html>" + <Index font={font} />)
})

app.post(
    "/",
    validator("form", async (value, c) => {
        const isFormValid = v.safeParse(FormSchema, value)

        if (!isFormValid.success) {
            return c.html(
                "<!DOCTYPE html>" +
                    <Index statusText="Invalid data submitted!" />,
                STATUS_CODE.BadRequest,
            )
        }

        const formData = isFormValid.output

        if (!formData?.backup && !formData?.font && !formData?.css) {
            return c.html(
                "<!DOCTYPE html>" +
                    (
                        <Index
                            statusCode={STATUS_CODE.BadRequest}
                            statusText='"Editor UI Font-Family" or "Custom CSS" cannot be empty!'
                            font={formData?.font}
                        />
                    ),
            )
        }

        if (formData?.font) {
            setCookie(
                c,
                "vscode-custom-styles-font",
                encodeURIComponent(formData.font),
            )
        }

        const result = await updateVsCodeStyles({
            ...formData,
            css: formData.css instanceof File
                ? await formData.css.text()
                : formData.css,
        })

        let statusText: string

        if (result.type === "ERROR") {
            statusText = result.message
        } else if (formData?.backup) {
            statusText = "Original styles restored successfully!"
        } else {
            statusText = "Custom styles were added successfully!"
        }

        const status = result.type === "ERROR"
            ? STATUS_CODE.BadRequest
            : STATUS_CODE.OK

        return c.html(
            "<!DOCTYPE html>" +
                (
                    <Index
                        statusCode={status}
                        statusText={statusText}
                        font={formData?.font}
                    />
                ),
            status,
        )
    }),
)

app.use("*", serveStatic({ root: "public" }))

const port = Deno.args.includes(PRODUCTION_FLAG) ? getAvailablePort() : 3000

Deno.serve(
    {
        port,
        onListen: () => {
            const url = `http://localhost:${port}`

            console.log("Your HTTP server is running!")
            console.log(url)

            if (Deno.args.includes(PRODUCTION_FLAG)) {
                new Deno.Command("powershell", {
                    args: ["Start-Process", url],
                }).spawn()
            }
        },
    },
    app.fetch,
)
