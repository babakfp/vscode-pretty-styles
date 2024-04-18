import { getAvailablePort } from "@std/net"
import { Application } from "abc"
import { STATUS_CODE } from "@std/http/status"
import { validateForm } from "./lib/FormSchema.ts"
import { updateVsCodeStyles } from "./lib/updateVsCodeStyles.ts"
import { abcEdgeRenderer } from "./lib/abcEdgeRenderer.ts"

const port = Deno.args.includes("--dev") ? 3000 : getAvailablePort()

const app = new Application()

app.get("/", (c) => c.render("pages/index"))

app.post("/", async (c) => {
    const body = await c.body

    const isFormValid = validateForm(body)

    if (!isFormValid.success) {
        c.response.status = STATUS_CODE.BadRequest
        c.response.statusText = "Invalid data submitted!"

        return c.render("pages/index", {
            statusText: c.response.statusText,
        })
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

    return c.render("pages/index", {
        statusText: c.response.statusText,
    })
})

app.renderer = abcEdgeRenderer

app.static("/", "/public")

console.log("Your HTTP server is running!")
console.log(`http://localhost:${port}`)

app.start({ port })
