import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionSelectedUser from './SectionSelectedUser';

const { screen } = testingLibrary;

const defaultProps = {
  sectionId: 'av-selected-users-home',
  defaultClasses: {},
  numColumns: 3,
  options: {},
  blocks: [],
  users: [],
};

const makeUser = (id, name) => ({
  id: { uuid: id },
  attributes: { profile: { displayName: name, publicData: {} } },
});

describe('SectionSelectedUser', () => {
  it('renders without crashing with no users', () => {
    const { container } = render(<SectionSelectedUser {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders section title when provided', () => {
    render(
      <SectionSelectedUser
        {...defaultProps}
        title={{ fieldType: 'heading2', content: 'Nuestros Vendedores' }}
      />
    );
    expect(screen.getByText('Nuestros Vendedores')).toBeInTheDocument();
  });

  it('renders a card for each user', () => {
    const users = [makeUser('u-1', 'Ana García'), makeUser('u-2', 'Beatriz López')];
    render(<SectionSelectedUser {...defaultProps} users={users} />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Beatriz López')).toBeInTheDocument();
  });

  it('matches snapshot with empty users', () => {
    const { asFragment } = render(<SectionSelectedUser {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
