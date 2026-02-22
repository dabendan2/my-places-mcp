import { LIST_COLLECTIONS_TEMPLATE, GET_PLACES_TEMPLATE } from "./script-templates.js";
import { Collection, Place } from "./types.js";

/**
 * GoogleMapsWrapper (Name-based Indexing Edition)
 * 完全移除 data-list-id 依賴，改用名稱索引與 CSS 類型判斷。
 */
export class GoogleMapsWrapper {
  get navigationUrl() {
    return "https://www.google.com/maps/";
  }

  get listCollectionsScript() {
    return LIST_COLLECTIONS_TEMPLATE;
  }

  getPlacesScript(collectionName: string) {
    return GET_PLACES_TEMPLATE(collectionName);
  }
}
