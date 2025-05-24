export const Layout = (
    props: { children: preact.VNode },
) => (
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <meta name="color-scheme" content="light dark" />

            <title>vsCode Pretty Styles</title>
            <link rel="icon" href="/public/icon.ico" />

            <link
                rel="preload"
                href="/public/fonts/GeistMonoVF.woff2"
                as="font"
                type="font/woff2"
                crossorigin="anonymous"
            />

            <link rel="stylesheet" href="/public/css/pico@2.0.6.css" />
            <link
                rel="stylesheet"
                href="/public/css/pico@2.0.6.colors.min.css"
            />
            <link rel="stylesheet" href="/public/css/index.css" />
        </head>
        <body>{props.children}</body>
    </html>
)
