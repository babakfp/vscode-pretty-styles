import { Layout } from "../components/Layout.tsx"

export default (props?: {
    statusCode?: number
    statusText?: string
    workbenchFontFamily?: string
    workbenchCSSStorage: string
    workbenchCSSStoragePath: string
    iframeMarkdownCSSStorage: string
    iframeMarkdownCSSStoragePath: string
}) => {
    return (
        <Layout>
            <main class="container">
                <form method="post" enctype="multipart/form-data">
                    <fieldset>
                        <label for="workbenchFontFamily">
                            Workbench Font Family
                        </label>
                        <input
                            id="workbenchFontFamily"
                            name="workbenchFontFamily"
                            value={props?.workbenchFontFamily}
                        />

                        <label for="workbenchCSS">Workbench CSS</label>
                        <input
                            id="workbenchCSS"
                            name="workbenchCSS"
                            type="file"
                            accept="text/css"
                        />

                        <label for="iframeMarkdownCSS">
                            Iframe Markdown CSS
                        </label>
                        <input
                            id="iframeMarkdownCSS"
                            name="iframeMarkdownCSS"
                            type="file"
                            accept="text/css"
                        />
                    </fieldset>

                    <button type="submit">Submit</button>
                    <button
                        type="submit"
                        name="isRevertChanges"
                        value="true"
                        class="secondary"
                    >
                        Revert Changes
                    </button>

                    {props?.statusText
                        ? (
                            <p
                                class={props?.statusCode === 200
                                    ? "pico-color-green-300"
                                    : "pico-color-pink-300"}
                            >
                                {props?.statusText}
                            </p>
                        )
                        : ""}

                    {props?.workbenchCSSStorage
                        ? (
                            <>
                                <hr />
                                <h2>Workbench CSS</h2>
                                <p>
                                    <code>
                                        {props.workbenchCSSStoragePath}
                                    </code>:
                                </p>
                                <pre><code>{props.workbenchCSSStorage}</code></pre>
                            </>
                        )
                        : ""}

                    {props?.iframeMarkdownCSSStorage
                        ? (
                            <>
                                <hr />
                                <h2>Iframe Markdown CSS</h2>
                                <p>
                                    <code>
                                        {props.iframeMarkdownCSSStoragePath}
                                    </code>:
                                </p>
                                <pre><code>{props.iframeMarkdownCSSStorage}</code></pre>
                            </>
                        )
                        : ""}
                </form>
            </main>
        </Layout>
    )
}
