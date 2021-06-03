import { SWRConfig } from 'swr'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig value={{
      initialData: pageProps,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }}>
      <Component {...pageProps} />
    </SWRConfig>
  )
}

export default MyApp
