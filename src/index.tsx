import { getAvailablePort } from "@std/net"
import { Application } from "abc"
import { STATUS_CODE } from "@std/http/status"
import { open } from "open"
import { renderToString } from "jsx"
import { validateForm } from "./lib/FormSchema.ts"
import { updateVsCodeStyles } from "./lib/updateVsCodeStyles.ts"

import Index from "./views/pages/Index.tsx"

const port = Deno.args.includes("--production") ? getAvailablePort() : 3000

const app = new Application()

app.get("/", async (c) => c.html(await renderToString(<Index />)))

app.post("/", async (c) => {
    const body = await c.body

    const isFormValid = validateForm(body)

    if (!isFormValid.success) {
        c.response.status = STATUS_CODE.BadRequest
        c.response.statusText = "Invalid data submitted!"

        return c.html(
            await renderToString(<Index statusText={c.response.statusText} />)
        )
    }

    const formData = isFormValid.output

    const result = await updateVsCodeStyles(formData)

    if (result.type === "ERROR" || result.type === "INFO") {
        c.response.statusText = result.message
    } else if (formData?.backup) {
        c.response.statusText = "Original styles restored successfully!"
    } else {
        c.response.statusText = "Custom styles were added successfully!"
    }

    c.response.status =
        result.type === "ERROR" ? STATUS_CODE.BadRequest : STATUS_CODE.OK

    return c.html(
        await renderToString(<Index statusText={c.response.statusText} />)
    )
})

app.static("/", "/public")

console.log("Your HTTP server is running!")
console.log(`http://localhost:${port}`)

if (Deno.args.includes("--production")) {
    open(`http://localhost:${port}`)
}

app.start({ port })
