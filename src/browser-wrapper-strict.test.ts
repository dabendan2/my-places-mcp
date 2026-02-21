import { GoogleMapsWrapper } from '../src/browser-wrapper.js';

describe('GoogleMapsWrapper Strict Error Handling (TDD)', () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test('should throw ID_EXTRACTION_FAILED in listCollections if data-list-id is missing', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      evaluate: (fn: any) => {
        if (typeof fn === 'function' && fn.toString().includes('window.location.href')) return Promise.resolve('url');
        return Promise.resolve([{ id: null, name: 'Test List', visibility: '私人', count: 10 }]);
      }
    };
    await expect(wrapper.listCollections()).rejects.toThrow('ID_EXTRACTION_FAILED');
  });

  test('should throw STATUS_PARSE_FAILED if status cannot be determined', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      click: () => Promise.resolve(),
      evaluate: (fn: any, args?: any) => {
        const fnStr = fn.toString();
        if (fnStr.includes('window.location.href')) return Promise.resolve('url');
        if (fnStr.includes('match(/·(\\d+) 個地點/)')) return Promise.resolve(1);
        return Promise.resolve([{ name: 'Place', url: '', status: null, category: 'Food', note: '' }]);
      }
    };
    await expect(wrapper.getPlaces('any-id')).rejects.toThrow('STATUS_PARSE_FAILED');
  });

  test('should throw CATEGORY_PARSE_FAILED if category cannot be determined', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      click: () => Promise.resolve(),
      evaluate: (fn: any, args?: any) => {
        const fnStr = fn.toString();
        if (fnStr.includes('window.location.href')) return Promise.resolve('url');
        if (fnStr.includes('match(/·(\\d+) 個地點/)')) return Promise.resolve(1);
        return Promise.resolve([{ name: 'Place', url: '', status: 'Open', category: null, note: '' }]);
      }
    };
    await expect(wrapper.getPlaces('any-id')).rejects.toThrow('CATEGORY_PARSE_FAILED');
  });

  test('should throw COLLECTION_NOT_FOUND if getPlacesCount targets an invalid ID', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      evaluate: (fn: any) => {
        if (typeof fn === 'function' && fn.toString().includes('window.location.href')) return Promise.resolve('url');
        return Promise.reject(new Error('COLLECTION_NOT_FOUND'));
      }
    };
    await expect(wrapper.getPlacesCount('invalid-id')).rejects.toThrow('COLLECTION_NOT_FOUND');
  });
});
