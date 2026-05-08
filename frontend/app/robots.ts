import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/(protected)/',
          '/api/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: 'https://edu-vers.com/sitemap.xml',
  };
}
