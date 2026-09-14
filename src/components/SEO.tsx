import { Helmet } from "react-helmet-async";

const SITE_URL = "https://rinvita.co.uk";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** Optional schema.org JSON-LD payload rendered into the head. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO = ({ title, description, path, type = "website", noindex, jsonLd }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="RinVita" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
