export interface MapsFlow {
  getListCollectionsScript(): string;
  getPlacesScript(collectionName: string): string;
}
