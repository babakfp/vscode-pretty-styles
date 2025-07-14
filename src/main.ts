import { serve } from "./utilities/serve.tsx"

if (Deno.build.os !== "windows") {
    console.log("This script only works on Windows!")
    Deno.exit()
}

const homeDir = Deno.env.get("USERPROFILE")

if (!homeDir) {
    console.log("Could not find home dir!")
    Deno.exit()
}

await serve({ homeDir })
