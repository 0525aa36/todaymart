import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateSearchBoxSchema
} from '@/lib/seo-utils';

export function HomeSchema() {
  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();
  const searchBoxSchema = generateSearchBoxSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(searchBoxSchema),
        }}
      />
    </>
  );
}