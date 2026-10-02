import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

import KeywordAutocompleteInput from '../../../components/KeywordAutocompleteInput/KeywordAutocompleteInput';

import Field from '../../PageBuilder/Field';
import SectionContainer from '../../PageBuilder/SectionBuilder/SectionContainer';

import CategoryButtons from './CategoryButtons';
import css from './LandingHero.module.css';

// ---------- Copy and categories: edit here ----------

// Used only when the Console hero section has no title/description
const TITLE = 'Find something you’ll love';
const SUBTITLE = 'Pre-loved and new fashion from people near you';
const PLACEHOLDER = 'Search for items, brands or styles...';

// "Try:" suggestion chips below the search bar
const TRY_SEARCHES = ['black leather bag', 'nike shoes size 42', 'baby winter jacket'];

// ------------------------------------------------------------

// Searches from the hero go to the smart search page
const SEARCH_PATH = '/smart-search';

const hasContent = field => !!field?.content;

/**
 * Landing page hero. Replaces the Console "hero" section: keeps its background image,
 * title and description, but swaps the location search for keyword search,
 * "Try:" suggestions and category cards.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.sectionId section id
 * @param {string?} props.className class from SectionBuilder (e.g. darkTheme)
 * @param {Object?} props.title title from Console
 * @param {Object?} props.description description from Console
 * @param {Object?} props.appearance background from Console
 * @param {Object?} props.options PageBuilder options
 * @returns {JSX.Element}
 */
const LandingHero = props => {
  const { sectionId, className, title, description, appearance, options } = props;
  const history = useHistory();
  const [keywords, setKeywords] = useState('');

  const fieldOptions = { fieldComponents: options?.fieldComponents };
  const hasBackgroundImage = appearance?.fieldType === 'customAppearance';

  const goToSearch = term => {
    const q = (term || '').trim();
    history.push(q ? `${SEARCH_PATH}?q=${encodeURIComponent(q)}` : SEARCH_PATH);
  };

  // KeywordAutocompleteInput expects a final-form style "input" object
  const input = {
    name: 'keywords',
    value: keywords,
    onChange: valueOrEvent =>
      setKeywords(typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent.target.value),
  };

  const handleSubmit = e => {
    e.preventDefault();
    goToSearch(keywords);
  };

  return (
    <SectionContainer
      id={sectionId || 'landing-hero'}
      className={className}
      rootClassName={classNames(css.root, { [css.onImage]: hasBackgroundImage })}
      appearance={appearance}
      options={fieldOptions}
    >
      <div className={css.inner}>
        <div className={css.hero}>
          {hasContent(title) ? (
            <Field data={title} className={css.title} options={fieldOptions} />
          ) : (
            <h1 className={css.title}>{TITLE}</h1>
          )}
          {hasContent(description) ? (
            <Field data={description} className={css.subtitle} options={fieldOptions} />
          ) : (
            <p className={css.subtitle}>{SUBTITLE}</p>
          )}

          <form className={css.searchForm} onSubmit={handleSubmit} role="search">
            <svg className={css.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <KeywordAutocompleteInput
              input={input}
              className={css.inputWrapper}
              inputClassName={css.input}
              placeholder={PLACEHOLDER}
              aria-label="Search"
              onSelect={term => goToSearch(term)}
            />
            <button type="submit" className={css.searchButton}>
              Search
            </button>
          </form>

          <div className={css.tryRow}>
            <span className={css.tryLabel}>Try:</span>
            {TRY_SEARCHES.map(term => (
              <button
                key={term}
                type="button"
                className={css.tryChip}
                onClick={() => goToSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>

          <CategoryButtons variant="pills" className={css.categoryButtons} />
        </div>
      </div>
    </SectionContainer>
  );
};

export default LandingHero;
