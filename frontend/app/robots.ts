import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/demo/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
