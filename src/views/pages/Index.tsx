import { Layout } from "../components/Layout.tsx"

export default (props?: {
    statusCode?: number
    statusText?: string
    font?: string
}) => {
    const title = "vsCode Pretty Styles"

    return (
        <Layout title={title}>
            <main class="container">
                <h1>{title}</h1>

                <form method="post" enctype="multipart/form-data">
                    <fieldset>
                        <label>
                            Editor UI Font-Family
                            <input name="font" value={props?.font} />
                        </label>
                        <label>
                            Custom CSS
                            <input name="css" type="file" accept="text/css" />
                        </label>
                    </fieldset>

                    <button type="submit">Submit</button>
                    <button
                        type="submit"
                        name="backup"
                        value="true"
                        class="secondary"
                    >
                        Revert Changes
                    </button>

                    {props?.statusText ? (
                        <p
                            class={
                                props?.statusCode === 200
                                    ? "pico-color-green-300"
                                    : "pico-color-pink-300"
                            }
                        >
                            {props?.statusText}
                        </p>
                    ) : (
                        ""
                    )}
                </form>

                <footer>
                    <p>
                        Made by {""}
                        <a href="https://github.com/babakfp" target="_blank">
                            Babak
                        </a>
                    </p>
                </footer>
            </main>
        </Layout>
    )
}
