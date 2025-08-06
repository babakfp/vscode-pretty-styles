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
    const fontStoragePath = `${appStorageDir}\\workbench-font-family.txt`
    const workbenchCSSStoragePath = `${appStorageDir}\\workbench-styles.css`
    const iframeMarkdownCSSStoragePath =
        `${appStorageDir}\\iframe-markdown-styles.css`

    await ensureFile(fontStoragePath)
    await ensureFile(workbenchCSSStoragePath)
    await ensureFile(iframeMarkdownCSSStoragePath)

    const readWorkbenchFontFamily = async () => {
        await ensureFile(fontStoragePath)
        return removeDuplicateWhitespace(
            (await Deno.readTextFile(fontStoragePath)).trim(),
        )
    }

    const writeFontToFileStorage = async (workbenchFontFamily: string) => {
        await ensureFile(fontStoragePath)
        return (await Deno.writeTextFile(
            fontStoragePath,
            removeDuplicateWhitespace(workbenchFontFamily.trim()),
        ))
    }

    const readWorkbenchCSSFromFileStorage = async () => {
        await ensureFile(workbenchCSSStoragePath)
        return await Deno.readTextFile(workbenchCSSStoragePath)
    }

    const readIframeMarkdownCSSFromFileStorage = async () => {
        await ensureFile(iframeMarkdownCSSStoragePath)
        return await Deno.readTextFile(iframeMarkdownCSSStoragePath)
    }

    const getStorageData = async () => ({
        workbenchCSSStorage: await readWorkbenchCSSFromFileStorage(),
        workbenchCSSStoragePath: workbenchCSSStoragePath,
        iframeMarkdownCSSStorage: await readIframeMarkdownCSSFromFileStorage(),
        iframeMarkdownCSSStoragePath: iframeMarkdownCSSStoragePath,
    })

    const routes: Route[] = [
        {
            pattern: new URLPattern({ pathname: "/" }),
            handler: async () => {
                const workbenchFontFamily = await readWorkbenchFontFamily()
                return makeHTMLResponse(
                    render(
                        <Index
                            workbenchFontFamily={workbenchFontFamily}
                            {...await getStorageData()}
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
                    const workbenchFontFamily = await readWorkbenchFontFamily()
                    return makeHTMLResponse(
                        render(
                            <Index
                                statusText="Invalid data submitted!"
                                workbenchFontFamily={workbenchFontFamily}
                                {...await getStorageData()}
                            />,
                            { status: STATUS_CODE.BadRequest },
                        ),
                    )
                }

                const headers = new Headers()
                if (formData.output?.workbenchFontFamily) {
                    writeFontToFileStorage(formData.output.workbenchFontFamily)
                }

                if (
                    !formData.output?.isRevertChanges &&
                    !formData.output?.workbenchFontFamily &&
                    !formData.output?.workbenchCSS
                ) {
                    return makeHTMLResponse(
                        render(
                            <Index
                                statusCode={STATUS_CODE.BadRequest}
                                statusText='"Editor UI Font-Family" or "Custom CSS" cannot be empty!'
                                workbenchFontFamily={formData.output
                                    ?.workbenchFontFamily}
                                {...await getStorageData()}
                            />,
                            { status: STATUS_CODE.BadRequest, headers },
                        ),
                    )
                }

                const result = await updateVsCodeStyles(homeDir, {
                    ...formData.output,
                    workbenchCSS: await readWorkbenchCSSFromFileStorage() +
                        (formData.output.workbenchCSS instanceof File
                            ? await formData.output.workbenchCSS.text()
                            : formData.output.workbenchCSS),
                    iframeMarkdownCSS:
                        await readIframeMarkdownCSSFromFileStorage() +
                        (formData.output.iframeMarkdownCSS instanceof File
                            ? await formData.output.iframeMarkdownCSS.text()
                            : formData.output.iframeMarkdownCSS),
                })

                let statusText: string

                if (result.type === "ERROR") {
                    statusText = result.message
                } else if (formData.output?.isRevertChanges) {
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
                            workbenchFontFamily={formData.output
                                ?.workbenchFontFamily}
                            {...await getStorageData()}
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
