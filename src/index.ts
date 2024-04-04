import { parseArgs } from "std/cli/parse_args.ts"
import { exists } from "std/fs/mod.ts"
import { copy } from "std/fs/copy.ts"
import { transform } from "lightningcss"

const ARGS = parseArgs(Deno.args, {
    boolean: "no-minify",
    string: "font-family",
})

if (!ARGS["font-family"]) {
    throw new Error('The "--font-family" option was not specified!')
}

if (Deno.build.os !== "windows") {
    throw new Error("This script only works on Windows!")
}

const HOME_DIR = Deno.env.get("USERPROFILE")

if (!HOME_DIR) {
    throw new Error('Could not find "USERPROFILE"!')
}

const WORKBENCH_PATH = HOME_DIR +
    "\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench"

const WORKBENCH_CSS_PATH = WORKBENCH_PATH + "\\workbench.desktop.main.css"
const WORKBENCH_CSS_BACKUP_PATH = WORKBENCH_PATH +
    "\\workbench.desktop.main.backup.css"

if (!(await exists(WORKBENCH_CSS_PATH))) {
    throw new Error('Could not find "workbench.desktop.main.css"!')
}

console.log(`✅ Found: "${WORKBENCH_CSS_PATH}".`)

if (!(await exists(WORKBENCH_CSS_BACKUP_PATH))) {
    await copy(WORKBENCH_CSS_PATH, WORKBENCH_CSS_BACKUP_PATH)
    console.log(`✅ Created a backup: "${WORKBENCH_CSS_BACKUP_PATH}".`)
}

const WORKBENCH_CSS_CONTENT = await Deno.readTextFile(WORKBENCH_CSS_PATH)

console.log("✅ The file content was read.")

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

const MODIFIED_WORKBENCH_CSS_UINT8ARRAY = transform({
    filename: WORKBENCH_CSS_PATH,
    code: ENCODER.encode(WORKBENCH_CSS_CONTENT),
    minify: !ARGS["no-minify"],
    visitor: {
        Rule(RULE) {
            if (RULE.type !== "style") return
            if (RULE.value.selectors[0][0].type !== "class") return
            if (RULE.value.selectors[0][0].name !== "windows") return

            if (
                RULE.value.declarations.declarations[0].property !==
                    "font-family"
            ) return

            RULE.value.declarations.declarations[0].value = ARGS["font-family"]!
                .split(",").map((FONT) => FONT.trim())

            return RULE
        },
    },
}).code

const MODIFIED_WORKBENCH_CSS_CONTENT = DECODER.decode(
    MODIFIED_WORKBENCH_CSS_UINT8ARRAY,
)

await Deno.writeTextFile(WORKBENCH_CSS_PATH, MODIFIED_WORKBENCH_CSS_CONTENT)

console.log("✅ The file content was rewritten.")
