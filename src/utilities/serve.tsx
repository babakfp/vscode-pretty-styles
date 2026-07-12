import { exists } from "@std/fs/exists"
import { getAvailablePort } from "@std/net"
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status"
import { type Route, route } from "@std/http/unstable-route"
import { serveDir } from "@std/http/file-server"
import { ensureFile } from "@std/fs/ensure-file"
import { contentType } from "@std/media-types/content-type"
import * as path from "@std/path"
import { parse } from "@std/jsonc"
import * as v from "@valibot/valibot"
import { render } from "preact-render-to-string"
import { FormSchema } from "./FormSchema.ts"
import { updateVsCodeStyles } from "./updateVsCodeStyles.ts"
import Index from "../pages/Index.tsx"

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
    const appHomeDirStorageDir = path.join(homeDir, APP_FOLDER_NAME)
    const appStorageDir = Deno.build.standalone
        ? await exists(appHomeDirStorageDir)
            ? appHomeDirStorageDir
            : path.join(Deno.cwd(), "config")
        : appHomeDirStorageDir

    const workbenchCSSStoragePath = path.join(
        appStorageDir,
        "workbench-styles.css",
    )
    const iframeMarkdownCSSStoragePath = path.join(
        appStorageDir,
        "iframe-markdown-styles.css",
    )

    await ensureFile(workbenchCSSStoragePath)
    await ensureFile(iframeMarkdownCSSStoragePath)

    const readWorkbenchFontFamily = async () => {
        // C:\Users\Babak\AppData\Roaming
        const appDataDir = Deno.env.get("APPDATA")
        if (!appDataDir) return ""

        const settingsPath = path.join(
            appDataDir,
            "Code",
            "User",
            "settings.json",
        )

        if (!(await exists(settingsPath))) {
            return ""
        }

        const settings = parse(await Deno.readTextFile(settingsPath)) as {
            "editor.fontFamily"?: string
        }

        return settings?.["editor.fontFamily"]
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

                const workbenchFontFamily = await readWorkbenchFontFamily()

                if (
                    !formData.output?.isRevertChanges &&
                    !workbenchFontFamily &&
                    !formData.output?.workbenchCSS
                ) {
                    return makeHTMLResponse(
                        render(
                            <Index
                                statusCode={STATUS_CODE.BadRequest}
                                statusText='"Workbench Font-Family" or "Custom CSS" cannot be empty!'
                                workbenchFontFamily={workbenchFontFamily}
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
                            workbenchFontFamily={workbenchFontFamily}
                            {...await getStorageData()}
                        />,
                        { status, headers },
                    ),
                )
            },
        },
    ]

    if (Deno.build.standalone) {
        const cfd = path.dirname(path.fromFileUrl(import.meta.url))
        const rootDir = path.join(cfd, "../..")

        routes.push({
            pattern: new URLPattern({ pathname: "/public/*" }),
            handler: async (request) => {
                const url = new URL(request.url)
                const filePath = path.join(rootDir, url.pathname)
                const buffer = await Deno.readFile(filePath)
                return new Response(buffer)
            },
        })
    } else {
        routes.push({
            pattern: new URLPattern({ pathname: "/public/*" }),
            handler: (req) => serveDir(req),
        })
    }

    const port = Deno.build.standalone ? getAvailablePort() : 3000

    const defaultHandler = () => {
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

                    console.log("You can close this window after you're done.")
                }
            },
        },
        route(routes, defaultHandler),
    )
}
