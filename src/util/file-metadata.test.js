import { getFileMetadata } from './file-metadata';
import exifr from 'exifr';
import { waitFor } from '@testing-library/react';

jest.mock('exifr');

describe('getFileMetadata', () => {
  it('should call onLoad with metadata width, height, and keywords', async () => {
    const file = new File([''], 'test.jpg');
    const onLoad = jest.fn();

    const metadata = {
      ExifImageWidth: 100,
      ExifImageHeight: 200,
      Keywords: ['test', 'image'],
    };

    exifr.parse.mockResolvedValue(metadata);

    await getFileMetadata(file, onLoad);

    expect(onLoad).toHaveBeenCalledWith({
      width: 100,
      height: 200,
      keywords: ['test', 'image'],
    });
  });

  it('should call getFileResolution if exifr.parse fails', async () => {
    const file = new File([''], 'test.jpg');
    const onLoad = jest.fn();

    exifr.parse.mockRejectedValue(new Error('Error reading metadata'));

    // Mocking Image object
    global.URL.createObjectURL = jest.fn(() => 'test-url');
    global.URL.revokeObjectURL = jest.fn();

    global.Image = class {
      constructor() {
        setTimeout(() => {
          window.setTimeout(this.onload, 10); // Trigger the load event after creation
        }, 0);
      }

      set src(value) {
        this.width = 300;
        this.height = 400;
      }
    };

    await getFileMetadata(file, onLoad);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith({
        width: 300,
        height: 400,
      });
    });
  });
});

describe('readMetadata', () => {
  it('should correctly handle alternative metadata tags', async () => {
    const file = new File([''], 'test.jpg');
    const onLoad = jest.fn();

    const metadata = {
      Width: 300,
      Height: 400,
      'dc:subject': ['keyword1', 'keyword2'],
    };

    exifr.parse.mockResolvedValue(metadata);

    await getFileMetadata(file, onLoad);

    expect(onLoad).toHaveBeenCalledWith({
      width: 300,
      height: 400,
      keywords: ['keyword1', 'keyword2'],
    });
  });
});
