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
    // @ts-ignore
    wrapper.browser = {};
    // @ts-ignore
    wrapper.page = {
      isClosed: () => false,
      url: () => 'https://www.google.com/maps/save',
      waitForSelector: () => Promise.resolve(),
      click: () => Promise.resolve(),
      evaluate: (fn: any) => {
        return Promise.resolve([
          {
            name: '首里城',
            url: '...',
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
  });
});
