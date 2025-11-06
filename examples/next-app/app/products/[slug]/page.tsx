import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const products = {
  'analytics-suite': {
    name: 'Analytics Suite',
    description:
      'Full-fidelity event tracking with consent-aware routing and data layer helpers tailored for marketing teams.'
  },
  'commerce-insights': {
    name: 'Commerce Insights',
    description: 'Turnkey ecommerce tracking presets that mesh with GTM data layer conventions.'
  }
};

type ProductSlug = keyof typeof products;

interface ProductPageProps {
  params: { slug: ProductSlug };
}

export function generateStaticParams(): ProductPageProps['params'][] {
  return Object.keys(products).map((slug) => ({ slug })) as ProductPageProps['params'][];
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = products[params.slug];
  if (!product) {
    return {
      title: 'Product not found'
    };
  }

  return {
    title: `${product.name} | React GTM Kit Next.js example`
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products[params.slug];

  if (!product) {
    notFound();
  }

  return (
    <section className="content">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>
        Because this page is statically generated with dynamic params, the example shows how the GTM route listener
        stays in sync with App Router navigations even for parameterized routes.
      </p>
    </section>
  );
}
