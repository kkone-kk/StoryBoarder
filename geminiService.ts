import { GoogleGenerativeAI } from "@google/generative-ai"; // 👈 必须是这个新库
import { Scene } from "../types";

// 初始化客户端
const getClient = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing Google API Key");
        throw new Error("Google API Key not found");
    }
    // 👇 注意这里是用 GoogleGenerativeAI
    return new GoogleGenerativeAI(apiKey);
}

// 1. 拆解故事
export const breakdownStory = async (storyText: string): Promise<Scene[]> => {
  try {
    const genAI = getClient();
    // 👇 模型名字保持 2.5 不变
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a professional storyboard artist. Break down the following user research story into 3-6 distinct visual scenes for a comic strip.
    Return a JSON array of objects with "description" field.
    Story: ${storyText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    
    return parsed.map((item: any, index: number) => ({
      id: Date.now().toString() + index,
      description: item.description,
      imageUrl: undefined,
      isGenerating: false
    }));
  } catch (error) {
    console.error("Breakdown Error:", error);
    // 简单兜底
    return [{ id: '1', description: storyText.slice(0, 100) }];
  }
};

// 2. 角色分析
export const analyzeCharacterFromImage = async (base64Image: string): Promise<string> => {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const result = await model.generateContent([
        "Analyze visual features.",
        { inlineData: { data: base64Data, mimeType: "image/png" } }
    ]);
    return result.response.text();
  } catch (error) { return ""; }
};

// 3. 生成图片
export const generateImageFromPrompt = async (promptText: string, refImg?: string): Promise<string> => {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const parts: any[] = [{ text: promptText }];
    
    if (refImg) {
        parts.push({
            inlineData: {
                data: refImg.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: "image/png"
            }
        });
    }

    const result = await model.generateContent(parts);
    return result.response.text(); 
  } catch (error) {
    console.error("Img Gen Error:", error);
    throw error;
  }
};