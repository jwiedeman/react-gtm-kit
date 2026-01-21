function About() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ 'margin-bottom': '1rem' }}>About GTM-Kit</h1>
      <p style={{ 'margin-bottom': '1rem', color: '#666' }}>
        GTM-Kit is a lightweight, framework-agnostic library for integrating Google Tag Manager with modern JavaScript
        applications.
      </p>
      <p style={{ 'margin-bottom': '1rem', color: '#666' }}>
        This example demonstrates the SolidJS integration using the @jwiedeman/gtm-kit-solid package.
      </p>

      <h2 style={{ 'margin-top': '2rem', 'margin-bottom': '1rem' }}>Features Demonstrated</h2>
      <ul style={{ 'padding-left': '1.5rem', color: '#666' }}>
        <li style={{ 'margin-bottom': '0.5rem' }}>Automatic page view tracking on route changes</li>
        <li style={{ 'margin-bottom': '0.5rem' }}>Custom event tracking (CTA clicks, e-commerce)</li>
        <li style={{ 'margin-bottom': '0.5rem' }}>Consent Mode v2 with default denied state</li>
        <li style={{ 'margin-bottom': '0.5rem' }}>SolidJS primitives (signals, context)</li>
        <li style={{ 'margin-bottom': '0.5rem' }}>TypeScript support</li>
      </ul>
    </div>
  );
}

export default About;
