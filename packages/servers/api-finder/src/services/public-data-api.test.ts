import { describe, expect, it } from "vitest";
import {
  extractSwaggerSpecReference,
  parseSearchResults,
  resolvePublicDataUrl
} from "./public-data-api.js";

describe("public-data-api service", () => {
  it("parses public data search results", () => {
    const parsed = parseSearchResults({
      result: {
        data: [
          {
            dataName: "기상청_단기예보 조회서비스",
            dataDescription: "동네예보 정보 조회",
            dataType: "REST",
            extension: "JSON",
            organization: "기상청",
            detailPageUrl: "https://www.data.go.kr/data/15084084/openapi.do"
          }
        ]
      }
    });

    expect(parsed[0]).toEqual({
      name: "기상청_단기예보 조회서비스",
      description: "동네예보 정보 조회",
      dataType: "REST",
      extension: "JSON",
      provider: "기상청",
      url: "https://www.data.go.kr/data/15084084/openapi.do",
      api_id: "15084084/openapi.do"
    });
  });

  it("extracts inline swagger json", () => {
    const reference = extractSwaggerSpecReference(
      'var swaggerJson = {"openapi":"3.0.0"};'
    );
    expect(reference).toEqual({
      type: "json",
      value: { openapi: "3.0.0" }
    });
  });

  it("resolves relative public data URLs against data.go.kr", () => {
    expect(resolvePublicDataUrl("/file/download.do?id=1")).toBe(
      "https://www.data.go.kr/file/download.do?id=1"
    );
    expect(resolvePublicDataUrl("https://example.com/openapi.json")).toBe(
      "https://example.com/openapi.json"
    );
  });
});
