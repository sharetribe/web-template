import { readFileMetadataAsync } from './file-metadata';
import exifr from 'exifr';
import { waitFor } from '@testing-library/react';

jest.mock('exifr');

describe('readFileMetadataAsync', () => {
  it('should return metadata with width, height, and keywords', async () => {
    const file = new File([''], 'test.jpg');

    const metadata = {
      ExifImageWidth: 100,
      ExifImageHeight: 200,
      Keywords: ['test', 'image'],
    };

    exifr.parse.mockResolvedValue(metadata);

    const result = await readFileMetadataAsync({ data: file, type: 'image/jpeg', isRemote: false });

    expect(result).toEqual({
      width: 100,
      height: 200,
      keywords: ['test', 'image'],
    });
  });

  it('should use getImageResolution if exifr.parse fails', async () => {
    const file = new File([''], 'test.jpg');

    exifr.parse.mockRejectedValue(new Error('Error reading metadata'));

    // Mocking Image object
    global.URL.createObjectURL = jest.fn(() => 'test-url');
    global.URL.revokeObjectURL = jest.fn();

    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onload();
        }, 10); // Trigger the load event after creation
      }

      set src(value) {
        this.width = 300;
        this.height = 400;
      }
    };

    const result = await readFileMetadataAsync({ data: file, type: 'image/jpeg', isRemote: false });

    expect(result).toEqual({
      width: 300,
      height: 400,
      keywords: '',
    });
  });
});

describe('readFileMetadataAsync with alternative metadata tags', () => {
  it('should correctly handle alternative metadata tags', async () => {
    const file = new File([''], 'test.jpg');

    const metadata = {
      Width: 300,
      Height: 400,
      'dc:subject': ['keyword1', 'keyword2'],
    };

    exifr.parse.mockResolvedValue(metadata);

    const result = await readFileMetadataAsync({ data: file, type: 'image/jpeg', isRemote: false });

    expect(result).toEqual({
      width: 300,
      height: 400,
      keywords: ['keyword1', 'keyword2'],
    });
  });
});

describe('readFileMetadataAsync for remote files', () => {
  it('should resolve metadata for remote files', async () => {
    const file = {
      isRemote: true,
      source: 'Url',
      remote: {
        body: {
          url: 'http://example.com/image.jpg',
        },
      },
    };

    // Mocking Image object
    global.URL.createObjectURL = jest.fn(() => 'test-url');
    global.URL.revokeObjectURL = jest.fn();

    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onload();
        }, 10); // Trigger the load event after creation
      }

      set src(value) {
        this.width = 500;
        this.height = 600;
      }
    };

    const result = await readFileMetadataAsync(file);

    expect(result).toEqual({
      width: 500,
      height: 600,
    });
  });
});
