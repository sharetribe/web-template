import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl, FormattedMessage, FormattedDate } from 'react-intl';
import { Helmet } from 'react-helmet-async';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  fetchPriceTrackerData,
  setFilters,
  selectPriceTrackerData,
  selectPriceTrackerTrends,
  selectPriceTrackerMeta,
  selectPriceTrackerIsLoading,
  selectPriceTrackerError,
  selectPriceTrackerFilters,
} from './PriceTrackerPage.duck';
import { useConfiguration } from '../../context/configurationContext';
import { formatMoney } from '../../util/currency';

import css from './PriceTrackerPage.module.css';

/**
 * PriceTrackerPage component
 * 
 * Displays a list of sold items with their prices and a trend graph,
 * allowing users to filter by keyword and category.
 */
const PriceTrackerPage = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const config = useConfiguration();

  const data = useSelector(selectPriceTrackerData);
  const trends = useSelector(selectPriceTrackerTrends);
  const meta = useSelector(selectPriceTrackerMeta);
  const isLoading = useSelector(selectPriceTrackerIsLoading);
  const error = useSelector(selectPriceTrackerError);
  const filters = useSelector(selectPriceTrackerFilters);

  const [localFilters, setLocalFilters] = useState(filters);

  // Get categories from config
  const categories = config?.listing?.categories || [];
  const allCategories = [];

  const flattenCategories = (cats) => {
    cats.forEach(cat => {
      allCategories.push(cat);
      if (cat.subcategories) {
        flattenCategories(cat.subcategories);
      }
    });
  };

  flattenCategories(categories);

  // Fetch data when filters change
  useEffect(() => {
    dispatch(fetchPriceTrackerData(localFilters));
  }, [dispatch, localFilters]);

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleReset = () => {
    const resetFilters = {
      keyword: '',
      category: '',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      perPage: 20,
    };
    setLocalFilters(resetFilters);
  };

  const handlePageChange = (newPage) => {
    setLocalFilters(prev => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = intl.formatMessage({ id: 'PriceTrackerPage.title' });
  const pageDescription = intl.formatMessage({ id: 'PriceTrackerPage.description' });

  // Format trend data for the chart
  const chartData = trends.map(t => ({
    name: intl.formatDate(new Date(t.date), { month: 'short', day: 'numeric' }),
    price: t.price,
    fullDate: t.date,
  }));

  return (
    <div className={css.root}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <div className={css.container}>
        {/* Header */}
        <div className={css.header}>
          <h1 className={css.title}>
            <FormattedMessage id="PriceTrackerPage.title" />
          </h1>
          <p className={css.description}>
            <FormattedMessage id="PriceTrackerPage.description" />
          </p>
        </div>

        {/* Trend Chart Section */}
        {trends.length > 0 && (
          <div className={css.chartSection}>
            <h2 className={css.sectionTitle}>
              <FormattedMessage id="PriceTrackerPage.trendTitle" />
            </h2>
            <div className={css.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, intl.formatMessage({ id: 'PriceTrackerPage.avgPrice' })]}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    name={intl.formatMessage({ id: 'PriceTrackerPage.avgPrice' })}
                    stroke="#4A90E2" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={css.filtersSection}>
          <div className={css.filterGrid}>
            {/* Keyword Filter */}
            <div className={css.filterGroup}>
              <label className={css.filterLabel}>
                <FormattedMessage id="PriceTrackerPage.filterKeyword" />
              </label>
              <input
                type="text"
                className={css.filterInput}
                placeholder={intl.formatMessage({ id: 'PriceTrackerPage.keywordPlaceholder' })}
                value={localFilters.keyword}
                onChange={e => handleFilterChange('keyword', e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className={css.filterGroup}>
              <label className={css.filterLabel}>
                <FormattedMessage id="PriceTrackerPage.filterCategory" />
              </label>
              <select
                className={css.filterSelect}
                value={localFilters.category}
                onChange={e => handleFilterChange('category', e.target.value)}
              >
                <option value="">
                  {intl.formatMessage({ id: 'PriceTrackerPage.categoryAll' })}
                </option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className={css.filterGroup}>
              <label className={css.filterLabel}>
                <FormattedMessage id="PriceTrackerPage.sortBy" />
              </label>
              <select
                className={css.filterSelect}
                value={localFilters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="date">
                  {intl.formatMessage({ id: 'PriceTrackerPage.sortDate' })}
                </option>
                <option value="price">
                  {intl.formatMessage({ id: 'PriceTrackerPage.sortPrice' })}
                </option>
              </select>
            </div>

            {/* Sort Order */}
            <div className={css.filterGroup}>
              <label className={css.filterLabel}>
                <FormattedMessage id="PriceTrackerPage.sortOrder" />
              </label>
              <select
                className={css.filterSelect}
                value={localFilters.sortOrder}
                onChange={e => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">
                  {intl.formatMessage({ id: 'PriceTrackerPage.descending' })}
                </option>
                <option value="asc">
                  {intl.formatMessage({ id: 'PriceTrackerPage.ascending' })}
                </option>
              </select>
            </div>

            {/* Buttons */}
            <div className={css.buttonGroup}>
              <button
                className={css.buttonPrimary}
                onClick={() => handleFilterChange('page', 1)}
                disabled={isLoading}
              >
                <FormattedMessage id="PriceTrackerPage.search" />
              </button>
              <button
                className={css.buttonSecondary}
                onClick={handleReset}
                disabled={isLoading}
              >
                <FormattedMessage id="PriceTrackerPage.reset" />
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={css.errorContainer}>
            <h3 className={css.errorTitle}>
              <FormattedMessage id="PriceTrackerPage.errorTitle" />
            </h3>
            <p className={css.errorMessage}>{error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={css.loadingContainer}>
            <div className={css.spinner} />
          </div>
        )}

        {/* Results Section */}
        {!isLoading && data.length === 0 && (
          <div className={css.noResults}>
            <div className={css.noResultsIcon}>📊</div>
            <h3 className={css.noResultsTitle}>
              <FormattedMessage id="PriceTrackerPage.noResults" />
            </h3>
            <p className={css.noResultsMessage}>
              <FormattedMessage id="PriceTrackerPage.noResultsMessage" />
            </p>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <div className={css.resultsSection}>
            <div className={css.resultsHeader}>
              <h2 className={css.resultsTitle}>
                <FormattedMessage
                  id="PriceTrackerPage.resultsTitle"
                  values={{ count: meta.totalItems || 0 }}
                />
              </h2>
              <span className={css.resultsMeta}>
                {intl.formatMessage(
                  { id: 'PriceTrackerPage.resultsMeta' },
                  {
                    page: meta.page || 1,
                    totalPages: meta.totalPages || 1,
                  }
                )}
              </span>
            </div>

            {/* Results Grid */}
            <div className={css.resultsList}>
              {data.map(item => (
                <div key={item.id} className={css.resultCard}>
                  <h3 className={css.resultCardTitle}>{item.title}</h3>
                  <div className={css.resultCardMeta}>
                    {item.category && (
                      <span className={css.resultCardCategory}>{item.category}</span>
                    )}
                    <span>{item.currency}</span>
                  </div>
                  <div className={css.resultCardPrice}>
                    {formatMoney(
                      { amount: Math.round(item.price * 100), currency: item.currency },
                      intl
                    )}
                  </div>
                  <div className={css.resultCardDate}>
                    <FormattedMessage id="PriceTrackerPage.soldOn" />{' '}
                    <FormattedDate value={new Date(item.soldDate)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className={css.paginationContainer}>
                <button
                  className={css.paginationButton}
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1 || isLoading}
                >
                  ←
                </button>

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    className={`${css.paginationButton} ${
                      pageNum === meta.page ? css.active : ''
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className={css.paginationButton}
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages || isLoading}
                >
                  →
                </button>

                <span className={css.paginationInfo}>
                  {intl.formatMessage(
                    { id: 'PriceTrackerPage.paginationInfo' },
                    {
                      page: meta.page || 1,
                      totalPages: meta.totalPages || 1,
                    }
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceTrackerPage;
