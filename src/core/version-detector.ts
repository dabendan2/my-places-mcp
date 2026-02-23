export enum MapsVersion {
  A = "A",
  B = "B",
  UNKNOWN = "UNKNOWN"
}

export class VersionDetector {
  static detect(document: any): MapsVersion {
    if (document.querySelector('div[role="main"]')) {
      return MapsVersion.A;
    }
    
    // Version B 特徵: 容器為 m6QErb 且包含特定的組合類別
    const containers = Array.from(document.querySelectorAll('div.m6QErb'));
    const isVersionB = containers.some((c: any) => 
       c.className && c.className.includes('WNBkOb') && c.className.includes('XiKgde')
    );
    
    if (isVersionB) {
      return MapsVersion.B;
    }

    return MapsVersion.UNKNOWN;
  }
}
