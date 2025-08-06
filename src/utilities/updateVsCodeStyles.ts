import { exists } from "@std/fs/exists"
import { copy } from "@std/fs/copy"

type Options = {
    font?: string
    css?: string
    backup?: boolean
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

    const workbenchDir =
        `${homeDir}\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench`

    const cssPath = `${workbenchDir}\\workbench.desktop.main.css`
    const cssBackupPath = `${workbenchDir}\\workbench.desktop.main.backup.css`

    if (options?.["backup"]) {
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

        return {
            type: "SUCCESSFUL",
            tasks,
        }
    }

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

    const CSS_CONTENT = await Deno.readTextFile(cssBackupPath)

    let newCssContent = CSS_CONTENT

    if (options?.["font"]) {
        const customCssVariables = `
            :root {
                --vscode-pretty-styles-font-family: ${options["font"]};
            }
        `

        newCssContent = customCssVariables + newCssContent

        newCssContent = newCssContent.replace(
            "Segoe WPC,Segoe UI,sans-serif",
            `var(--vscode-pretty-styles-font-family)`,
        )

        newCssContent += `
            .composite.viewlet .scm-editor-placeholder,
            .composite.viewlet .view-lines.monaco-mouse-cursor-text,
            .editorPlaceholder {
                font-family: var(--vscode-pretty-styles-font-family) !important;
            }
        `
    }

    if (options?.["css"]) {
        newCssContent += "\n" + options["css"]
    }

    await Deno.writeTextFile(cssPath, newCssContent)

    tasks.push("✅ The file content was rewritten.")

    return {
        type: "SUCCESSFUL",
        tasks,
    }
}
