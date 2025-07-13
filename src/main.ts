import { serve } from "./utilities/serve.tsx"

if (Deno.build.os !== "windows") {
    Deno.exit()
}

const homeDir = Deno.env.get("USERPROFILE")

if (!homeDir) {
    Deno.exit()
}

await serve({ homeDir })
