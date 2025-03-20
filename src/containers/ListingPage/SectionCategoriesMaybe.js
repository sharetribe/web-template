import React from 'react';
import { Button } from 'antd';
import { FormattedMessage } from '../../util/reactIntl';
import { stringify } from '../../util/urlHelpers';
import { NamedLink, Heading } from '../../components';

import css from './ListingPage.module.css';
const IMAGE_CATEGORY_KEY = 'imageryCategory';
const PRODUCT_CATEGORY_KEY = 'categoryLevel1';
const BASE_SEARCH_QUERY_PARAMS = { pub_categoryLevel1: 'photos' };

export default function SectionCategoriesMaybe({
  publicData,
  listingFieldConfigs,
  categoryConfiguration,
}) {
  const selectedCategories = publicData?.[IMAGE_CATEGORY_KEY] || [];

  if (!selectedCategories.length) return null;

  const categoryFieldConfigs = listingFieldConfigs.find(
    config => config.key === IMAGE_CATEGORY_KEY
  );
  const categoryFieldOptions = categoryFieldConfigs.enumOptions;
  const categoryLevel = publicData?.[PRODUCT_CATEGORY_KEY] || '';
  const categoryLevelConfig = categoryConfiguration?.categories?.find(
    config => config.id === categoryLevel
  );

  return (
    <section className={css.sectionCategories}>
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.categoriesTitle" />
      </Heading>
      <div className={css.wrapperCategories}>
        <Button type="link">
          <NamedLink name="SearchPage" to={{ search: stringify(BASE_SEARCH_QUERY_PARAMS) }}>
            {categoryLevelConfig.name}
          </NamedLink>
        </Button>
        <span>|</span>
        {selectedCategories.map((item, index) => {
          const category = categoryFieldOptions.find(config => config.option === item);
          const isLast = index + 1 === selectedCategories.length;
          return (
            <Button type="link" key={`category-${index}`}>
              <NamedLink
                name="SearchPage"
                to={{
                  search: stringify({
                    ...BASE_SEARCH_QUERY_PARAMS,
                    pub_imageryCategory: category.option,
                  }),
                }}
              >
                {category.label}
                {isLast ? '' : ','}
              </NamedLink>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
