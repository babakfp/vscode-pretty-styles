import { Edge } from "edge.js"
import type { Renderer } from "abc"
import { join } from "@std/path/join"

const edge = Edge.create({
    cache: !Deno.args.includes("--dev"),
})

edge.mount(join(Deno.cwd(), "/views"))

// TODO: Remove `Renderer` if the below `@ts-expect-error` gets fixed.
export const abcEdgeRenderer: Renderer = {
    // @ts-expect-error They use old version of Deno and there is nothing that I can do!
    render: async (path, data: Record<string, unknown>) => {
        return await edge.render(path, data)
    },
}
