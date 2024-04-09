# vsCode Pretty Styles

A **Windows** application that allows you to Customize vsCode Editor UI Font-Family and add your own Custom CSS styles.

![](/Screenshot.png)

## How it works

This application modifies the files of installed vsCode. It doesn't make any breaking changes. Whatever it does, you can revert it back. It also does not do unexpected things. Feel free to check out [the source code](/src/lib/updateVsCodeStyles.ts).

## Guide

1. Downloaded [the latest release](https://github.com/babakfp/vscode-pretty-styles/releases/latest).
2. Extract the `.zip` file.
3. Run the executable file.
4. Open http://localhost:3000.

## Limitations

-   Only works on Windows OS.
-   Only works on my system. I use Windows 11 and OneDrive is disabled. I'm not sure how it will behave on other people's computers.

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

## Notes

-   Use LightningCSS when https://github.com/denoland/deno/issues/23266 gets fixed.
