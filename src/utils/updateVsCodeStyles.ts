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
    options?: Options,
): Promise<Result> => {
    const tasks: string[] = []

    if (Deno.build.os !== "windows") {
        return {
            type: "ERROR",
            message: "This script only works on Windows!",
        }
    }

    const HOME_DIR = Deno.env.get("USERPROFILE")

    if (!HOME_DIR) {
        return {
            type: "ERROR",
            message: 'Could not find "USERPROFILE"!',
        }
    }

    const WORKBENCH_DIR =
        `${HOME_DIR}\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench`

    const CSS_PATH = `${WORKBENCH_DIR}\\workbench.desktop.main.css`
    const CSS_BACKUP_PATH =
        `${WORKBENCH_DIR}\\workbench.desktop.main.backup.css`

    if (options?.["backup"]) {
        if (!(await exists(CSS_BACKUP_PATH))) {
            return {
                type: "ERROR",
                message: `Could not find: "${CSS_BACKUP_PATH}".`,
            }
        }

        tasks.push(`✅ Found backup: "${CSS_BACKUP_PATH}".`)

        await copy(CSS_BACKUP_PATH, CSS_PATH, {
            overwrite: true,
        })

        tasks.push(`✅ Reverted changes: "${CSS_BACKUP_PATH}".`)

        await Deno.remove(CSS_BACKUP_PATH)

        tasks.push(`✅ Deleted backup: "${CSS_BACKUP_PATH}".`)

        return {
            type: "SUCCESSFUL",
            tasks,
        }
    }

    if (!(await exists(CSS_PATH))) {
        return {
            type: "ERROR",
            message: `Could not find "${CSS_PATH}"!`,
        }
    }

    tasks.push(`✅ Found: "${CSS_PATH}".`)

    if (!(await exists(CSS_BACKUP_PATH))) {
        await copy(CSS_PATH, CSS_BACKUP_PATH)

        tasks.push(`✅ Created backup: "${CSS_BACKUP_PATH}".`)
    }

    const CSS_CONTENT = await Deno.readTextFile(CSS_BACKUP_PATH)

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

    await Deno.writeTextFile(CSS_PATH, newCssContent)

    tasks.push("✅ The file content was rewritten.")

    return {
        type: "SUCCESSFUL",
        tasks,
    }
}
