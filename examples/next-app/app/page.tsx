import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="content">
      <h2>Welcome to the Next.js integration demo</h2>
      <p>
        This route renders on the server and streams to the browser with GTM scripts already attached. Use the links
        below to trigger client-side navigations and inspect the <code>dataLayer</code> for the resulting{' '}
        <code>page_view</code> events.
      </p>
      <ul>
        <li>
          Navigate to the <Link href="/pricing">pricing page</Link> to simulate a marketing journey.
        </li>
        <li>
          Jump into the <Link href="/products/analytics-suite">Analytics Suite product page</Link> to exercise dynamic
          routes.
        </li>
      </ul>
    </section>
  );
}
