import axios from "axios";

export type PublicDataSearchResult = {
  name: string;
  description: string;
  dataType: string;
  extension: string;
  provider: string;
  url: string;
  api_id: string;
};

export type SwaggerReference =
  | { type: "json"; value: unknown }
  | { type: "url"; value: string };

const detailPathFromUrl = (url: string) => {
  const match = url.match(/data\/(.+)$/);
  return match?.[1] ?? url;
};

export const parseSearchResults = (
  body: unknown
): PublicDataSearchResult[] => {
  const data = (body as { result?: { data?: unknown[] } }).result?.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((api) => {
    const item = api as Record<string, string | undefined>;
    const url = item.detailPageUrl || "(링크 없음)";
    return {
      name: item.dataName || "(이름 없음)",
      description: item.dataDescription || "(설명 없음)",
      dataType: item.dataType || "(알수 없음)",
      extension: item.extension || "(미제공)",
      provider: item.organization || "(제공기관 없음)",
      url,
      api_id: detailPathFromUrl(url)
    };
  });
};

export const extractSwaggerSpecReference = (
  htmlContent: string
): SwaggerReference => {
  const jsonMatch = htmlContent.match(/var swaggerJson = (\{.*?\});/s);
  if (jsonMatch?.[1]) {
    return {
      type: "json",
      value: JSON.parse(jsonMatch[1])
    };
  }

  const urlMatch =
    htmlContent.match(/var swaggerUrl = ['"](.*?)['"];/) ??
    htmlContent.match(/SwaggerUIBundle\(\{[\s\S]*?url: ['"](.*?)['"]/);

  if (urlMatch?.[1]) {
    return {
      type: "url",
      value: urlMatch[1]
    };
  }

  throw new Error(
    "Could not find Swagger/OpenAPI specification on the detail page."
  );
};

export const searchPublicDataApis = async (params: {
  apiKey: string;
  keywords: string[];
}) => {
  const response = await axios.post(
    "https://api.odcloud.kr/api/GetSearchDataList/v1/searchData",
    {
      keyword: params.keywords.join(" "),
      page: 1,
      size: 10
    },
    {
      params: { serviceKey: params.apiKey },
      headers: { "Content-Type": "application/json" }
    }
  );

  return parseSearchResults(response.data);
};

export const getPublicDataApiDetails = async (apiId: string) => {
  const detailPageUrl = `https://www.data.go.kr/data/${apiId}`;
  const response = await axios.get(detailPageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
    }
  });
  const reference = extractSwaggerSpecReference(String(response.data));

  if (reference.type === "json") {
    return reference.value;
  }

  const specResponse = await axios.get(reference.value);
  return specResponse.data;
};
