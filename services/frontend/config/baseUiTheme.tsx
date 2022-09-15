import { createLightTheme } from 'baseui'
import { ThemePrimitives } from 'baseui/themes'

const primitives: Partial<ThemePrimitives> = {
	positive: '#269819',
	negative: '#b62323'
}

const overrides = {} as const

export const baseUiTheme = createLightTheme(primitives, overrides)
