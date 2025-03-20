import React from 'react';
import { Button } from 'antd';
import { FormattedMessage } from '../../util/reactIntl';
import { stringify } from '../../util/urlHelpers';
import { NamedLink, Heading } from '../../components';

import css from './ListingPage.module.css';

const BASE_SEARCH_QUERY_PARAMS = { pub_categoryLevel1: 'photos' };

export default function SectionKeywordsMaybe({ keywords }) {
  const keywordsOptions = Array.isArray(keywords) ? keywords : keywords.split(' ');

  if (!keywordsOptions.length) return null;

  return (
    <section className={css.sectionKeywords}>
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.keywordsTitle" />
      </Heading>
      <div className={css.wrapperKeywords}>
        {keywordsOptions.map(item => {
          const keyword = item.toLowerCase();
          return (
            <Button type="primary" shape="round" ghost>
              <NamedLink
                name="SearchPage"
                to={{ search: stringify({ ...BASE_SEARCH_QUERY_PARAMS, keywords: keyword }) }}
              >
                {keyword}
              </NamedLink>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
