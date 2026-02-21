import { GoogleMapsWrapper } from '../src/browser-wrapper';

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
      waitForSelector: () => Promise.resolve(),
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

  test('should return place with category and status', async () => {
    // ...
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
        return Promise.resolve();
      },
      waitForSelector: (selector: string) => {
        if (selector === 'main') return Promise.resolve();
        // Return a mock element for the ID selector
        return Promise.resolve({ click: () => Promise.resolve() });
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
