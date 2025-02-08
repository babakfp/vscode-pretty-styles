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
            const formData = v.safeParse(
                FormSchema,
                Object.fromEntries(await request.formData()),
            )

            if (!formData.success) {
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

            const headers = new Headers()
            if (formData.output?.font) {
                setCookie(headers, {
                    name: "vscode-custom-styles-font",
                    value: encodeURIComponent(formData.output.font),
                })
            }

            if (
                !formData.output?.backup &&
                !formData.output?.font &&
                !formData.output?.css
            ) {
                return createHTMLResponse(
                    render(
                        <Index
                            statusCode={STATUS_CODE.BadRequest}
                            statusText='"Editor UI Font-Family" or "Custom CSS" cannot be empty!'
                            font={formData.output?.font}
                        />,
                        { status: STATUS_CODE.BadRequest, headers },
                    ),
                )
            }

            const result = await updateVsCodeStyles({
                ...formData.output,
                css: formData.output.css instanceof File
                    ? await formData.output.css.text()
                    : formData.output.css,
            })

            let statusText: string

            if (result.type === "ERROR") {
                statusText = result.message
            } else if (formData.output?.backup) {
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
                        font={formData.output?.font}
                    />,
                    { status, headers },
                ),
            )
        },
    },
]

if (Deno.args.includes("--compile")) {
    routes.push({
        pattern: new URLPattern({ pathname: "/public/*" }),
        handler: async (request) => {
            const url = new URL(request.url)
            for (const path of embed.list()) {
                if (url.pathname === `/public/${path}`) {
                    const file = await embed.get(path)
                    const bytes = await file!.bytes()
                    return new Response(bytes)
                }
            }
            return defaultHandler(request)
        },
    })
} else {
    routes.push({
        pattern: new URLPattern({ pathname: "/public/*" }),
        handler: (req: Request) => serveDir(req),
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
