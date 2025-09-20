// Implemented by Gemini.
'use server';

/**
 * @fileOverview This file defines a Genkit flow that uses AI to determine the best portfolio layout
 * and image cropping for different screen sizes and devices.
 *
 * - adaptivePortfolioLayout - A function that triggers the adaptive portfolio layout process.
 * - AdaptivePortfolioLayoutInput - The input type for the adaptivePortfolioLayout function.
 * - AdaptivePortfolioLayoutOutput - The return type for the adaptivePortfolioLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptivePortfolioLayoutInputSchema = z.object({
  images: z.array(
    z.object({
      dataUri: z
        .string()
        .describe(
          "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      altText: z.string().describe('Alternative text for the image.'),
    })
  ).describe('An array of image data URIs and their alt texts.'),
  screenWidth: z.number().describe('The width of the screen in pixels.'),
  screenHeight: z.number().describe('The height of the screen in pixels.'),
  deviceType: z.string().describe('The type of device (e.g., desktop, mobile, tablet).'),
});
export type AdaptivePortfolioLayoutInput = z.infer<typeof AdaptivePortfolioLayoutInputSchema>;

const AdaptivePortfolioLayoutOutputSchema = z.object({
  layoutType: z.string().describe('The type of layout to use (e.g., grid, masonry, carousel).'),
  imageCropPreferences: z.array(
    z.object({
      imageIndex: z.number().describe('The index of the image in the input array.'),
      cropRegion: z
        .string()
        .describe(
          'The preferred cropping region for the image (e.g., top, bottom, center, face).' // Assuming face detection is possible
        ),
    })
  ).describe('An array of preferred cropping regions for each image.'),
});
export type AdaptivePortfolioLayoutOutput = z.infer<typeof AdaptivePortfolioLayoutOutputSchema>;

export async function adaptivePortfolioLayout(input: AdaptivePortfolioLayoutInput): Promise<AdaptivePortfolioLayoutOutput> {
  return adaptivePortfolioLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptivePortfolioLayoutPrompt',
  input: {schema: AdaptivePortfolioLayoutInputSchema},
  output: {schema: AdaptivePortfolioLayoutOutputSchema},
  prompt: `You are an expert in visual design and responsive web development. Given a set of images, 
you will suggest the best layout and cropping for a portfolio, optimized for different screen sizes and device types.

Here's the information about the images, the screen, and the device:

Device Type: {{{deviceType}}}
Screen Width: {{{screenWidth}}}px
Screen Height: {{{screenHeight}}}px

Images:
{{#each images}}
  - Image {{@index}} Alt Text: {{{this.altText}}}
{{/each}}


Based on this information, suggest the best layout type and cropping preferences for each image. 
Explain your reasoning.

Consider these layout types: grid, masonry, carousel.
For cropping, suggest either 'top', 'bottom', 'center', or, if appropriate,  'face' (if you believe there is a face and it should be centered.)

Your response should be structured as a JSON object matching the AdaptivePortfolioLayoutOutputSchema schema.
`,// Removed intentional space after last backtick in prompt.
});

const adaptivePortfolioLayoutFlow = ai.defineFlow(
  {
    name: 'adaptivePortfolioLayoutFlow',
    inputSchema: AdaptivePortfolioLayoutInputSchema,
    outputSchema: AdaptivePortfolioLayoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

