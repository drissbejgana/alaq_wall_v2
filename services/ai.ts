
import { GoogleGenAI } from "@google/genai";

export const aiService = {
  async repaintRoom(imageBase64: string, colorName: string, finish: string): Promise<string | null> {
    try {
      // Fix: Create a new GoogleGenAI instance right before making an API call to ensure current key is used
      const ai = new GoogleGenAI({ apiKey: "AIzaSyAeCUL7j5JXxTaUxrszFA1CLeq3pvI-xtQ"});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.split(',')[1],
              },
            },
            {
              text: `Repaint the walls of this room in a ${colorName} color with a ${finish} finish. Detect all visible wall surfaces. Keep all furniture, lighting, flooring, and windows exactly as they are. The result should look like a highly realistic professional painting job with natural lighting and shadows preserved. Return the modified image.`,
            },
          ],
        },
      });

      // Fix: Iterate through parts to find the image part, as per Gemini API best practices
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("AI Visualization Error:", error);
      return null;
    }
  }
};
