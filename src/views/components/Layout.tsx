import type { PropsWithChildren } from "@hono/hono/jsx"

export const Layout = (props: PropsWithChildren<{ title: string }>) => (
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <meta name="color-scheme" content="light dark" />

            <title>{props.title}</title>
            <link rel="icon" href="/favicon.svg" />

            <link
                rel="preload"
                href="/fonts/GeistVF.woff2"
                as="font"
                type="font/woff2"
                crossorigin="anonymous"
            />

            <link rel="stylesheet" href="/css/pico@2.0.6.css" />
            <link rel="stylesheet" href="/css/pico@2.0.6.colors.min.css" />
            <link rel="stylesheet" href="/css/index.css" />
        </head>
        <body>{props.children}</body>
    </html>
)
