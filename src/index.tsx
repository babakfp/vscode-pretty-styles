import { getAvailablePort } from "@std/net"
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status"
import { getCookies, setCookie } from "@std/http/cookie"
import * as v from "@valibot/valibot"
import { FormSchema } from "./utils/FormSchema.ts"
import { updateVsCodeStyles } from "./utils/updateVsCodeStyles.ts"
import Index from "./views/pages/Index.tsx"
import embed from "../embed/public/dir.ts"
import { type Route, route } from "@std/http/unstable-route"
import { serveDir } from "@std/http/file-server"
import { render } from "preact-render-to-string"
import { contentType } from "@std/media-types"

const getCookie = (
    headers: Headers,
    cookieName: string,
) => {
    return getCookies(headers)[cookieName] ?? ""
}

const createHTMLResponse = (body?: BodyInit | null, init?: ResponseInit) => {
    return new Response(
        body,
        {
            ...init,
            headers: {
                ...init?.headers,
                "Content-Type": contentType("text/html"),
            },
        },
    )
}

const routes: Route[] = [
    {
        pattern: new URLPattern({ pathname: "/" }),
        handler: (request) => {
            const font = decodeURIComponent(getCookie(
                request.headers,
                "vscode-custom-styles-font",
            ))

            return createHTMLResponse(
                render(<Index font={font} />),
            )
        },
    },
    {
        method: ["POST"],
        pattern: new URLPattern({ pathname: "/" }),
        handler: async (request) => {
            const formData = await request.formData()

            const isFormValid = v.safeParse(
                FormSchema,
                Object.fromEntries(formData),
            )

            if (!isFormValid.success) {
                const font = decodeURIComponent(getCookie(
                    request.headers,
                    "vscode-custom-styles-font",
                ))

                return createHTMLResponse(
                    render(
                        <Index
                            statusText="Invalid data submitted!"
                            font={font}
                        />,
                        { status: STATUS_CODE.BadRequest },
                    ),
                )
            }

            const validatedFormData = isFormValid.output

            const headers = new Headers()
            if (validatedFormData?.font) {
                setCookie(headers, {
                    name: "vscode-custom-styles-font",
                    value: encodeURIComponent(validatedFormData.font),
                })
            }

            if (
                !validatedFormData?.backup && !validatedFormData?.font &&
                !validatedFormData?.css
            ) {
                return createHTMLResponse(
                    render(
                        <Index
                            statusCode={STATUS_CODE.BadRequest}
                            statusText='"Editor UI Font-Family" or "Custom CSS" cannot be empty!'
                            font={validatedFormData?.font}
                        />,
                        { status: STATUS_CODE.BadRequest, headers },
                    ),
                )
            }

            const result = await updateVsCodeStyles({
                ...validatedFormData,
                css: validatedFormData.css instanceof File
                    ? await validatedFormData.css.text()
                    : validatedFormData.css,
            })

            let statusText: string

            if (result.type === "ERROR") {
                statusText = result.message
            } else if (validatedFormData?.backup) {
                statusText = "Original styles restored successfully!"
            } else {
                statusText = "Custom styles were added successfully!"
            }

            const status = result.type === "ERROR"
                ? STATUS_CODE.BadRequest
                : STATUS_CODE.OK

            return createHTMLResponse(
                render(
                    <Index
                        statusCode={status}
                        statusText={statusText}
                        font={validatedFormData?.font}
                    />,
                    { status, headers },
                ),
            )
        },
    },
]

if (Deno.args.includes("--compile")) {
    routes.push({
        pattern: new URLPattern({ pathname: "*" }),
        handler: async (request) => {
            const url = new URL(request.url)
            for (const path of embed.list()) {
                if (url.pathname === `/${path}`) {
                    const file = await embed.get(path)
                    const bytes = await file!.bytes()
                    return new Response(bytes)
                }
            }

            return new Response(undefined, {
                status: STATUS_CODE.NotFound,
            })
        },
    })
} else {
    routes.push({
        // Prefix it with puglic
        pattern: new URLPattern({ pathname: "*" }),
        handler: (req: Request) =>
            serveDir(req, {
                fsRoot: "/public",
            }),
    })
}

const port = Deno.args.includes("--compile") ? getAvailablePort() : 3000

const defaultHandler = (_req: Request) => {
    return new Response(STATUS_TEXT[STATUS_CODE.NotFound], {
        status: STATUS_CODE.NotFound,
    })
}

Deno.serve(
    {
        port,
        onListen: () => {
            const url = `http://localhost:${port}`

            console.log("Your HTTP server is running!")
            console.log(url)

            if (Deno.args.includes("--compile")) {
                new Deno.Command("powershell", {
                    args: ["Start-Process", url],
                }).spawn()
            }
        },
    },
    route(routes, defaultHandler),
)
