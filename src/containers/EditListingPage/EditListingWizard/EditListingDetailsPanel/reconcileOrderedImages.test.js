import { reconcileOrderedImages } from './reconcileOrderedImages';

const img = (id, extra = {}) => ({ id: { uuid: id }, ...extra });

describe('reconcileOrderedImages', () => {
  it('preserves the user-supplied order when nothing changed', () => {
    const prev = [img('b'), img('a'), img('c')];
    const next = [img('a'), img('b'), img('c')];
    expect(reconcileOrderedImages(prev, next).map(i => i.id.uuid)).toEqual(['b', 'a', 'c']);
  });

  it('drops removed images', () => {
    const prev = [img('b'), img('a'), img('c')];
    const next = [img('a'), img('c')];
    expect(reconcileOrderedImages(prev, next).map(i => i.id.uuid)).toEqual(['a', 'c']);
  });

  it('appends new images at the end', () => {
    const prev = [img('b'), img('a')];
    const next = [img('a'), img('b'), img('c'), img('d')];
    expect(reconcileOrderedImages(prev, next).map(i => i.id.uuid)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('refreshes preserved objects from the latest props (post-upload id resolution)', () => {
    const prev = [img('a', { uploading: true })];
    const next = [img('a', { uploading: false, url: 'https://x' })];
    const result = reconcileOrderedImages(prev, next);
    expect(result[0].uploading).toBe(false);
    expect(result[0].url).toBe('https://x');
  });

  it('handles raw id (non-uuid) shape', () => {
    const raw = id => ({ id });
    const prev = [raw('b'), raw('a')];
    const next = [raw('a'), raw('b'), raw('c')];
    expect(reconcileOrderedImages(prev, next).map(i => i.id)).toEqual(['b', 'a', 'c']);
  });
});
