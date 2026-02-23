import { describe, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlaceService } from '../dist/core/place-service.js';

describe('PlaceService Integration (Node Native Test)', () => {
  let service: PlaceService;

  before(() => {
    service = new PlaceService();
  });

  it('listAllCollections should return collections with valid structure', async () => {
    const result = await service.listAllCollections();
    
    if (result.isError) {
      const errorText = result.content[0].text;
      const skipKeywords = ["AUTH_REQUIRED"];
      if (skipKeywords.some(kw => errorText.includes(kw))) {
        console.warn(`[Skipped] Pre-condition not met: ${errorText}`);
        return;
      }
      throw new Error(`Integration failed: ${errorText}`);
    }

    const collections = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(collections), 'Result should be an array');
    assert.ok(collections.length > 0, 'Should find at least one collection');
    console.log(`[Success] Found ${collections.length} collections.`);
  });

  it('getPlacesFromCollection should return places for a specific list', async () => {
    // 試圖抓取「想去的地點」或第一個可用的清單
    const listResult = await service.listAllCollections();
    if (listResult.isError) return;
    
    const collections = JSON.parse(listResult.content[0].text);
    const targetName = collections.find(c => c.name.includes('想去'))?.name || collections[0].name;
    
    console.log(`Testing getPlacesFromCollection with target: ${targetName}`);
    const result = await service.getPlacesFromCollection(targetName);
    
    if (result.isError) {
      throw new Error(`getPlaces failed: ${result.content[0].text}`);
    }

    const places = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(places), 'Places should be an array');
    if (places.length > 0) {
      assert.ok(places[0].name, 'Place should have a name');
      assert.ok(places[0].url, 'Place should have a URL');
    }
    console.log(`[Success] Found ${places.length} places in list "${targetName}".`);
  });
});
