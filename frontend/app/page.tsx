import type { Metadata } from 'next'
import { SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo/constants'
import { WebAppJsonLd } from '@/components/seo/JsonLd'
import HomePage from './PageClient'

export const metadata: Metadata = {
  title: `${SITE_NAME} - ERC-8004 AI Agent Explorer`,
  description: DEFAULT_DESCRIPTION,
}

export default function Page() {
  return (
    <>
      <WebAppJsonLd />
      <HomePage />
    </>
  )
}
