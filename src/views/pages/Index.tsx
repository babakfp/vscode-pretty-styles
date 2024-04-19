import Layout from "../components/Layout.tsx"

export default (props?: { statusText?: string }) => {
    return (
        <Layout title="vsCode Pretty Styles">
            <main class="container">
                <img
                    class="vscode-logo"
                    src={`/vscode${props?.statusText ? "" : "-alt"}.svg`}
                    alt="vsCode logo"
                />

                <form method="post" enctype="multipart/form-data">
                    <fieldset>
                        <label>
                            Editor UI Font-Family
                            <input name="font" />
                        </label>
                        <label>
                            Custom CSS
                            <input name="css" type="file" accept="text/css" />
                        </label>
                    </fieldset>

                    <button type="submit" name="submit">
                        Submit
                    </button>
                    <button type="submit" name="backup" class="secondary">
                        Restore Backup
                    </button>

                    {props?.statusText ? <p>{props?.statusText}</p> : ""}
                </form>

                <footer>
                    Made by {""}
                    <a href="https://github.com/babakfp" target="_blank">
                        Babak
                    </a>
                    {""} with ❤️ :)
                </footer>
            </main>
        </Layout>
    )
}