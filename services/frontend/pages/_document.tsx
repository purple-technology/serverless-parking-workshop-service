import Document, {
	DocumentContext,
	DocumentInitialProps,
	Head,
	Html,
	Main,
	NextScript
} from 'next/document'
import * as React from 'react'
import { ServerStyleSheet } from 'styled-components'
import { Server } from 'styletron-engine-atomic'
import { sheetT } from 'styletron-engine-atomic/lib/server/server'
import { Provider as StyletronProvider } from 'styletron-react'

import { styletron } from '../config/styletron'

interface AppDocumentProps {
	styletronStylesheets: sheetT[]
}

class AppDocument extends Document<AppDocumentProps> {
	static async getInitialProps(
		ctx: DocumentContext
	): Promise<DocumentInitialProps> {
		const styledComponentsSheet = new ServerStyleSheet()

		const renderPage = ():
			| DocumentInitialProps
			| Promise<DocumentInitialProps> =>
			ctx.renderPage({
				// eslint-disable-next-line react/display-name
				enhanceApp: (App) => (props) =>
					styledComponentsSheet.collectStyles(
						<StyletronProvider value={styletron}>
							<App {...props} />
						</StyletronProvider>
					)
			})

		const styletronStylesheets = (styletron as Server).getStylesheets() || []

		const initialProps = await Document.getInitialProps({
			...ctx,
			renderPage
		})

		return {
			...initialProps,
			styletronStylesheets,
			styles: (
				<>
					{initialProps.styles}
					{styledComponentsSheet.getStyleElement()}
				</>
			)
		} as unknown as DocumentInitialProps
	}

	render(): JSX.Element {
		return (
			<Html>
				<Head>
					{this.props.styletronStylesheets.map((sheet, i) => (
						<style
							className="_styletron_hydrate_"
							// eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={{ __html: sheet.css }}
							media={sheet.attrs.media}
							data-hydrate={sheet.attrs['data-hydrate']}
							key={i}
						/>
					))}
					<link
						rel="stylesheet"
						href="https://codemirror.net/5/lib/codemirror.css"
					/>
					<link
						href="https://unpkg.com/graphiql@1.11.5/graphiql.min.css"
						rel="stylesheet"
					/>
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		)
	}
}

export default AppDocument
