import { GoogleMapsWrapper } from '../src/browser-wrapper.js';

describe('GoogleMapsWrapper Reality Check', () => {
  let wrapper: GoogleMapsWrapper;

  beforeEach(() => {
    wrapper = new GoogleMapsWrapper();
  });

  test('should throw error if not initialized', async () => {
    await expect(wrapper.listCollections()).rejects.toThrow('SESSION_NOT_INITIALIZED');
  });

  test('should parse real Google Maps collection labels', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      evaluate: (fn: any) => {
        return Promise.resolve([
          {
            id: 'want-to-go-id',
            name: '想去的地點',
            visibility: '私人',
            count: 724
          }
        ]);
      }
    };

    const result = await wrapper.listCollections();
    expect(result[0].name).toBe('想去的地點');
    expect(result[0].count).toBe(724);
  });

  test('should throw DATA_INCONSISTENCY if counts do not match', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      click: () => Promise.resolve(),
      goto: () => Promise.resolve({} as any),
      evaluate: (fn: any, args?: any) => {
        const fnStr = fn.toString();
        // Mock getPlacesCount returning 10
        if (fnStr.includes('match(/·(\\d+) 個地點/)')) return Promise.resolve(10);
        // Mock getPlaces actually finding 5
        if (fnStr.includes('document.querySelectorAll(\'div[role="main"] button[aria-label]\')')) {
          return Promise.resolve(new Array(5).fill({ name: 'Place', url: '', status: '', category: '', note: '' }));
        }
        return Promise.resolve([]);
      }
    };

    await expect(wrapper.getPlaces('any-id')).rejects.toThrow('DATA_INCONSISTENCY');
  });

  test('should return places if counts match', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      click: () => Promise.resolve(),
      goto: () => Promise.resolve({} as any),
      evaluate: (fn: any, args?: any) => {
        const fnStr = fn.toString();
        if (fnStr.includes('match(/·(\\d+) 個地點/)')) return Promise.resolve(5);
        if (fnStr.includes('document.querySelectorAll(\'div[role="main"] button[aria-label]\')')) {
          return Promise.resolve(new Array(5).fill({ name: 'Place', url: '', status: '', category: '', note: '' }));
        }
        return Promise.resolve([]);
      }
    };

    const result = await wrapper.getPlaces('any-id');
    expect(result.length).toBe(5);
  });
});
