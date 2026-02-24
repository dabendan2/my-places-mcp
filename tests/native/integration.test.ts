import { describe, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlaceService } from '../../dist/core/place-service.js';

describe('PlaceService Integration (Node Native Test)', () => {
  let service: PlaceService;

  before(() => {
    service = new PlaceService();
  });

  it('list_all_collections should return valid data', async () => {
    const result = await service.listAllCollections();
    
    if (result.isError) {
      const errorText = result.content[0].text;
      const skipKeywords = [
        "BROWSER_CONNECTION_FAILED",
        "AUTH_REQUIRED",
        "BROWSER_NO_ACTIVE_TABS",
        "SIDEBAR_NOT_FOUND",
        "gateway timeout",
        "CLI_EXECUTION_FAILED"
      ];

      if (skipKeywords.some(kw => errorText.includes(kw))) {
        console.warn(`[Skipped Native Integration] Pre-condition not met: ${errorText}`);
        return;
      }
      throw new Error(`Integration test failed with unexpected error: ${errorText}`);
    }

    const collections = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(collections), 'Collections should be an array');
    assert.ok(collections.length > 0, 'Should find at least one collection');

    const validTypes = ["want_to_go", "starred", "favorites", "custom"];
    collections.forEach((item) => {
      assert.ok(item.name && item.name.trim().length > 0, 'Item should have a valid name');
      assert.ok(validTypes.includes(item.type), `Invalid type: ${item.type}`);
      assert.ok(typeof item.count === 'number', 'Count should be a number');
    });

    console.log(`[Success Native Integration] Found ${collections.length} collections.`);
  });

  it('get_places_from_collection should return places from a non-empty list', async () => {
    const listResult = await service.listAllCollections();
    if (listResult.isError) {
        console.warn("[Skipped Native Integration] listAllCollections failed, skipping getPlaces.");
        return;
    }
    const collections = JSON.parse(listResult.content[0].text);
    // 尋找一個標準清單 (want_to_go, starred, favorites) 或是第一個清單
    const standardTypes = ["want_to_go", "starred", "favorites"];
    const target = collections.find(c => standardTypes.includes(c.type) && (c.count > 0 || c.count === -1)) || collections[0];

    if (!target) {
      console.warn("[Skipped Native Integration] No valid collection found to test getPlaces.");
      return;
    }

    console.log(`[Native Integration] Testing getPlacesFromCollection with: "${target.name}"`);
    const result = await service.getPlacesFromCollection(target.name);
    
    if (result.isError) {
      const errorText = result.content[0].text;
      if (errorText.includes("gateway timeout")) {
          console.warn("[Skipped Native Integration] Gateway timeout during getPlaces.");
          return;
      }
      throw new Error(`getPlaces failed: ${errorText}`);
    }

    const places = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(places), 'Places should be an array');
    
    if (places.length > 0) {
      places.forEach(place => {
        assert.ok(place.name && place.name.trim().length > 0, 'Place should have a name');
        assert.ok(place.url && place.url.startsWith('https://www.google.com/maps/'), 'Place should have a valid Maps URL');
      });
    }

    console.log(`[Success Native Integration] Found ${places.length} places in "${target.name}".`);
  });
});
