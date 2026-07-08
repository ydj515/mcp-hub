import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";

interface SearchPublicDataAPIInput {
  service_description: string;
  keywords: string[];
}

class SearchPublicDataAPITool extends MCPTool<SearchPublicDataAPIInput> {
  name = "searchPublicDataAPI";
  description =
    "사용자가 만들고 싶어하는 서비스나 애플리케이션에 대한 설명을 바탕으로, 한국 공공데이터 포털(data.go.kr)에서 가장 적합한 API를 검색하고 추천합니다. API의 이름, 주요 기능, 그리고 활용 신청에 필요한 기본 명세 정보를 반환합니다.";

  schema = {
    service_description: {
      type: z.string(),
      description:
        "사용자가 만들고 싶어하는 서비스나 앱에 대한 자연어 설명입니다. (예: '오늘과 내일의 날씨를 알려주는 앱', '전국 미세먼지 농도를 지도에 표시해주는 서비스')"
    },
    keywords: {
      type: z.array(z.string()),
      description:
        "서비스 설명에서 추출한 핵심 키워드입니다. 검색 정확도를 높이기 위해 사용됩니다. (예: ['날씨', '기상', '예보', '미세먼지'])"
    }
  };

  async execute(input: SearchPublicDataAPIInput) {
    console.log(
      `Searching for APIs with description: "${
        input.service_description
      }" and keywords: [${input.keywords.join(", ")}]`
    );

    const apiKey =
      process.env.PUBLIC_DATA_API_KEY ||
      `api key published by data.go.kr`;

    if (!apiKey) {
      throw new Error(
        "PUBLIC_DATA_API_KEY is not set in environment variables."
      );
    }

    try {
      const response = await axios.post(
        "https://api.odcloud.kr/api/GetSearchDataList/v1/searchData",
        {
          keyword: input.keywords.join(" "),
          page: 1,
          size: 10
        },
        {
          params: {
            serviceKey: apiKey
          },
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const result = response.data?.result;
      const apiList = result?.data;

      if (Array.isArray(apiList) && apiList.length > 0) {
        const parsedList = apiList.map((api: any) => ({
          name: api.dataName || "(이름 없음)",
          description: api.dataDescription || "(설명 없음)",
          dataType: api.dataType || "(알수 없음)",
          extension: api.extension || "(미제공)",
          provider: api.organization || "(제공기관 없음)",
          url: api.detailPageUrl || "(링크 없음)",
          api_id: api.detailPageUrl || "(ID 없음)"
        }));

        return JSON.stringify(parsedList, null, 2);
      } else {
        console.log(
          "No data found in result:",
          JSON.stringify(result, null, 2)
        );
        return "No relevant APIs found.";
      }
    } catch (error: any) {
      console.error(
        "Error calling Public Data API:",
        error?.response?.data || error.message
      );
      throw new Error("Failed to fetch data from the public API.");
    }
  }
}

export default SearchPublicDataAPITool;
