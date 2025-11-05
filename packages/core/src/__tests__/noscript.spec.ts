import { createNoscriptMarkup, DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES } from '../noscript';

describe('createNoscriptMarkup', () => {
  it('builds default noscript markup for a container id', () => {
    expect(createNoscriptMarkup('GTM-TEST')).toBe(
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TEST" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>'
    );
  });

  it('merges default and container-specific query params and host override', () => {
    const markup = createNoscriptMarkup(
      { id: 'GTM-AAA', queryParams: { gtm_preview: 'preview' } },
      {
        host: 'https://tag.example.com/',
        defaultQueryParams: { gtm_auth: 'auth-token' }
      }
    );

    const srcMatch = markup.match(/src="([^"]+)"/);
    expect(srcMatch).not.toBeNull();
    const src = srcMatch?.[1] ?? '';
    expect(src.startsWith('https://tag.example.com/ns.html')).toBe(true);

    const decodedSrc = src.replace(/&amp;/g, '&');
    const url = new URL(decodedSrc);
    expect(url.searchParams.get('id')).toBe('GTM-AAA');
    expect(url.searchParams.get('gtm_auth')).toBe('auth-token');
    expect(url.searchParams.get('gtm_preview')).toBe('preview');
  });

  it('accepts multiple containers and concatenates markup', () => {
    expect(createNoscriptMarkup(['GTM-ONE', 'GTM-TWO'])).toBe(
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ONE" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>' +
        '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TWO" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>'
    );
  });

  it('allows overriding default iframe attributes', () => {
    const markup = createNoscriptMarkup('GTM-ATTR', {
      iframeAttributes: { title: 'Custom title', class: 'gtm-noscript' }
    });

    expect(markup).toContain('title="Custom title"');
    expect(markup).toContain('class="gtm-noscript"');
    expect(markup).toContain('height="0"');
    expect(markup).not.toContain('title="Google Tag Manager"');
  });
});

describe('DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES', () => {
  it('exposes a copy of the default attributes', () => {
    expect(DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES).toEqual({
      height: '0',
      width: '0',
      style: 'display:none;visibility:hidden',
      title: 'Google Tag Manager'
    });

    DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES.title = 'mutated';
    expect(DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES.title).toBe('mutated');

    const freshDefaults = createNoscriptMarkup('GTM-RESET');
    expect(freshDefaults).toContain('title="Google Tag Manager"');
  });
});
