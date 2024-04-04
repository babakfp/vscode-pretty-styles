import { rgb24 } from "std/fmt/colors.ts"

export const brown = (value: string) => {
    return rgb24(value, { r: 206, g: 145, b: 120 })
}
