# vsCode Pretty Styles

A **Windows** application that allows you to Customize vsCode Editor UI Font-Family and add your own Custom CSS styles.

![](/app.png)

## How it works

This application modifies vsCode installation files. It doesn't make any breaking or unexpected changes. You can easily revert the changes. Feel free to check out the source [code](/src/lib/updateVsCodeStyles.ts).

## Guide

1. Downloaded the latest [release](https://github.com/babakfp/vscode-pretty-styles/releases/latest).
2. Extract the downloaded file.
3. Run the executable `vscode-pretty-styles.exe`.

## Limitations

-   It only works on Windows OS.
-   It only works on my system. I don't know if it will work on your computer!

    Windows specifications:

    -   Edition: Windows 11 Pro
    -   Version: 23H2
    -   OneDrive: Disabled

## Contributions

Feel welcome to open issues, PRs, send suggestions, code improvements, etc.

If possible, open an issue first, because I'll feel bad if I close your PR!

It's OK to make mistakes and not to know everything.

## Workbench path

This is the file that I modify to get things working.

```
C:\Users\Babak\AppData\Local\Programs\Microsoft VS Code\resources\app\out\vs\workbench\workbench.desktop.main.css
```

## How to open dev tools?

1. Press `ctrl` + `shift` + `p`.
2. Select "Toggle Developer Tools".

## Todo list

-   Use LightningCSS when https://github.com/denoland/deno/issues/23266 gets fixed.
