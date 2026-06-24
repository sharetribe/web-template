import React, { useState, useEffect, useRef, useCallback } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, H2 } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BulkImportPage.module.css';

const STATUS_IDLE = 'idle';
const STATUS_UPLOADING = 'uploading';
const STATUS_PROCESSING = 'processing';
const STATUS_COMPLETED = 'completed';
const STATUS_ERROR = 'error';

// WhatsApp support contact (E.164 without "+"): +52 55 3131 4247
const WHATSAPP_URL = 'https://wa.me/525531314247';

// --- Inline icons (currentColor) -------------------------------------------
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Spreadsheet / CSV file: a document with a small data grid.
const TemplateIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M13 2.5v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="8" y="11.5" width="8" height="6.5" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 14.75h8M11.6 11.5v6.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

// Image file: a document with a sun + mountains thumbnail.
const PhotoIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M13 2.5v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="9.6" cy="13" r="1.15" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M7.5 18.2 11 14.7l1.7 1.7 1.9-2.2 2.2 2.6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ZIP file: a document with zipper teeth and a pull tab.
const ZipIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M13 2.5v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M11 11h2M11 12.5h2M11 14h2M11 15.5h2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <rect
      x="10.5"
      y="16.7"
      width="3"
      height="3.1"
      rx="0.8"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="m9 12 2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 7v5l3 2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BulkImportPageComponent = props => {
  const { scrollingDisabled } = props;
  const intl = useIntl();

  const [actionToken, setActionToken] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  const requestActionToken = useCallback(async () => {
    const res = await fetch('/api/bulk-import/authorize', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Bulk import authorization failed.');
    }

    setActionToken(data.token);
    return data.token;
  }, []);

  // Poll for job status
  useEffect(() => {
    if (status !== STATUS_PROCESSING || !jobId || !actionToken) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/bulk-import/status/${jobId}`, {
          credentials: 'include',
          headers: { 'X-Bulk-Import-Token': actionToken },
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
  }, [status, jobId, actionToken]);

  const handleSubmit = async e => {
    e.preventDefault();
    setUploadError(null);
    setJobData(null);

    if (!zipFile) {
      setUploadError(intl.formatMessage({ id: 'BulkImportPage.errorNoZip' }));
      return;
    }

    setStatus(STATUS_UPLOADING);

    const formData = new FormData();
    formData.append('zipFile', zipFile);

    try {
      const token = await requestActionToken();
      const res = await fetch('/api/bulk-import/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Bulk-Import-Token': token },
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

  const pickFile = file => {
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      setZipFile(file);
    } else if (file) {
      setUploadError(intl.formatMessage({ id: 'BulkImportPage.errorNoZip' }));
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    pickFile(file);
  };

  const templateDownloadUrl = '/static/files/PLANTILLA_CARGA_MASIVA.csv';

  const progressPercent =
    jobData && jobData.total > 0 ? Math.round((jobData.processed / jobData.total) * 100) : 0;

  const title = intl.formatMessage({ id: 'BulkImportPage.title' });

  const showUploadView = status === STATUS_IDLE || status === STATUS_ERROR;

  // Sidebar with the three "before uploading" steps.
  const sidebar = (
    <aside className={css.sidebar}>
      <H2 as="h1" className={css.pageTitle}>
        <FormattedMessage id="BulkImportPage.heading" />
      </H2>
      <p className={css.pageSubtitle}>
        <FormattedMessage id="BulkImportPage.description" />
      </p>

      <a href={templateDownloadUrl} className={css.templateButton} download>
        <DownloadIcon />
        <FormattedMessage id="BulkImportPage.downloadTemplate" />
      </a>

      <h2 className={css.stepsTitle}>
        <FormattedMessage id="BulkImportPage.stepsTitle" />
      </h2>

      <ol className={css.steps}>
        {[
          { n: 1, icon: <TemplateIcon />, title: 'step1Title', text: 'step1Text' },
          { n: 2, icon: <PhotoIcon />, title: 'step2Title', text: 'step2Text' },
          { n: 3, icon: <ZipIcon />, title: 'step3Title', text: 'step3Text' },
        ].map(step => (
          <li key={step.n} className={css.step}>
            <div className={css.stepTile}>
              <span className={css.stepNum}>{step.n}</span>
              {step.icon}
            </div>
            <div className={css.stepBody}>
              <h4 className={css.stepTitle}>
                <FormattedMessage id={`BulkImportPage.${step.title}`} />
              </h4>
              <p className={css.stepText}>
                <FormattedMessage id={`BulkImportPage.${step.text}`} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );

  // Right-hand upload column (dropzone + confirm).
  const uploadColumn = (
    <section className={css.main}>
      <form className={css.uploadForm} onSubmit={handleSubmit}>
        <div
          className={isDragging ? `${css.dropzone} ${css.dropzoneActive}` : css.dropzone}
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className={css.dropIcon}>
            <ZipIcon size={56} />
          </div>
          <h2 className={css.dropTitle}>
            <FormattedMessage id="BulkImportPage.dropzoneTitle" />
          </h2>
          <p className={css.dropSubtitle}>
            <FormattedMessage id="BulkImportPage.dropzoneSubtitle" />
          </p>

          <button
            type="button"
            className={css.selectButton}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <FormattedMessage id="BulkImportPage.selectZip" />
          </button>

          <div className={css.divider}>
            <span className={css.dividerLabel}>
              <FormattedMessage id="BulkImportPage.dividerOr" />
            </span>
          </div>

          <p className={zipFile ? css.fileSelected : css.fileEmpty}>
            {zipFile ? (
              <FormattedMessage id="BulkImportPage.zipSelected" values={{ name: zipFile.name }} />
            ) : (
              <FormattedMessage id="BulkImportPage.noFileSelected" />
            )}
          </p>

          {/* Accessible file input — visually hidden; triggered by the button/drop. */}
          <label htmlFor="zipFile" className={css.visuallyHidden}>
            <FormattedMessage id="BulkImportPage.zipLabel" />
          </label>
          <input
            id="zipFile"
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className={css.visuallyHidden}
            onChange={e => pickFile(e.target.files[0] || null)}
          />
        </div>

        <div className={css.reviewNotice}>
          <span className={css.reviewIcon}>
            <ShieldIcon />
          </span>
          <p className={css.reviewText}>
            <FormattedMessage id="BulkImportPage.reviewNotice" />
          </p>
        </div>

        <button type="submit" className={css.submitButton}>
          <FormattedMessage id="BulkImportPage.startImport" />
        </button>

        {uploadError && (
          <div className={css.errorBox}>
            <pre className={css.errorText}>{uploadError}</pre>
          </div>
        )}

        <p className={css.constraints}>
          <ClockIcon />
          <FormattedMessage id="BulkImportPage.zipHelp" />
        </p>
      </form>
    </section>
  );

  // Bottom "need help?" bar.
  const helpBar = (
    <div className={css.helpBar}>
      <span className={css.helpTitle}>
        <FormattedMessage id="BulkImportPage.helpTitle" />
      </span>
      <span className={css.helpDivider} aria-hidden="true" />

      <div className={css.helpLinks}>
        <a href="/static/files/ZIP_CARGA_MASIVA.zip" className={css.helpItem} download>
          <span className={css.helpIcon}>
            <FolderIcon />
          </span>
          <span className={css.helpItemBody}>
            <span className={css.helpItemTitle}>
              <FormattedMessage id="BulkImportPage.exampleZipTitle" />
            </span>
            <span className={css.helpItemText}>
              <FormattedMessage id="BulkImportPage.exampleZipText" />
            </span>
          </span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${css.helpItem} ${css.helpItemWhatsapp}`}
        >
          <span className={css.helpIcon}>
            <FolderIcon />
          </span>
          <span className={css.helpItemBody}>
            <span className={css.helpItemTitle}>
              <FormattedMessage id="BulkImportPage.whatsappContact" />
            </span>
          </span>
        </a>
      </div>
    </div>
  );

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          {showUploadView ? (
            <>
              <div className={css.layout}>
                {sidebar}
                {uploadColumn}
              </div>
              {helpBar}
            </>
          ) : (
            <div className={css.progressWrap}>
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
                      <FormattedMessage
                        id="BulkImportPage.failed"
                        values={{ count: jobData.failed }}
                      />
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
                                  <ul
                                    style={{
                                      margin: '4px 0 0',
                                      paddingLeft: '16px',
                                      fontSize: '11px',
                                      opacity: 0.8,
                                    }}
                                  >
                                    {err.sdkErrors.map((e, i) => (
                                      <li key={i}>
                                        {e.code}: {e.title}
                                        {e.source ? ` (${JSON.stringify(e.source)})` : ''}
                                      </li>
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
