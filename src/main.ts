import { serve } from "./utilities/serve.tsx"

if (Deno.build.os !== "windows") {
    console.error("This script only works on Windows.")
    Deno.exit(1)
}

const homeDir = Deno.env.get("USERPROFILE")

if (!homeDir) {
    console.error("Could not find the home directory.")
    Deno.exit(1)
}

await serve({ homeDir })
