import * as embedder from "jsr:@nfnitloop/deno-embedder"

const options = {
    importMeta: import.meta,

    mappings: [
        {
            sourceDir: "public",
            destDir: "embed/public",
        },
    ],
}

if (import.meta.main) {
    await embedder.main({ options })
}
