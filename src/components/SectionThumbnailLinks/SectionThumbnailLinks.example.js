import SectionThumbnailLinks from './SectionThumbnailLinks';

const placeholderImage648x448 =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="648" height="448" viewBox="0 0 648 448"%3E%3Crect fill="%23ddd" width="100%25" height="100%25"/%3E%3Ctext fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="48" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E648×448%3C/text%3E%3C/svg%3E';
const imageAltText = 'styleguide alt text';

export const TwoNamedLinksWithHeadings = {
  component: SectionThumbnailLinks,
  props: {
    linksPerRow: 2,
    links: [
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?1' } },
        text: 'Link 1',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?2' } },
        text: 'Link 2',
      },
    ],
    heading: 'Two links side by side',
    subHeading: 'One column in mobile, two columns in desktop.',
  },
  group: 'sections',
};

export const ThreeExternalLinksWithHeadings = {
  component: SectionThumbnailLinks,
  props: {
    linksPerRow: 3,
    links: [
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'ExternalLink', href: 'http://example.com/1' },
        text: 'Link 1',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'ExternalLink', href: 'http://example.com/2' },
        text: 'Link 2',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'ExternalLink', href: 'http://example.com/3' },
        text: 'Link 3',
      },
    ],
    heading: 'Three links side by side',
    subHeading: 'One column in mobile, three columns in desktop.',
  },
  group: 'sections',
};

export const FourLinks = {
  component: SectionThumbnailLinks,
  props: {
    linksPerRow: 2,
    links: [
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?1' } },
        text: 'Link 1 with quite a long text that tests how the items below align',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?2' } },
        text: 'Link 2',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?3' } },
        text: 'Link 3',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?4' } },
        text: 'Link 4',
      },
    ],
  },
  group: 'sections',
};

export const SixLinks = {
  component: SectionThumbnailLinks,
  props: {
    linksPerRow: 3,
    links: [
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?1' } },
        text: 'Link 1',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?2' } },
        searchQuery: '?2',
        text: 'Link 2',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?3' } },
        text: 'Link 3',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?4' } },
        text: 'Link 4',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?5' } },
        text: 'Link 5',
      },
      {
        imageUrl: placeholderImage648x448,
        imageAltText,
        linkProps: { type: 'NamedLink', name: 'SearchPage', to: { search: '?6' } },
        text: 'Link 6',
      },
    ],
  },
  group: 'sections',
};
