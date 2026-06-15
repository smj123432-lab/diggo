import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/jobs', '/jobs/'],
        disallow: [
          '/mypage/',
          '/manager/',
          '/admin/',
          '/chats/',
          '/notifications',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://diggo-zr4b.vercel.app/sitemap.xml',
  }
}
