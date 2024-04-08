import { Edge } from "edge.js"
import { Renderer } from "abc"
import { join } from "@std/path/join"

const edge = new Edge()

export const renderer = {
    // @ts-expect-error They use old version of Deno and there is nothing that I can do!
    render: async (path, data: Record<string, unknown>) => {
        const content = Deno.readTextFileSync(join(Deno.cwd(), path))
        return await edge.renderRaw(content, data)
    },
} satisfies Renderer
