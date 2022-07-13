import '../styles/globals.css'

import { Amplify } from 'aws-amplify'
import { BaseProvider } from 'baseui'
import type { AppProps } from 'next/app'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { Provider as StyletronProvider } from 'styletron-react'

import { amplifyConfig } from '../config/amplify'
import { baseUiTheme } from '../config/baseUiTheme'
import { styledComponentsTheme } from '../config/styledComponentsTheme'
import { styletron } from '../config/styletron'

if (typeof window !== 'undefined') {
	Amplify.configure(amplifyConfig)
}

const GlobalStyles = createGlobalStyle`
`

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
	return (
		<ThemeProvider theme={styledComponentsTheme}>
			<StyletronProvider value={styletron}>
				<BaseProvider theme={baseUiTheme}>
					<GlobalStyles />
					<Component {...pageProps} />
				</BaseProvider>
			</StyletronProvider>
		</ThemeProvider>
	)
}

export default MyApp
