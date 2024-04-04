import { parseArgs } from "std/cli/parse_args.ts"
import { exists } from "std/fs/mod.ts"
import { copy } from "std/fs/copy.ts"
import { transform } from "lightningcss"

const ARGS = parseArgs(Deno.args, {
    boolean: ["restore-backup"],
    string: ["font-family", "css"],
})

if (Deno.build.os !== "windows") {
    throw new Error("This script only works on Windows!")
}

const HOME_DIR = Deno.env.get("USERPROFILE")

if (!HOME_DIR) {
    throw new Error('Could not find "USERPROFILE"!')
}

const WORKBENCH_DIR = `${HOME_DIR}\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench`

const CSS_PATH = `${WORKBENCH_DIR}\\workbench.desktop.main.css`
const CSS_BACKUP_PATH = `${WORKBENCH_DIR}\\workbench.desktop.main.backup.css`

if (ARGS["restore-backup"]) {
    if (await exists(CSS_BACKUP_PATH)) {
        console.log(`✅ Found backup: "${CSS_BACKUP_PATH}".`)

        await copy(CSS_BACKUP_PATH, CSS_PATH, {
            overwrite: true,
        })

        console.log(`✅ Restored backup: "${CSS_BACKUP_PATH}".`)

        await Deno.remove(CSS_BACKUP_PATH)

        console.log(`✅ Deleted backup: "${CSS_BACKUP_PATH}".`)
    } else {
        console.log(`Could not find: "${CSS_BACKUP_PATH}".`)
    }

    Deno.exit()
}

if (!ARGS["font-family"]) {
    throw new Error('The "--font-family" option was not specified!')
}

if (!(await exists(CSS_PATH))) {
    throw new Error(`Could not find "${CSS_PATH}"!`)
}

console.log(`✅ Found: "${CSS_PATH}".`)

if (!(await exists(CSS_BACKUP_PATH))) {
    await copy(CSS_PATH, CSS_BACKUP_PATH)

    console.log(`✅ Created backup: "${CSS_BACKUP_PATH}".`)
}

const CSS_CONTENT = await Deno.readTextFile(CSS_BACKUP_PATH)

console.log("✅ The file content was read.")

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

let modifiedCssContent = DECODER.decode(
    transform({
        filename: CSS_BACKUP_PATH,
        code: ENCODER.encode(CSS_CONTENT),
        visitor: {
            Rule(RULE) {
                if (RULE.type !== "style") return
                if (RULE.value.selectors[0].length > 1) return
                if (RULE.value.selectors[0][0].type !== "class") return
                if (RULE.value.selectors[0][0].name !== "windows") return

                if (
                    RULE.value.declarations.declarations[0].property !==
                    "font-family"
                )
                    return

                RULE.value.declarations.declarations[0].value = ARGS[
                    "font-family"
                ]!.split(",").map((FONT) => FONT.trim())

                return RULE
            },
        },
    }).code
)

if (ARGS.css) {
    if (await exists(ARGS.css)) {
        modifiedCssContent += "\n" + (await Deno.readTextFile(ARGS.css))
    } else {
        console.log(`Could not find: "${ARGS.css}".`)
    }
}

modifiedCssContent +=
    "\n" +
    `
    .composite.viewlet .scm-editor-placeholder,
    .composite.viewlet .view-lines.monaco-mouse-cursor-text {
        font-family: ${ARGS["font-family"]} !important;
    }
`

await Deno.writeTextFile(CSS_PATH, modifiedCssContent)

console.log("✅ The file content was rewritten.")
