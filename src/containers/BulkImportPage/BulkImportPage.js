import React, { useState, useEffect, useRef, useCallback } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, H2 } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BulkImportPage.module.css';

const API_KEY_STORAGE_KEY = 'bulkImportApiKey';

const STATUS_IDLE = 'idle';
const STATUS_UPLOADING = 'uploading';
const STATUS_PROCESSING = 'processing';
const STATUS_COMPLETED = 'completed';
const STATUS_ERROR = 'error';

const BulkImportPageComponent = props => {
  const { scrollingDisabled } = props;
  const intl = useIntl();

  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    }
    return '';
  });
  const [zipFile, setZipFile] = useState(null);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const pollRef = useRef(null);

  // Persist API key
  const handleApiKeyChange = useCallback(e => {
    const key = e.target.value;
    setApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
  }, []);

  // Poll for job status
  useEffect(() => {
    if (status !== STATUS_PROCESSING || !jobId || !apiKey) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/bulk-import/status/${jobId}`, {
          headers: { 'X-Import-Key': apiKey },
        });
        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`);
        }
        const data = await res.json();
        setJobData(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setStatus(STATUS_COMPLETED);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    poll(); // Immediate first poll
    pollRef.current = setInterval(poll, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [status, jobId, apiKey]);

  const handleSubmit = async e => {
    e.preventDefault();
    setUploadError(null);
    setJobData(null);

    if (!apiKey.trim()) {
      setUploadError(intl.formatMessage({ id: 'BulkImportPage.errorNoApiKey' }));
      return;
    }
    if (!zipFile) {
      setUploadError(intl.formatMessage({ id: 'BulkImportPage.errorNoZip' }));
      return;
    }

    setStatus(STATUS_UPLOADING);

    const formData = new FormData();
    formData.append('zipFile', zipFile);

    try {
      const res = await fetch('/api/bulk-import/start', {
        method: 'POST',
        headers: { 'X-Import-Key': apiKey },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(STATUS_ERROR);
        const details = data.details ? '\n' + data.details.join('\n') : '';
        setUploadError((data.error || 'Upload failed') + details);
        return;
      }

      setJobId(data.jobId);
      setJobData({
        total: data.total,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        results: [],
      });
      setStatus(STATUS_PROCESSING);
    } catch (err) {
      setStatus(STATUS_ERROR);
      setUploadError(err.message);
    }
  };

  const handleReset = () => {
    setStatus(STATUS_IDLE);
    setJobId(null);
    setJobData(null);
    setUploadError(null);
    setZipFile(null);
  };

  const templateDownloadUrl = '/api/bulk-import/template';

  const progressPercent =
    jobData && jobData.total > 0 ? Math.round((jobData.processed / jobData.total) * 100) : 0;

  const title = intl.formatMessage({ id: 'BulkImportPage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <H2 as="h1">
            <FormattedMessage id="BulkImportPage.heading" />
          </H2>
          <p className={css.description}>
            <FormattedMessage id="BulkImportPage.description" />
          </p>

          {/* API Key */}
          <div className={css.section}>
            <label className={css.label} htmlFor="apiKey">
              <FormattedMessage id="BulkImportPage.apiKeyLabel" />
            </label>
            <input
              id="apiKey"
              type="password"
              className={css.input}
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder={intl.formatMessage({ id: 'BulkImportPage.apiKeyPlaceholder' })}
            />
          </div>

          {/* Upload Form */}
          {(status === STATUS_IDLE || status === STATUS_ERROR) && (
            <form onSubmit={handleSubmit}>
              <div className={css.section}>
                <label className={css.label} htmlFor="zipFile">
                  <FormattedMessage id="BulkImportPage.zipLabel" />
                </label>
                <p className={css.helperText}>
                  <FormattedMessage id="BulkImportPage.zipHelp" />
                </p>
                <input
                  id="zipFile"
                  type="file"
                  accept=".zip"
                  className={css.fileInput}
                  onChange={e => setZipFile(e.target.files[0] || null)}
                />
                {zipFile && (
                  <p className={css.fileCount}>
                    <FormattedMessage
                      id="BulkImportPage.zipSelected"
                      values={{ name: zipFile.name }}
                    />
                  </p>
                )}
              </div>

              <div className={css.actions}>
                <button type="submit" className={css.submitButton}>
                  <FormattedMessage id="BulkImportPage.startImport" />
                </button>
                <a
                  href={templateDownloadUrl}
                  className={css.templateLink}
                  download
                >
                  <FormattedMessage id="BulkImportPage.downloadTemplate" />
                </a>
              </div>

              {uploadError && (
                <div className={css.errorBox}>
                  <pre className={css.errorText}>{uploadError}</pre>
                </div>
              )}
            </form>
          )}

          {/* Uploading */}
          {status === STATUS_UPLOADING && (
            <div className={css.statusBox}>
              <p className={css.statusText}>
                <FormattedMessage id="BulkImportPage.uploading" />
              </p>
            </div>
          )}

          {/* Processing / Completed */}
          {(status === STATUS_PROCESSING || status === STATUS_COMPLETED) && jobData && (
            <div className={css.progressSection}>
              {/* Progress bar */}
              <div className={css.progressBar}>
                <div className={css.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <p className={css.progressText}>
                <FormattedMessage
                  id="BulkImportPage.progress"
                  values={{
                    processed: jobData.processed,
                    total: jobData.total,
                    percent: progressPercent,
                  }}
                />
              </p>

              {/* Summary */}
              <div className={css.summaryRow}>
                <span className={css.successCount}>
                  <FormattedMessage
                    id="BulkImportPage.succeeded"
                    values={{ count: jobData.succeeded }}
                  />
                </span>
                <span className={css.errorCount}>
                  <FormattedMessage id="BulkImportPage.failed" values={{ count: jobData.failed }} />
                </span>
              </div>

              {/* Status badge */}
              {status === STATUS_COMPLETED && (
                <p className={css.completedBadge}>
                  <FormattedMessage id="BulkImportPage.completed" />
                </p>
              )}
              {status === STATUS_PROCESSING && (
                <p className={css.processingBadge}>
                  <FormattedMessage id="BulkImportPage.processing" />
                </p>
              )}

              {/* Errors table */}
              {jobData.errors.length > 0 && (
                <div className={css.errorsSection}>
                  <h3 className={css.sectionTitle}>
                    <FormattedMessage id="BulkImportPage.errorsTitle" />
                  </h3>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableRow" />
                        </th>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableTitle" />
                        </th>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableError" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobData.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td>{err.row}</td>
                          <td>{err.title}</td>
                          <td className={css.errorCell}>
                            <div>{err.error}</div>
                            {err.sdkErrors && err.sdkErrors.length > 0 && (
                              <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '11px', opacity: 0.8 }}>
                                {err.sdkErrors.map((e, i) => (
                                  <li key={i}>{e.code}: {e.title}{e.source ? ` (${JSON.stringify(e.source)})` : ''}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {jobData.errorsWereCapped && (
                    <p className={css.errorsCappedNotice}>
                      <FormattedMessage id="BulkImportPage.errorsCapped" />
                    </p>
                  )}
                </div>
              )}

              {/* Results table */}
              {jobData.results.length > 0 && (
                <div className={css.resultsSection}>
                  <h3 className={css.sectionTitle}>
                    <FormattedMessage id="BulkImportPage.resultsTitle" />
                  </h3>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableRow" />
                        </th>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableTitle" />
                        </th>
                        <th>
                          <FormattedMessage id="BulkImportPage.tableStatus" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobData.results.map((result, idx) => (
                        <tr key={idx}>
                          <td>{result.row}</td>
                          <td>{result.title}</td>
                          <td className={css.successCell}>{result.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reset button */}
              {status === STATUS_COMPLETED && (
                <button className={css.resetButton} onClick={handleReset}>
                  <FormattedMessage id="BulkImportPage.newImport" />
                </button>
              )}
            </div>
          )}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => ({
  scrollingDisabled: isScrollingDisabled(state),
});

const BulkImportPage = compose(connect(mapStateToProps))(BulkImportPageComponent);

export default BulkImportPage;
