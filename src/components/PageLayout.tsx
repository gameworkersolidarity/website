import { Header } from '@/app/(frontend)/components/Header'
import { Footer } from '@/app/(frontend)/components/Footer'

export default function PageLayout({ children }: { children: any }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main>{children}</main>

      <Footer />
    </div>
  )
}
