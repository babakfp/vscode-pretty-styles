import { Application, BadRequestException } from "abc"
import { STATUS_CODE } from "@std/http/status"
import { validateForm } from "../utilities/FormSchema.ts"
import { updateVsCodeStyles } from "../utilities/updateVsCodeStyles.ts"

const app = new Application()

const port = 3000

app.get("/", (c) => c.file("/src/pages/index.html"))

app.post("/", async (c) => {
    const body = await c.body

    const isFormValid = validateForm(body)

    if (!isFormValid.success) {
        return c.string("Invalid data received!")
    }

    const formData = isFormValid.output

    try {
        await updateVsCodeStyles(formData)
        return c.redirect("/", STATUS_CODE.SeeOther)
    } catch (error) {
        throw new BadRequestException(error.message)
    }
})

app.static("/", "/src/static")

console.log("Your HTTP server is running!")
console.log(`http://localhost:${port}`)

app.start({ port })
