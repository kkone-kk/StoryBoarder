import { GoogleGenAI, Type } from "@google/genai";
import { Scene } from "../types";

const getClient = () => {
    return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
}

export const breakdownStory = async (storyText: string): Promise<Scene[]> => {
  try {
    const ai = getClient();
    
    const prompt = `You are a professional storyboard artist. Break down the following user research story into 3-6 distinct visual scenes for a comic strip.
    
    Return a JSON array of objects with "description" field.
    Each description should be visual, describing what is seen in the panel.
    
    Story: ${storyText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    const parsed = JSON.parse(jsonStr);
    
    // Map to Scene interface with IDs
    return parsed.map((item: any, index: number) => ({
      id: Date.now().toString() + index,
      description: item.description,
      imageUrl: undefined,
      isGenerating: false
    }));

  } catch (error: any) {
    console.error("Breakdown Error:", error);
    // Fallback logic
    const sentences = storyText.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 5);
    return sentences.slice(0, 6).map((s, i) => ({
        id: Date.now().toString() + i,
        description: s.trim()
    }));
  }
};

export const analyzeCharacterFromImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return "";

    const mimeType = matches[1];
    const data = matches[2];

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
            parts: [
                {
                    text: "Analyze this character image. Provide a comma-separated list of key visual features to maintain consistency (e.g., 'short black hair, red glasses, blue hoodie, denim jeans, white sneakers'). Focus ONLY on physical appearance and clothing. Do not mention pose or background."
                },
                {
                    inlineData: {
                        mimeType,
                        data
                    }
                }
            ]
        }
    });

    return response.text || "";
  } catch (error) {
    console.error("Character Analysis Error:", error);
    return "";
  }
};

export const generateImageFromPrompt = async (promptText: string, referenceImageBase64?: string): Promise<string> => {
  const ai = getClient();
  
  // 1. 准备基础的文字提示词
  const textPart = { text: promptText };
  
  // 2. 准备请求内容：默认是 [文字]
  let requestParts: any[] = [textPart];

  // 3. 如果有参考图，尝试把它加进去 (保留你的逻辑)
  if (referenceImageBase64) {
      const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
           requestParts.unshift({ 
              inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
              }
          });
      }
  }

  // 定义一个通用的发送请求函数
  const callGenAI = async (parts: any[]) => {
      const response = await ai.models.generateContent({
        model: 'imagen-3.0-generate-001', // 改成了专门画画的模型
        contents: { parts: parts },
        config: {
          responseMimeType: 'image/jpeg' 
        }
      });
      return response;
  };

  try {
    // 【尝试 A】：发送 (参考图 + 文字)
    const response = await callGenAI(requestParts);
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image in response");

  } catch (error: any) {
    // 【尝试 B (自动保底)】：报错则自动降级为纯文字生成
    if (referenceImageBase64) {
        console.warn("参考图生成失败，自动降级为纯文字生成...", error.message);
        try {
            const retryResponse = await callGenAI([textPart]); 
            for (const part of retryResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        } catch (retryError) {
            console.error("纯文字重试也失败:", retryError);
            throw retryError;
        }
    }
    console.error("Final Image Gen Error:", error);
    throw error;
  }
};
