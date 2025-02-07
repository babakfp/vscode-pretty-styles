import * as embedder from "jsr:@nfnitloop/deno-embedder"

if (!import.meta.main) {
    Deno.exit()
}

await embedder.main({
    options: {
        importMeta: import.meta,
        mappings: [
            {
                sourceDir: "public",
                destDir: "embed/public",
            },
        ],
    },
})
