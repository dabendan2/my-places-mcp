import { LIST_COLLECTIONS_TEMPLATE, GET_PLACES_TEMPLATE } from "./script-templates.js";

export interface Collection {
  id: string;
  name: string;
  count: number;
  visibility: string;
}

export interface Place {
  name: string;
  url: string;
  status: string;
  category: string;
  note: string;
}

/**
 * GoogleMapsWrapper (OpenClaw Refactored Edition)
 * 使用模板化腳本與規範化錯誤代碼。
 */
export class GoogleMapsWrapper {
  get navigationUrl() {
    return "https://www.google.com/maps/";
  }

  get listCollectionsScript() {
    return LIST_COLLECTIONS_TEMPLATE;
  }

  getPlacesScript(collectionId: string) {
    return GET_PLACES_TEMPLATE(collectionId);
  }
}
