import { GoogleGenerativeAI } from "@google/generative-ai"; // 👈 1. 引入新库
import { Scene } from "../types";

// 初始化客户端
const getClient = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing Google API Key");
        throw new Error("Google API Key not found");
    }
    // 👈 2. 使用新类名 GoogleGenerativeAI，且直接传入 Key 字符串
    return new GoogleGenerativeAI(apiKey);
}

// 1. 拆解故事
export const breakdownStory = async (storyText: string): Promise<Scene[]> => {
  try {
    const genAI = getClient();
    // 👈 3. 获取模型
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', 
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
    return [{ id: '1', description: storyText.slice(0, 50) }];
  }
};

// 2. 角色分析 (保持空实现防止报错)
export const analyzeCharacterFromImage = async (base64Image: string): Promise<string> => {
  return ""; 
};

// 3. 生成图片 (保持空实现防止报错)
export const generateImageFromPrompt = async (promptText: string, refImg?: string): Promise<string> => {
    return "https://placehold.co/600x400?text=Generating...";
};