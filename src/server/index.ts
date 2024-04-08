import { Application } from "abc"
import { STATUS_CODE } from "@std/http/status"
import { validateForm } from "../utilities/FormSchema.ts"
import { updateVsCodeStyles } from "../utilities/updateVsCodeStyles.ts"
import { renderer } from "../utilities/renderer.ts"

const port = 3000

const app = new Application()

// @ts-expect-error They use old version of Deno and there is nothing that I can do!
app.renderer = renderer

app.get("/", (c) => c.render("/src/pages/index.edge"))

app.post("/", async (c) => {
    const body = await c.body

    const isFormValid = validateForm(body)

    if (!isFormValid.success) {
        c.response.status = STATUS_CODE.BadRequest
        c.response.statusText = "Invalid data submitted!"

        return c.render("/src/pages/index.edge", {
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

    return c.render("/src/pages/index.edge", {
        statusText: c.response.statusText,
    })
})

app.static("/", "/src/static")

console.log("Your HTTP server is running!")
console.log(`http://localhost:${port}`)

app.start({ port })
