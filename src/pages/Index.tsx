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

                    <br />
                    <br />

                    <details name="css">
                        <summary>Workbench CSS</summary>
                        {props?.workbenchCSSStorage
                            ? (
                                <>
                                    <p>
                                        <code>
                                            {props.workbenchCSSStoragePath}
                                        </code>
                                    </p>
                                    <pre><code>{props.workbenchCSSStorage}</code></pre>
                                </>
                            )
                            : ""}
                    </details>

                    <hr />

                    <details name="css">
                        <summary>Iframe Markdown CSS</summary>
                        {props?.iframeMarkdownCSSStorage
                            ? (
                                <>
                                    <p>
                                        <code>
                                            {props.iframeMarkdownCSSStoragePath}
                                        </code>
                                    </p>
                                    <pre><code>{props.iframeMarkdownCSSStorage}</code></pre>
                                </>
                            )
                            : ""}
                    </details>
                </form>
            </main>
        </Layout>
    )
}
