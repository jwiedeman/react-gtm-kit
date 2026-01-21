export default function About() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '1rem' }}>About GTM-Kit</h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        GTM-Kit is a lightweight, framework-agnostic library for integrating Google Tag Manager with modern JavaScript
        applications.
      </p>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        This example demonstrates the Remix integration using the @jwiedeman/gtm-kit-remix package.
      </p>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Features Demonstrated</h2>
      <ul style={{ paddingLeft: '1.5rem', color: '#666' }}>
        <li style={{ marginBottom: '0.5rem' }}>Automatic page view tracking with useTrackPageViews</li>
        <li style={{ marginBottom: '0.5rem' }}>Custom event tracking (CTA clicks, e-commerce)</li>
        <li style={{ marginBottom: '0.5rem' }}>Consent Mode v2 with default denied state</li>
        <li style={{ marginBottom: '0.5rem' }}>React hooks integration</li>
        <li style={{ marginBottom: '0.5rem' }}>TypeScript support</li>
      </ul>
    </div>
  );
}
