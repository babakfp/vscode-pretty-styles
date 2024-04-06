import { Application } from "abc"
import { validateForm } from "../utilities/FormSchema.ts"
import { operation } from "../utilities/operation.ts"

const app = new Application()

const port = 3000

app.static("/", "/src/public")

app.get("/", (c) => c.file("/src/pages/index.html"))
app.post("/", async (c) => {
    const body = await c.body

    const isFormValid = validateForm(body)

    if (!isFormValid.success) {
        return c.string("Invalid data received!")
    }

    const formData = isFormValid.output

    try {
        await operation({
            font: formData?.font,
            css: formData?.css,
            backup: formData?.backup,
        })

        return c.redirect("/")
    } catch (error) {
        return c.string(error.message)
    }
})

console.log("Your HTTP server is running!")
console.log(`http://localhost:${port}`)

app.start({ port })
