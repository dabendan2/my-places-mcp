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

  test('should return place with category, status, and search URL', async () => {
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve({} as any),
      click: () => Promise.resolve(),
      evaluate: (fn: any) => {
        return Promise.resolve([
          {
            name: '首里城',
            url: 'https://www.google.com/maps/search/%E9%A6%96%E9%87%8C%E5%9F%8E',
            status: '營業中',
            category: '城堡',
            note: ''
          }
        ]);
      }
    };

    const result = await wrapper.getPlaces('okinawa-id');
    expect(result[0].status).toBe('營業中');
    expect(result[0].category).toBe('城堡');
    expect(result[0].url).toBe('https://www.google.com/maps/search/%E9%A6%96%E9%87%8C%E5%9F%8E');
  });

  test('should navigate to saved places if not already there in getPlaces', async () => {
    // @ts-ignore
    wrapper.browser = {};
    let navigated = false;
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://other-site.com',
      goto: (url: string) => {
        if (url.includes('google.com/maps/save')) navigated = true;
        return Promise.resolve({} as any);
      },
      waitForSelector: (selector: string) => {
        return Promise.resolve({ click: () => Promise.resolve() } as any);
      },
      click: () => Promise.resolve(),
      evaluate: (fn: any) => {
        if (typeof fn === 'function' && fn.toString().includes('window.location.href')) return Promise.resolve('https://other-site.com');
        return Promise.resolve([]);
      }
    };

    await wrapper.getPlaces('any-id');
    expect(navigated).toBe(true);
  });
});
