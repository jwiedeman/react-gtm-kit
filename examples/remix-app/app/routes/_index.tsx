import { useGtmPush } from '@jwiedeman/gtm-kit-remix';

export default function Index() {
  const push = useGtmPush();

  const handleCtaClick = () => {
    push({
      event: 'cta_click',
      cta_name: 'hero_get_started',
      cta_location: 'homepage_hero'
    });
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <section
        style={{
          textAlign: 'center',
          padding: '4rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          marginBottom: '3rem'
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to GTM Kit</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          The simplest way to add Google Tag Manager to your Remix app.
        </p>
        <button
          onClick={handleCtaClick}
          style={{
            background: 'white',
            color: '#667eea',
            fontSize: '1.125rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Get Started
        </button>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Features</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}
        >
          <FeatureCard
            title="Zero Dependencies"
            description="Core package is only 3.7KB gzipped with no runtime dependencies."
          />
          <FeatureCard
            title="Consent Mode v2"
            description="Built-in support for Google's Consent Mode with ready-to-use presets."
          />
          <FeatureCard
            title="Automatic Route Tracking"
            description="Track page views automatically with useTrackPageViews hook."
          />
          <FeatureCard title="TypeScript First" description="Full TypeScript support with complete type definitions." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}
    >
      <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#6c757d', margin: 0 }}>{description}</p>
    </div>
  );
}
