import { useGtmPush } from '@jwiedeman/gtm-kit-solid';

function Home() {
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
          'text-align': 'center',
          padding: '4rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          'border-radius': '8px',
          'margin-bottom': '3rem'
        }}
      >
        <h1 style={{ 'font-size': '2.5rem', 'margin-bottom': '1rem' }}>Welcome to GTM Kit</h1>
        <p style={{ 'font-size': '1.25rem', 'margin-bottom': '2rem', opacity: '0.9' }}>
          The simplest way to add Google Tag Manager to your SolidJS app.
        </p>
        <button
          onClick={handleCtaClick}
          style={{
            background: 'white',
            color: '#667eea',
            'font-size': '1.125rem',
            padding: '0.75rem 2rem',
            'font-weight': '600',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer'
          }}
        >
          Get Started
        </button>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <h2 style={{ 'text-align': 'center', 'margin-bottom': '2rem', 'font-size': '2rem' }}>Features</h2>
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}
        >
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              'border-radius': '8px',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ color: '#2c3e50', 'margin-bottom': '0.5rem' }}>Zero Dependencies</h3>
            <p style={{ color: '#6c757d' }}>Core package is only 3.7KB gzipped with no runtime dependencies.</p>
          </div>
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              'border-radius': '8px',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ color: '#2c3e50', 'margin-bottom': '0.5rem' }}>Consent Mode v2</h3>
            <p style={{ color: '#6c757d' }}>Built-in support for Google's Consent Mode with ready-to-use presets.</p>
          </div>
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              'border-radius': '8px',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ color: '#2c3e50', 'margin-bottom': '0.5rem' }}>SolidJS Primitives</h3>
            <p style={{ color: '#6c757d' }}>Native SolidJS signals and context for reactive GTM integration.</p>
          </div>
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              'border-radius': '8px',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ color: '#2c3e50', 'margin-bottom': '0.5rem' }}>TypeScript First</h3>
            <p style={{ color: '#6c757d' }}>Full TypeScript support with complete type definitions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
