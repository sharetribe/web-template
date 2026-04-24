import {
  calculateFileSize,
  messageHasPendingFiles,
  messageHasFailedFiles,
  analyseFileName,
} from './fileHelpers';

const makeFile = state => ({ file: { attributes: { state } } });
const makeMessage = (...states) => ({ publicFileAttachments: states.map(makeFile) });

describe('calculateFileSize(size, locale)', () => {
  it('returns kilobyte label for a typical KB value', () => {
    expect(calculateFileSize(256 * 1024, 'en')).toEqual('256 kB');
  });

  it('rounds sub-kilobyte input up to 1 kB', () => {
    expect(calculateFileSize(512, 'en')).toEqual('1 kB');
  });

  it('uses MB branch at exactly 1 MB (>= 1 threshold)', () => {
    expect(calculateFileSize(1024 * 1024, 'en')).toEqual('1.0 MB');
  });

  it('formats a typical MB value with one decimal place', () => {
    expect(calculateFileSize(1.5 * 1024 * 1024, 'en')).toEqual('1.5 MB');
  });

  it('uses locale to format the decimal separator', () => {
    expect(calculateFileSize(1.5 * 1024 * 1024, 'de')).toContain('1,5');
  });
});

describe('messageHasPendingFiles(message)', () => {
  it('is falsy when publicFileAttachments property is absent', () => {
    expect(messageHasPendingFiles({})).toBeFalsy();
  });

  it('returns false for an empty publicFileAttachments array', () => {
    expect(messageHasPendingFiles({ publicFileAttachments: [] })).toBe(false);
  });

  it('returns false when all files are available', () => {
    expect(messageHasPendingFiles(makeMessage('available', 'available'))).toBe(false);
  });

  it('returns true when one file is pendingVerification', () => {
    expect(messageHasPendingFiles(makeMessage('available', 'pendingVerification'))).toBe(true);
  });

  it('returns true when all files are pendingVerification', () => {
    expect(messageHasPendingFiles(makeMessage('pendingVerification', 'pendingVerification'))).toBe(
      true
    );
  });
});

describe('messageHasFailedFiles(message)', () => {
  it('is falsy when publicFileAttachments property is absent', () => {
    expect(messageHasFailedFiles({})).toBeFalsy();
  });

  it('returns false for an empty publicFileAttachments array', () => {
    expect(messageHasFailedFiles({ publicFileAttachments: [] })).toBe(false);
  });

  it('returns false when all files are available', () => {
    expect(messageHasFailedFiles(makeMessage('available', 'available'))).toBe(false);
  });

  it('returns true when one file is verificationFailed', () => {
    expect(messageHasFailedFiles(makeMessage('available', 'verificationFailed'))).toBe(true);
  });

  it('returns true for a mix of verificationFailed and pendingVerification', () => {
    expect(messageHasFailedFiles(makeMessage('verificationFailed', 'pendingVerification'))).toBe(
      true
    );
  });
});

describe('analyseFileName(name)', () => {
  it('splits a standard name into base and extension', () => {
    expect(analyseFileName('document.pdf')).toEqual({ baseName: 'document', extension: '.pdf' });
  });

  it('uses the last dot for names with multiple dots', () => {
    expect(analyseFileName('my.report.final.pdf')).toEqual({
      baseName: 'my.report.final',
      extension: '.pdf',
    });
  });

  it('returns empty extension for a name with no dot', () => {
    expect(analyseFileName('README')).toEqual({ baseName: 'README', extension: '' });
  });

  it('treats a leading dot (dotfile) as part of the base name', () => {
    expect(analyseFileName('.gitignore')).toEqual({ baseName: '.gitignore', extension: '' });
  });

  it('returns the input as baseName with empty extension for null input', () => {
    expect(analyseFileName(null)).toEqual({ baseName: null, extension: '' });
  });
});
