import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";

interface GetPublicDataAPIDetailsInput {
  api_id: string;
}

class GetPublicDataAPIDetailsTool extends MCPTool<GetPublicDataAPIDetailsInput> {
  name = "getPublicDataAPIDetails";
  description = "API의 고유 ID를 사용하여 해당 공공데이터 API의 상세 명세(Request/Response 파라미터, 데이터 포맷, 예시 등)를 조회합니다. 사용자가 API 목록에서 특정 항목을 선택했을 때 사용됩니다.";

  schema = {
    api_id: {
      type: z.string(),
      description: "상세 정보를 조회할 API의 고유 식별자입니다. (예: '15083227/v1/uddi:b4856f34-b413-48d8-8ed6-5b7253d8187d')",
    },
  };

  async execute(input: GetPublicDataAPIDetailsInput) {
    const detailPageUrl = `https://www.data.go.kr/data/${input.api_id}/openapi.do`;
    console.log(`Fetching API details from: ${detailPageUrl}`);

    try {
      const response = await axios.get(detailPageUrl, {
        headers: {
          // data.go.kr에서 차단을 피하기 위해 User-Agent 설정
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
        }
      });
      const htmlContent: string = response.data;

      // 1. 'var swaggerJson = {...};' 패턴에서 JSON 객체 직접 추출
      const jsonRegex = /var swaggerJson = (\{.*?\});/s;
      const jsonMatch = htmlContent.match(jsonRegex);

      if (jsonMatch && jsonMatch[1]) {
        try {
          const swaggerSpec = JSON.parse(jsonMatch[1]);
          console.log("Successfully extracted swaggerJson from the page.");
          return JSON.stringify(swaggerSpec, null, 2);
        } catch (e) {
          console.error("Failed to parse swaggerJson.", e);
          throw new Error("Found swaggerJson but failed to parse it.");
        }
      }

      // 2. 'var swaggerUrl = "..."' 패턴에서 URL 추출 후 다시 요청
      const urlRegex = /var swaggerUrl = ['"](.*?)['"];/;
      let urlMatch = htmlContent.match(urlRegex);

      // 3. 'url: '...' 패턴 (SwaggerUIBundle 내부)
      if (!urlMatch) {
        const bundleRegex = /SwaggerUIBundle\(\{[\s\S]*?url: ['"](.*?)['"]/;
        urlMatch = htmlContent.match(bundleRegex);
      }

      if (urlMatch && urlMatch[1]) {
        const swaggerUrl = urlMatch[1];
        console.log(`Found swagger URL: ${swaggerUrl}. Fetching spec...`);
        try {
          const specResponse = await axios.get(swaggerUrl);
          console.log("Successfully fetched Swagger spec from URL.");
          return JSON.stringify(specResponse.data, null, 2);
        } catch (e: any) {
          console.error(`Failed to fetch Swagger spec from URL: ${swaggerUrl}`, e.message);
          throw new Error(`Failed to fetch Swagger spec from ${swaggerUrl}`);
        }
      }

      // 4. 모든 패턴이 실패한 경우
      console.log("Could not find swaggerJson or any valid swagger URL on the page.");
      throw new Error("Could not find Swagger/OpenAPI specification on the detail page.");

    } catch (error: any) {
      console.error(`Error fetching or processing API details for ${input.api_id}:`, error.message);
      throw new Error(`Failed to retrieve or parse API details for ID ${input.api_id}.`);
    }
  }
}

export default GetPublicDataAPIDetailsTool;
