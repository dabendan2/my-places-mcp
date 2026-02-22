import { cleanJson, getDisplay } from "../src/utils/system.js";
import { jest } from "@jest/globals";

describe("System Utils", () => {
  describe("cleanJson", () => {
    test("should extract JSON from dirty string", () => {
      const dirty = "Warnings...\n{\n  \"ok\": true\n}\nExtra...";
      expect(JSON.parse(cleanJson(dirty))).toEqual({ ok: true });
    });

    test("should throw error if no JSON found", () => {
      expect(() => cleanJson("no json here")).toThrow("INVALID_JSON_OUTPUT");
    });

    test("should throw error if output is undefined", () => {
      expect(() => cleanJson(undefined as any)).toThrow("INVALID_JSON_OUTPUT");
    });
  });

  describe("getDisplay", () => {
    test("should parse X11 display correctly", () => {
      const mockExec = jest.fn<any>().mockReturnValue("X0  X1  X99");
      expect(getDisplay(mockExec as any)).toBe(":0");
    });

    test("should fallback to :1 if no X11 files found", () => {
      const mockExec = jest.fn<any>().mockReturnValue("");
      expect(getDisplay(mockExec as any)).toBe(":1");
    });

    test("should fallback to :1 on exec error", () => {
      const mockExec = jest.fn<any>().mockImplementation(() => { throw new Error(); });
      expect(getDisplay(mockExec as any)).toBe(":1");
    });
  });
});
