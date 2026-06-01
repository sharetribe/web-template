import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../../../util/testHelpers';
import BlockBrevoForm from './BlockBrevoForm';

describe('BlockBrevoForm', () => {
  it('renders nothing when no text content is provided', () => {
    const { container } = render(<BlockBrevoForm blockId="brevo-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the given HTML inside a wrapper with the block id', () => {
    const text = { content: '<form data-testid="brevo">hi</form>' };
    const { container } = render(<BlockBrevoForm blockId="brevo-2" text={text} />);
    expect(container.querySelector('#brevo-2')).toBeInTheDocument();
    expect(container.querySelector('form[data-testid="brevo"]')).toBeInTheDocument();
  });

  it('strips a leading code fence from text.content', () => {
    const text = { content: '```html\n<div data-testid="inside">hi</div>\n```' };
    const { container } = render(<BlockBrevoForm blockId="brevo-3" text={text} />);
    expect(container.querySelector('div[data-testid="inside"]')).toBeInTheDocument();
  });

  it('accepts a plain string text prop', () => {
    const { container } = render(
      <BlockBrevoForm blockId="brevo-4" text="<span data-testid='raw'>x</span>" />
    );
    expect(container.querySelector('span[data-testid="raw"]')).toBeInTheDocument();
  });
});
