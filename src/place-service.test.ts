import { PlaceService } from "./place-service.js";
import { execSync } from "child_process";

jest.mock("child_process");

describe("PlaceService (Native CLI)", () => {
  let service: PlaceService;

  beforeEach(() => {
    service = new PlaceService();
    jest.clearAllMocks();
  });

  test("listAllCollections should execute CLI and return parsed JSON result", async () => {
    const mockOutput = JSON.stringify({
      ok: true,
      result: [
        { name: "想去的地點", type: "want_to_go", count: 10, visibility: "私人" }
      ]
    });
    
    (execSync as jest.Mock).mockReturnValue(mockOutput);

    const result = await service.listAllCollections();
    expect(result.content[0].text).toContain("想去的地點");
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining("openclaw browser act"), expect.anything());
  });

  test("getPlacesFromCollection should throw NAVIGATING error when script returns it", async () => {
    const mockOutput = JSON.stringify({
      ok: true,
      result: "NAVIGATING"
    });
    
    (execSync as jest.Mock).mockReturnValue(mockOutput);

    await expect(service.getPlacesFromCollection("Any")).rejects.toThrow("NAVIGATING");
  });
});
