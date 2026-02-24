import { jest } from "@jest/globals";
import { VersionDetector, MapsVersion } from "../src/core/version-detector.js";

describe("VersionDetector (Strict Mode)", () => {
  const mockDoc = (selectors: Record<string, any>) => ({
    querySelector: (s: string) => selectors[s] || null,
    querySelectorAll: (s: string) => {
      const val = selectors[s];
      return Array.isArray(val) ? val : (val ? [val] : []);
    }
  });

  test("should detect Version A when role='main' exists", () => {
    const doc = mockDoc({ 'div[role="main"]': {} });
    expect(VersionDetector.detect(doc)).toBe(MapsVersion.A);
  });

  test("should detect Version B when specific m6QErb classes exist", () => {
    const doc = mockDoc({ 
      'div.m6QErb': [{ className: 'm6QErb WNBkOb XiKgde' }] 
    });
    expect(VersionDetector.detect(doc)).toBe(MapsVersion.B);
  });

  test("should return UNKNOWN when neither feature is found", () => {
    const doc = mockDoc({});
    expect(VersionDetector.detect(doc)).toBe(MapsVersion.UNKNOWN);
  });
});
