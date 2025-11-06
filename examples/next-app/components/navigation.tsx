import Link from 'next/link';

type LinkHref = Parameters<typeof Link>[0]['href'];

interface NavigationRoute {
  href: LinkHref;
  label: string;
}

const routes: NavigationRoute[] = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/products/analytics-suite' as LinkHref, label: 'Analytics Suite' }
];

export const Navigation = () => {
  return (
    <nav className="site-nav" aria-label="Primary">
      <ul>
        {routes.map((route) => {
          const key =
            typeof route.href === 'string'
              ? route.href
              : `${route.href.pathname}:${'params' in route.href ? JSON.stringify(route.href.params) : ''}`;

          return (
            <li key={key}>
              <Link href={route.href}>{route.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
