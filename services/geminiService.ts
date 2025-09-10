
import { GoogleGenAI, Modality } from "@google/genai";
import type { ViewType, Quality, AnimationType, VideoDuration } from '../types';

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
    styleImageBase64: string | null,
    view: ViewType,
    customPrompt: string,
    quality: Quality,
    seed: number
): Promise<{ image: string | null; text: string | null; error: string | null; }> => {
    try {
        const personMimeType = getMimeType(personImageBase64);
        const outfitMimeType = getMimeType(outfitImageBase64);

        const personImagePart = fileToGenerativePart(personImageBase64, personMimeType);
        const outfitImagePart = fileToGenerativePart(outfitImageBase64, outfitMimeType);

        const imageParts = [personImagePart, outfitImagePart];

        if (styleImageBase64) {
            const styleMimeType = getMimeType(styleImageBase64);
            const styleImagePart = fileToGenerativePart(styleImageBase64, styleMimeType);
            imageParts.push(styleImagePart);
        }

        const getQualityPrompt = () => {
            switch (quality) {
                case 'Standard':
                    return 'Generate a high-quality, photorealistic image.';
                case 'High':
                    return 'Generate a high-resolution, photorealistic image. The final result should be indistinguishable from a real photograph.';
                case 'Ultra':
                    return 'Generate an ultra-high-resolution, hyper-realistic 4K image. The final result should be indistinguishable from professional photography, with flawless attention to lighting, shadows, and fabric textures.';
            }
        };
        
        const stylePrompt = styleImageBase64
            ? `\n**Style Reference:** A third image has been provided as a style reference. Apply its texture, pattern, or artistic style to the main outfit.`
            : '';

        const prompt = `
You are a world-class virtual try-on assistant. Your task is to generate a single, static image based on the user's request.
${getQualityPrompt()}

**View:** Generate a **${view}** of the person.
${stylePrompt}
${customPrompt && customPrompt.trim() !== '' ? `\n**User Instructions:** ${customPrompt.trim()}\n` : ''}
**Core Requirements:**
- **Fit:** The outfit must be fitted naturally onto the user's body shape and posture.
- **Realism:** Maintain hyper-realistic fabric textures, shadows, and lighting.
- **Background:** Place the person in a simple, neutral, light-gray studio background.

**Outfit Fidelity Mandate:**
- **Preserve Original Design:** You MUST accurately transfer the complete design, pattern, color, and texture from the provided outfit image onto the person. The final look must be a faithful representation of the source outfit.
- **No Alterations:** Do not add, remove, or change any design elements, logos, text, or patterns from the original outfit unless explicitly told to do so in the user instructions.

**Consistency Mandate:**
- You will be given a consistent seed value for each set of views (front, side, back). Use this to ensure the person's identity, facial features, hairstyle, skin tone, and all outfit details (color, texture, fit) remain absolutely identical across all generated images for this set.
- **Do not change the person's identity.**

**Error Handling:**
- If the outfit in the second image is unclear or low-quality, respond with only the text: "ERROR: The provided outfit image is unclear. Please upload a higher-quality image for better results."
- If the person in the first image does not show a full body, generate the try-on for the visible parts of the body and in the text response, politely mention: "For a more accurate full-body try-on, please provide an image that shows your entire body."
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                seed: seed,
            },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            const blockReason = response.promptFeedback?.blockReason;
            let detailedError = "The model did not return a valid response.";
            if (blockReason) {
                detailedError = `The request was blocked. Reason: ${blockReason}.`;
            }
            console.error('Invalid response from API:', response);
            return { image: null, text: null, error: `Failed to generate the ${view}. ${detailedError}` };
        }

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
        const errorMessage = error instanceof Error ? JSON.stringify({ error: { message: error.message } }) : String(error);
        return { image: null, text: null, error: `Failed to generate the ${view}. Details: ${errorMessage}` };
    }
};

const getAnimationDescription = (animation: AnimationType): string => {
    switch (animation) {
        case 'Subtle Sway':
            return 'Animate the person to perform a subtle, gentle swaying motion, as if they are standing and posing naturally for a photo.';
        case 'Catwalk Pose':
            return 'Animate the person to perform a confident catwalk strut towards the camera for a few steps, followed by a brief, elegant pose.';
        case '360 Turn':
        default:
            return 'Animate the person to perform a slow, smooth 360-degree turn, showing the outfit from all angles.';
    }
};

export const generateTryOnVideo = async (
    frontViewImageBase64: string,
    duration: VideoDuration,
    animation: AnimationType,
): Promise<{ videoUrl: string | null; error: string | null; }> => {
    try {
        const mimeType = getMimeType(frontViewImageBase64);
        
        const prompt = `Generate a video with a strict portrait aspect ratio of 1080x1920. The video should be ${duration} seconds long. ${getAnimationDescription(animation)} It is crucial to maintain the person's appearance, the outfit they are wearing, and the neutral light-gray studio background.`;

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
