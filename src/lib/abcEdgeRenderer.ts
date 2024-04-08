import { Edge } from "edge.js"
import type { Renderer } from "abc"
import { join } from "@std/path/join"

const edge = new Edge()

const edgeRender = async (content: string, data: Record<string, unknown>) =>
    await edge.renderRaw(content, data)

// TODO: Remove `Renderer` if the below `@ts-expect-error` gets fixed.
export const abcEdgeRenderer: Renderer = {
    // @ts-expect-error They use old version of Deno and there is nothing that I can do!
    render: async (path, data: Record<string, unknown>) => {
        const content = Deno.readTextFileSync(join(Deno.cwd(), path))
        return await edgeRender(content, data)
    },
}
