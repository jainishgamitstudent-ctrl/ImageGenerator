
import { GoogleGenAI, Modality } from "@google/genai";
import type { ViewType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64.split(',')[1],
            mimeType
        },
    };
};

const getMimeType = (base64: string): string => {
    return base64.substring(base64.indexOf(":") + 1, base64.indexOf(";"));
};

export const generateTryOnImage = async (
    personImageBase64: string,
    outfitImageBase64: string,
    view: ViewType
): Promise<{ image: string | null; text: string | null; error: string | null; }> => {
    try {
        const personMimeType = getMimeType(personImageBase64);
        const outfitMimeType = getMimeType(outfitImageBase64);

        const personImagePart = fileToGenerativePart(personImageBase64, personMimeType);
        const outfitImagePart = fileToGenerativePart(outfitImageBase64, outfitMimeType);

        const prompt = `
You are a virtual try-on assistant. Your task is to generate a photorealistic image of the person from the first image wearing the outfit from the second image.

**View:** Generate a **${view}** of the person.

**Requirements:**
- **Fit:** The outfit must be fitted naturally onto the user's body shape and posture.
- **Realism:** Maintain realistic fabric textures, shadows, and lighting.
- **Preservation:** Preserve the user's original facial features, hairstyle, and skin tone. Do not change the person's identity.
- **Quality:** The final image must look like a real photograph, not a digital overlay or photoshop composite.
- **Alignment:** Ensure the outfit alignment is correct.
- **Background:** Place the person in a simple, neutral, light-gray studio background, consistent across all generated views.

**Error Handling:**
- If the outfit in the second image is unclear or low-quality, respond with only the text: "ERROR: The provided outfit image is unclear. Please upload a higher-quality image for better results."
- If the person in the first image does not show a full body, generate the try-on for the visible parts of the body and in the text response, politely mention: "For a more accurate full-body try-on, please provide an image that shows your entire body."
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    personImagePart,
                    outfitImagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let generatedImage: string | null = null;
        let responseText: string | null = null;

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                responseText = part.text;
            } else if (part.inlineData) {
                generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        if (responseText && responseText.startsWith('ERROR:')) {
            return { image: null, text: null, error: responseText.replace('ERROR: ', '') };
        }

        if (!generatedImage) {
            return { image: null, text: null, error: `Could not generate the ${view}. The model did not return an image.` };
        }

        return { image: generatedImage, text: responseText, error: null };

    } catch (error) {
        console.error(`Error generating ${view}:`, error);
        return { image: null, text: null, error: `Failed to generate the ${view}. Please check the console for details.` };
    }
};

export const generateTryOnVideo = async (
    frontViewImageBase64: string
): Promise<{ videoUrl: string | null; error: string | null; }> => {
    try {
        const mimeType = getMimeType(frontViewImageBase64);
        
        const prompt = `Animate the person in this image to perform a slow, smooth 360-degree turn. It is crucial to maintain the person's appearance, the outfit they are wearing, and the neutral light-gray studio background. The video should be about 5-10 seconds long.`;

        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: {
                imageBytes: frontViewImageBase64.split(',')[1],
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
            },
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            return { videoUrl: null, error: 'Video generation completed, but no download link was provided by the API.' };
        }
        
        const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!res.ok) {
            const errorBody = await res.text();
            console.error("Failed to download video:", errorBody);
            return { videoUrl: null, error: `Failed to download the generated video (status: ${res.status}).` };
        }
        
        const videoBlob = await res.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return { videoUrl, error: null };

    } catch (error) {
        console.error('Error generating video:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { videoUrl: null, error: `An unexpected error occurred during video generation: ${errorMessage}` };
    }
};
