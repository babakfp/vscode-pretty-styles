import { parseArgs } from "std/cli/parse_args.ts"
import { exists } from "std/fs/mod.ts"
import { transform } from "lightningcss"

const FLAGS = parseArgs(Deno.args, {
    boolean: "no-minify",
    string: "font-family",
})

const CUSTOM_FONT_FAMILY = "MonoLisa, JetBrains Mono"

if (Deno.build.os !== "windows") {
    throw new Error("This script only works on Windows!")
}

const HOME_DIR = Deno.env.get("USERPROFILE")

if (!HOME_DIR) {
    throw new Error('Could not find "USERPROFILE"!')
}

const WORKBENCH_CSS_PATH = HOME_DIR +
    // `\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.css`
    `\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\out\\vs\\workbench\\workbench.desktop.main.copy.css`
// TODO: REMOVE ^^^

const IS_WORKBENCH_CSS_EXISTS = await exists(WORKBENCH_CSS_PATH)

if (!IS_WORKBENCH_CSS_EXISTS) {
    throw new Error('Could not find "workbench.desktop.main.css"!')
}

console.log(`✅ Found: "${WORKBENCH_CSS_PATH}".`)

const WORKBENCH_CSS_CONTENT = await Deno.readTextFile(WORKBENCH_CSS_PATH)

console.log("✅ The file content was read.")

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

const WORKBENCH_CSS_CONTENT_UINT8ARRAY = ENCODER.encode(WORKBENCH_CSS_CONTENT)

const MODIFIED_WORKBENCH_CSS_UINT8ARRAY = transform({
    filename: WORKBENCH_CSS_PATH,
    code: WORKBENCH_CSS_CONTENT_UINT8ARRAY,
    minify: !FLAGS["no-minify"],
    visitor: {
        Rule(RULE) {
            if (RULE.type !== "style") return
            if (RULE.value.selectors[0][0].type !== "class") return
            if (RULE.value.selectors[0][0].name !== "windows") return

            if (
                RULE.value.declarations.declarations[0].property !==
                    "font-family"
            ) return

            RULE.value.declarations.declarations[0].value = CUSTOM_FONT_FAMILY
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
