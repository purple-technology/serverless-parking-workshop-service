import { createLightTheme } from 'baseui'
import { ThemePrimitives } from 'baseui/themes'

const primitives: Partial<ThemePrimitives> = {}

const overrides = {} as const

export const baseUiTheme = createLightTheme(primitives, overrides)
