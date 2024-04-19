export default (props: { title: string; children: JSX.Element }) => {
    return (
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width" />
                <meta name="color-scheme" content="light dark" />
                <link rel="icon" href="/favicon.svg" />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.0.6"
                />
                <link rel="stylesheet" href="/index.css" />
                <title>{props.title}</title>
            </head>
            <body>{props.children}</body>
        </html>
    )
}
