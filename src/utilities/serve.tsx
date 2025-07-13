import { getAvailablePort } from "@std/net"
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status"
import * as v from "@valibot/valibot"
import { FormSchema } from "./FormSchema.ts"
import { updateVsCodeStyles } from "./updateVsCodeStyles.ts"
import Index from "../pages/Index.tsx"
import embed from "../../embed/public/dir.ts"
import { type Route, route } from "@std/http/unstable-route"
import { serveDir } from "@std/http/file-server"
import { render } from "preact-render-to-string"
import { ensureFile } from "@std/fs/ensure-file"
import { contentType } from "@std/media-types/content-type"

export const makeHTMLResponse = (
    body?: BodyInit | null,
    init?: ResponseInit,
) => {
    return new Response(
        "<!DOCTYPE html>" + body,
        {
            ...init,
            headers: {
                ...init?.headers,
                "Content-Type": contentType("text/html"),
            },
        },
    )
}

export const removeDuplicateWhitespace = (input: string): string => {
    return input.replace(/\s{2,}/g, " ")
}

export const serve = async (
    { homeDir }: { homeDir: string },
) => {
    const APP_FOLDER_NAME = ".vscode-pretty-styles"
    const appStorageDir = `${homeDir}\\${APP_FOLDER_NAME}`
    const fontStoragePath = `${appStorageDir}\\font.txt`
    const cssStoragePath = `${appStorageDir}\\index.css`

    await ensureFile(fontStoragePath)
    await ensureFile(cssStoragePath)

    const readFontFromFileStorage = async () => {
        await ensureFile(fontStoragePath)
        return removeDuplicateWhitespace(
            (await Deno.readTextFile(fontStoragePath)).trim(),
        )
    }

    const writeFontToFileStorage = async (font: string) => {
        await ensureFile(fontStoragePath)
        return (await Deno.writeTextFile(
            fontStoragePath,
            removeDuplicateWhitespace(font.trim()),
        ))
    }

    const readCssFromFileStorage = async () => {
        await ensureFile(cssStoragePath)
        return await Deno.readTextFile(cssStoragePath)
    }

    const routes: Route[] = [
        {
            pattern: new URLPattern({ pathname: "/" }),
            handler: async () => {
                const font = await readFontFromFileStorage()
                return makeHTMLResponse(
                    render(
                        <Index
                            font={font}
                            cssStorage={await readCssFromFileStorage()}
                            cssStoragePath={cssStoragePath}
                        />,
                    ),
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
                    const font = await readFontFromFileStorage()
                    return makeHTMLResponse(
                        render(
                            <Index
                                statusText="Invalid data submitted!"
                                font={font}
                                cssStorage={await readCssFromFileStorage()}
                                cssStoragePath={cssStoragePath}
                            />,
                            { status: STATUS_CODE.BadRequest },
                        ),
                    )
                }

                const headers = new Headers()
                if (formData.output?.font) {
                    writeFontToFileStorage(formData.output.font)
                }

                if (
                    !formData.output?.backup &&
                    !formData.output?.font &&
                    !formData.output?.css
                ) {
                    return makeHTMLResponse(
                        render(
                            <Index
                                statusCode={STATUS_CODE.BadRequest}
                                statusText='"Editor UI Font-Family" or "Custom CSS" cannot be empty!'
                                font={formData.output?.font}
                                cssStorage={await readCssFromFileStorage()}
                                cssStoragePath={cssStoragePath}
                            />,
                            { status: STATUS_CODE.BadRequest, headers },
                        ),
                    )
                }

                const result = await updateVsCodeStyles(homeDir, {
                    ...formData.output,
                    css: await readCssFromFileStorage() +
                        (formData.output.css instanceof File
                            ? await formData.output.css.text()
                            : formData.output.css),
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

                return makeHTMLResponse(
                    render(
                        <Index
                            statusCode={status}
                            statusText={statusText}
                            font={formData.output?.font}
                            cssStorage={await readCssFromFileStorage()}
                            cssStoragePath={cssStoragePath}
                        />,
                        { status, headers },
                    ),
                )
            },
        },
    ]

    if (Deno.build.standalone) {
        routes.push({
            pattern: new URLPattern({ pathname: "/public/*" }),
            handler: async (request) => {
                const url = new URL(request.url)
                const path = embed.list().find((e) =>
                    url.pathname === `/public/${e}`
                )
                if (!path) return defaultHandler(request)
                const file = await embed.get(path)
                const bytes = await file!.bytes()
                return new Response(bytes)
            },
        })
    } else {
        routes.push({
            pattern: new URLPattern({ pathname: "/public/*" }),
            handler: (req: Request) => serveDir(req),
        })
    }

    const port = Deno.build.standalone ? getAvailablePort() : 3000

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

                if (Deno.build.standalone) {
                    new Deno.Command("powershell", {
                        args: ["Start-Process", url],
                    }).spawn()
                }
            },
        },
        route(routes, defaultHandler),
    )
}
