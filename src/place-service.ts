import { GoogleMapsWrapper } from "./browser-wrapper.js";
import { ErrorCode } from "./types.js";

export class PlaceService {
  private wrapper: GoogleMapsWrapper;

  constructor() {
    this.wrapper = new GoogleMapsWrapper();
  }

  async listAllCollections() {
    return {
      content: [
        {
          type: "text" as const,
          text: `請使用 browser:act 工具執行以下腳本以獲取清單：\n\nURL: ${this.wrapper.navigationUrl}\n\nScript:\n${this.wrapper.listCollectionsScript}`,
        },
      ],
    };
  }

  async getPlacesFromCollection(collectionId: string) {
    return {
      content: [
        {
          type: "text" as const,
          text: `請在該清單頁面使用 browser:act 工具執行以下腳本：\n\nScript:\n${this.wrapper.getPlacesScript(collectionId)}`,
        },
      ],
    };
  }
}
