import { exists } from "@std/fs/exists"
import { copy } from "@std/fs/copy"
import * as path from "@std/path"

type Options = {
    workbenchFontFamily?: string
    workbenchCSS?: string
    iframeMarkdownCSS?: string
    isRevertChanges?: boolean
}

type Result =
    | {
        type: "ERROR"
        message: string
    }
    | {
        type: "SUCCESSFUL"
        tasks: string[]
    }

export const updateVsCodeStyles = async (
    homeDir: string,
    options?: Options,
): Promise<Result> => {
    const tasks: string[] = []

    const vscodeRoot = path.join(
        homeDir,
        "AppData",
        "Local",
        "Programs",
        "Microsoft VS Code",
    )
    const vscodeDir = await resolveVsCodeDir(vscodeRoot)
    if (!vscodeDir) {
        return {
            type: "ERROR",
            message:
                `Could not find VS Code installation under "${vscodeRoot}".`,
        }
    }
    const workbenchDir = path.join(
        vscodeDir,
        "resources",
        "app",
        "out",
        "vs",
        "workbench",
    )

    const cssPath = path.join(workbenchDir, "workbench.desktop.main.css")
    const cssBackupPath = path.join(
        workbenchDir,
        "workbench.desktop.main.backup.css",
    )

    const jsPath = path.join(workbenchDir, "workbench.desktop.main.js")
    const jsBackupPath = path.join(
        workbenchDir,
        "workbench.desktop.main.backup.js",
    )

    if (options?.isRevertChanges) {
        // CSS

        if (!(await exists(cssBackupPath))) {
            return {
                type: "ERROR",
                message: `Could not find: "${cssBackupPath}".`,
            }
        }

        tasks.push(`✅ Found backup: "${cssBackupPath}".`)

        await copy(cssBackupPath, cssPath, {
            overwrite: true,
        })

        tasks.push(`✅ Reverted changes: "${cssBackupPath}".`)

        await Deno.remove(cssBackupPath)

        tasks.push(`✅ Deleted backup: "${cssBackupPath}".`)

        // JS

        if (!(await exists(jsBackupPath))) {
            return {
                type: "ERROR",
                message: `Could not find: "${jsBackupPath}".`,
            }
        }

        tasks.push(`✅ Found backup: "${jsBackupPath}".`)

        await copy(jsBackupPath, jsPath, {
            overwrite: true,
        })

        tasks.push(`✅ Reverted changes: "${jsBackupPath}".`)

        await Deno.remove(jsBackupPath)

        tasks.push(`✅ Deleted backup: "${jsBackupPath}".`)

        return {
            type: "SUCCESSFUL",
            tasks,
        }
    }

    // CSS

    if (!(await exists(cssPath))) {
        return {
            type: "ERROR",
            message: `Could not find "${cssPath}"!`,
        }
    }

    tasks.push(`✅ Found: "${cssPath}".`)

    if (!(await exists(cssBackupPath))) {
        await copy(cssPath, cssBackupPath)

        tasks.push(`✅ Created backup: "${cssBackupPath}".`)
    }

    // JS

    if (!(await exists(jsPath))) {
        return {
            type: "ERROR",
            message: `Could not find "${jsPath}"!`,
        }
    }

    tasks.push(`✅ Found: "${jsPath}".`)

    if (!(await exists(jsBackupPath))) {
        await copy(jsPath, jsBackupPath)

        tasks.push(`✅ Created backup: "${jsBackupPath}".`)
    }

    // ---

    let cssContent = await Deno.readTextFile(cssBackupPath)
    let jsContent = await Deno.readTextFile(jsBackupPath)

    if (options?.workbenchFontFamily) {
        // CSS

        const customCssVariables = `
            :root {
                --vscode-pretty-styles-font-family: ${options.workbenchFontFamily};
            }
        `

        cssContent = customCssVariables + cssContent

        cssContent = cssContent.replace(
            "Segoe WPC,Segoe UI,sans-serif",
            `var(--vscode-pretty-styles-font-family)`,
        )

        cssContent += `
            .composite.viewlet .scm-editor-placeholder,
            .composite.viewlet .view-lines.monaco-mouse-cursor-text,
            .editorPlaceholder {
                font-family: var(--vscode-pretty-styles-font-family) !important;
            }
        `

        // JS

        jsContent = jsContent.replaceAll(
            `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`,
            options.workbenchFontFamily,
        ).replaceAll(
            `"Segoe WPC", "Segoe UI", sans-serif`,
            options.workbenchFontFamily,
        )
    }

    if (options?.workbenchCSS) {
        cssContent += "\n" + options.workbenchCSS
    }

    if (options?.iframeMarkdownCSS) {
        const searchValue = [
            `@media (forced-colors: active) and (prefers-color-scheme: dark){`,
            `	body {`,
            `		forced-color-adjust: none;`,
            `	}`,
            `}`,
        ].join("\n")
        jsContent = jsContent.replace(
            searchValue,
            `${searchValue}\n${options.iframeMarkdownCSS}`,
        )
    }

    await Deno.writeTextFile(cssPath, cssContent)
    await Deno.writeTextFile(jsPath, jsContent)

    tasks.push("✅ The file content was rewritten.")

    return {
        type: "SUCCESSFUL",
        tasks,
    }
}

const resolveVsCodeDir = async (
    vscodeRoot: string,
): Promise<string | null> => {
    const directResourcesPath = path.join(vscodeRoot, "resources", "app")
    if (await exists(directResourcesPath)) {
        return vscodeRoot
    }

    for await (const entry of Deno.readDir(vscodeRoot)) {
        if (!entry.isDirectory) continue
        const candidate = path.join(vscodeRoot, entry.name)
        const candidateResourcesPath = path.join(candidate, "resources", "app")
        if (await exists(candidateResourcesPath)) {
            return candidate
        }
    }

    return null
}
