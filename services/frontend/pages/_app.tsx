import '../styles/globals.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Amplify } from 'aws-amplify'
import { BaseProvider } from 'baseui'
import type { AppProps } from 'next/app'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { Provider as StyletronProvider } from 'styletron-react'

import { amplifyConfig } from '../config/amplify'
import { baseUiTheme } from '../config/baseUiTheme'
import { styledComponentsTheme } from '../config/styledComponentsTheme'
import { styletron } from '../config/styletron'

const queryClient = new QueryClient()

if (typeof window !== 'undefined') {
	Amplify.configure(amplifyConfig)
}

const GlobalStyles = createGlobalStyle`
body {
	overflow: hidden
}
`

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={styledComponentsTheme}>
				<StyletronProvider value={styletron}>
					<BaseProvider theme={baseUiTheme}>
						<GlobalStyles />
						<Component {...pageProps} />
					</BaseProvider>
				</StyletronProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}

export default MyApp
