import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";

// 🔴 NOT USED (commented)
// import ai from "../configs/ai.js";
// import replicate from "../configs/replicate.js";

import hf from "../configs/huggingface.js";

import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
  "Bold & Graphic": "bold typography, high contrast, expressive face",
  "Tech/Futuristic": "futuristic UI, neon glow, cyber tech",
  Minimalist: "clean layout, simple shapes, negative space",
  Photorealistic: "realistic lighting, DSLR photo, natural skin",
  Illustrated: "digital illustration, cartoon style, bold outlines",
};

const colorSchemeDescriptions = {
  vibrant: "vibrant high saturation colors",
  sunset: "orange pink purple sunset tones",
  forest: "green earthy tones",
  neon: "electric blue pink neon glow",
  purple: "purple magenta violet palette",
  monochrome: "black and white high contrast",
  ocean: "blue teal ocean colors",
  pastel: "soft pastel low saturation",
};

export const generateThumbnail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio = "16:9",
      color_scheme,
    } = req.body;

    const thumbnail = await Thumbnail.create({
      userId,
      title,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      isGenerating: true,
    });

    // 🧠 Build prompt
    let prompt = `
YouTube thumbnail.
${stylePrompts[style as keyof typeof stylePrompts]}.
Title: ${title}.
`;

    if (color_scheme) {
      prompt += `Color scheme: ${
        colorSchemeDescriptions[
          color_scheme as keyof typeof colorSchemeDescriptions
        ]
      }. `;
    }

    if (user_prompt) {
      prompt += `Extra details: ${user_prompt}. `;
    }

    prompt += `
Ultra high quality, sharp focus, dramatic lighting,
professional thumbnail, click worthy.
`;

    // // 🎨 Call Hugging Face SDXL
    // const hfResponse = await hf.post("", {
    //   inputs: prompt,
    //   parameters: {
    //     width: aspect_ratio === "1:1" ? 1024 : 1280,
    //     height: aspect_ratio === "9:16" ? 1280 : 720,
    //   },
    // });
    const width =
  aspect_ratio === "1:1" ? 1024 : aspect_ratio === "9:16" ? 768 : 1280;

const height =
  aspect_ratio === "9:16" ? 1280 : aspect_ratio === "1:1" ? 1024 : 720;

// const hfResponse = await hf.post("", {
//   inputs: prompt,
//   parameters: {
//     width,
//     height,
//     guidance_scale: 7.5,
//     num_inference_steps: 30,
//   },
// });
const hfResponse = await hf.post("", {
  inputs: prompt,
  parameters: {
    width: 1280,
    height: 720,
    guidance_scale: 7,
    num_inference_steps: 25,
  },
});




// Hugging Face returns raw image bytes
if (!hfResponse.data) {
  throw new Error("Empty image response from Hugging Face");
}

const imageBuffer = Buffer.from(hfResponse.data);


    if (!hfResponse.data) {
      throw new Error("Image generation failed");
    }

    const filename = `thumb-${Date.now()}.png`;
    const filePath = path.join("images", filename);

    fs.mkdirSync("images", { recursive: true });
    fs.writeFileSync(filePath, imageBuffer);


    // ☁ Upload to Cloudinary
    const upload = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
    });

    thumbnail.image_url = upload.secure_url;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    fs.unlinkSync(filePath);

    res.json({
      message: "Thumbnail Generated",
      thumbnail,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Image generation failed",
      error: error.message,
    });
  }
};

// DELETE
export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session;
    await Thumbnail.findOneAndDelete({ _id: id, userId });
    res.json({ message: "Thumbnail deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



// import { Request, Response } from "express";
// import Thumbnail from "../models/Thumbnail.js";
// import replicate from "../configs/replicate.js";
// import { v2 as cloudinary } from "cloudinary";

// /* ===========================
//    Gemini imports (COMMENTED)
// =========================== */
// // import ai from "../configs/ai.js";
// // import {
// //   GenerateContentConfig,
// //   HarmBlockThreshold,
// //   HarmCategory,
// // } from "@google/genai";

// const stylePrompts = {
//   "Bold & Graphic": `eye-catching thumbnail, bold typography,
// vibrant colors, expressive human face, dramatic lighting,
// high contrast, click-worthy composition, professional YouTube style`,

//   "Tech/Futuristic": `futuristic thumbnail, sleek modern design,
// digital UI elements, glowing accents, holographic effects,
// cyber-tech aesthetic, sharp lighting`,

//   Minimalist: `minimalist thumbnail, clean layout,
// simple shapes, limited colors, strong focal point`,

//   Photorealistic: `photorealistic thumbnail, realistic human,
// natural lighting, DSLR quality, shallow depth of field`,

//   Illustrated: `illustrated thumbnail, digital art,
// stylized characters, bold outlines, vibrant colors`,
// };

// const colorSchemeDescriptions = {
//   vibrant: `vibrant, energetic colors, high saturation`,
//   sunset: `warm sunset tones, orange pink gradients`,
//   forest: `natural green earthy tones`,
//   neon: `neon cyberpunk colors, glow effects`,
//   purple: `purple and magenta palette`,
//   monochrome: `black and white high contrast`,
//   ocean: `blue and teal tones`,
//   pastel: `soft pastel colors`,
// };

// export const generateThumbnail = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.session as any;

//     const {
//       title,
//       prompt: user_prompt,
//       style,
//       aspect_ratio = "16:9",
//       color_scheme,
//       text_overlay,
//     } = req.body;

//     if (!title || !style) {
//       return res.status(400).json({ message: "Title and style are required" });
//     }

//     const thumbnail = await Thumbnail.create({
//       userId,
//       title,
//       prompt_used: user_prompt,
//       user_prompt,
//       style,
//       aspect_ratio,
//       color_scheme,
//       text_overlay,
//       isGenerating: true,
//     });

//     /* ===========================
//        Prompt building
//     =========================== */
//     let prompt = `Create a ${stylePrompts[style]} for "${title}".`;

//     if (color_scheme) {
//       prompt += ` Use ${colorSchemeDescriptions[color_scheme]} color scheme.`;
//     }

//     if (user_prompt) {
//       prompt += ` ${user_prompt}.`;
//     }

//     prompt += ` YouTube thumbnail, ultra high quality,
// professional, bold, click-through optimized, cinematic lighting.`;

//     /* ===========================
//        SDXL via Replicate
//     =========================== */
//     const output = await replicate.run(
//       "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
//       {
//         input: {
//           prompt,
//           width:
//             aspect_ratio === "1:1"
//               ? 1024
//               : aspect_ratio === "9:16"
//               ? 768
//               : 1024,
//           height:
//             aspect_ratio === "9:16"
//               ? 1024
//               : aspect_ratio === "1:1"
//               ? 1024
//               : 576,
//           guidance_scale: 7.5,
//           num_inference_steps: 30,
//           num_outputs: 1,
//         },
//       }
//     );

//     if (!output || !Array.isArray(output) || !output[0]) {
//       throw new Error("Replicate image generation failed");
//     }

//     const imageUrl = output[0] as string;

//     /* ===========================
//        Upload to Cloudinary
//     =========================== */
//     const uploadResult = await cloudinary.uploader.upload(imageUrl, {
//       resource_type: "image",
//     });

//     thumbnail.image_url = uploadResult.secure_url;
//     thumbnail.isGenerating = false;
//     await thumbnail.save();

//     res.json({
//       message: "Thumbnail generated successfully",
//       thumbnail,
//     });
//   } catch (error: any) {
//     console.error("Thumbnail generation error:", error);
//     res.status(500).json({
//       message: "Image generation failed",
//       error: error?.message || error,
//     });
//   }
// };

// /* ===========================
//    Delete Thumbnail
// =========================== */
// export const deleteThumbnail = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { userId } = req.session as any;

//     await Thumbnail.findOneAndDelete({ _id: id, userId });
//     res.json({ message: "Thumbnail deleted successfully" });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };














// import { Request, Response } from "express";
// import Thumbnail from "../models/Thumbnail.js";

// // ❌ Gemini imports (NOT NEEDED anymore)
// // import {
// //   GenerateContentConfig,
// //   HarmBlockThreshold,
// //   HarmCategory,
// // } from "@google/genai";

// // ❌ Gemini config (NOT NEEDED)
// // import ai from "../configs/ai.js";

// // ✅ Replicate (USED)
// import replicate from "../configs/replicate.js";

// // ❌ Disk & Cloudinary (NOT NEEDED with Replicate URLs)
// // import path from "path";
// // import fs from "fs";
// // import { v2 as cloudinary } from "cloudinary";

// const stylePrompts = {
//   "Bold & Graphic": `eye-catching thumbnail, bold typography,
// vibrant colors, expressive facial reaction, dramatic lighting,
// high contrast, click-worthy composition, professional style`,

//   "Tech/Futuristic": `futuristic thumbnail, sleek modern design,
// digital UI elements, glowing accents, holographic effects,
// cyber-tech aesthetic, sharp lighting, high-tech atmosphere`,

//   Minimalist: `minimalist thumbnail, clean layout, simple shapes,
// limited color palette, plenty of negative space,
// modern flat design, clear focal point`,

//   Photorealistic: `photorealistic thumbnail, ultra-realistic lighting,
// natural skin tones, candid moment, DSLR-style photography,
// lifestyle realism, shallow depth of field`,

//   Illustrated: `illustrated thumbnail, custom digital illustration,
// stylized characters, bold outlines, vibrant colors,
// creative cartoon or vector art style`,
// };

// const colorSchemeDescriptions = {
//   vibrant: `vibrant and energetic colors, high saturation,
// bold contrasts, eye-catching palette`,
//   sunset: `warm sunset tones, orange pink and purple hues,
// soft gradients, cinematic glow`,
//   forest: `natural green tones, earthy colors,
// calm and organic palette, fresh atmosphere`,
//   neon: `neon glow effects, electric blues and pinks,
// cyberpunk lighting, high contrast glow`,
//   purple: `purple-dominant color palette, magenta and violet tones,
// modern and stylish mood`,
//   monochrome: `black and white color scheme, high contrast,
// dramatic lighting, timeless aesthetic`,
//   ocean: `cool blue and teal tones, aquatic color palette,
// fresh and clean atmosphere`,
//   pastel: `soft pastel colors, low saturation,
// gentle tones, calm and friendly aesthetic`,
// };

// export const generateThumbnail = async (req: Request, res: Response) => {
//   let thumbnail;

//   try {
//     if (!req.session?.userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const { userId } = req.session;
//     const {
//       title,
//       prompt: user_prompt,
//       style,
//       aspect_ratio,
//       color_scheme,
//       text_overlay,
//     } = req.body;

//     thumbnail = await Thumbnail.create({
//       userId,
//       title,
//       prompt_used: user_prompt,
//       user_prompt,
//       style,
//       aspect_ratio,
//       color_scheme,
//       text_overlay,
//       isGenerating: true,
//     });

//     // 🧠 Prompt building (unchanged)
//     let prompt = `Create a ${
//       stylePrompts[style as keyof typeof stylePrompts] ??
//       stylePrompts["Bold & Graphic"]
//     } for: "${title}".`;

//     if (color_scheme) {
//       prompt += ` Use a ${
//         colorSchemeDescriptions[
//           color_scheme as keyof typeof colorSchemeDescriptions
//         ]
//       } color scheme.`;
//     }

//     if (user_prompt) {
//       prompt += ` Additional details: ${user_prompt}.`;
//     }

//     prompt += ` Visually stunning, bold, professional,
// high click-through rate YouTube-style thumbnail.`;

//     // 🟢 Replicate SDXL Image Generation
//     const output = await replicate.run(
//       "stability-ai/sdxl",
//       {
//         input: {
//           prompt,
//           width: aspect_ratio === "1:1" ? 1024 : 1280,
//           height: aspect_ratio === "1:1" ? 1024 : 720,
//           num_outputs: 1,
//           guidance_scale: 7.5,
//           num_inference_steps: 30,
//         },
//       }
//     );

//     if (!output || !Array.isArray(output) || !output[0]) {
//       throw new Error("No image returned from Replicate");
//     }

//     // ✅ Replicate returns hosted image URL
//     thumbnail.image_url = output[0];
//     thumbnail.isGenerating = false;
//     await thumbnail.save();

//     res.json({
//       message: "Thumbnail Generated",
//       thumbnail,
//     });
//   } catch (error: any) {
//     console.error(error);

//     if (thumbnail) {
//       thumbnail.isGenerating = false;
//       await thumbnail.save();
//     }

//     res.status(500).json({
//       message: "Image generation failed",
//     });
//   }
// };

// // Controllers For Thumbnail Deletion (unchanged)
// export const deleteThumbnail = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { userId } = req.session;

//     await Thumbnail.findOneAndDelete({ _id: id, userId });

//     res.json({ message: "Thumbnail deleted successfully" });
//   } catch (error: any) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// };












// {/* Original */}
// import { Request, Response } from "express";
// import Thumbnail from "../models/Thumbnail.js";
// import {
//   GenerateContentConfig,
//   HarmBlockThreshold,
//   HarmCategory,
// } from "@google/genai";

// import ai from "../configs/ai.js";
// import path from "path";
// import fs from "fs";
// import { v2 as cloudinary } from "cloudinary";

// const stylePrompts = {
//   "Bold & Graphic": `eye-catching thumbnail, bold typography,
// vibrant colors, expressive facial reaction, dramatic lighting,
// high contrast, click-worthy composition, professional style`,

//   "Tech/Futuristic": `futuristic thumbnail, sleek modern design,
// digital UI elements, glowing accents, holographic effects,
// cyber-tech aesthetic, sharp lighting, high-tech atmosphere`,

//   Minimalist: `minimalist thumbnail, clean layout, simple shapes,
// limited color palette, plenty of negative space,
// modern flat design, clear focal point`,

//   Photorealistic: `photorealistic thumbnail, ultra-realistic lighting,
// natural skin tones, candid moment, DSLR-style photography,
// lifestyle realism, shallow depth of field`,

//   Illustrated: `illustrated thumbnail, custom digital illustration,
// stylized characters, bold outlines, vibrant colors,
// creative cartoon or vector art style`,
// };

// const colorSchemeDescriptions = {
//   vibrant: `vibrant and energetic colors, high saturation,
// bold contrasts, eye-catching palette`,

//   sunset: `warm sunset tones, orange pink and purple hues,
// soft gradients, cinematic glow`,

//   forest: `natural green tones, earthy colors,
// calm and organic palette, fresh atmosphere`,

//   neon: `neon glow effects, electric blues and pinks,
// cyberpunk lighting, high contrast glow`,

//   purple: `purple-dominant color palette, magenta and violet tones,
// modern and stylish mood`,

//   monochrome: `black and white color scheme, high contrast,
// dramatic lighting, timeless aesthetic`,

//   ocean: `cool blue and teal tones, aquatic color palette,
// fresh and clean atmosphere`,

//   pastel: `soft pastel colors, low saturation,
// gentle tones, calm and friendly aesthetic`,
// };

// export const generateThumbnail = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.session;
//     const {
//       title,
//       prompt: user_prompt,
//       style,
//       aspect_ratio,
//       color_scheme,
//       text_overlay,
//     } = req.body;

//     const thumbnail = await Thumbnail.create({
//       userId,
//       title,
//       prompt_used: user_prompt,
//       user_prompt,
//       style,
//       aspect_ratio,
//       color_scheme,
//       text_overlay,
//       isGenerating: true,
//     });

//     const model = "gemini-3-pro-image-preview";
//     const generationConfig: GenerateContentConfig = {
//       maxOutputTokens: 32768,
//       temperature: 1,
//       topP: 0.95,
//       responseModalities: ["IMAGE"],
//       imageConfig: {
//         aspectRatio: aspect_ratio || "16:9",
//         imageSize: "1K",
//       },
//       safetySettings: [
//         {
//           category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//           threshold: HarmBlockThreshold.OFF,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//           threshold: HarmBlockThreshold.OFF,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//           threshold: HarmBlockThreshold.OFF,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//           threshold: HarmBlockThreshold.OFF,
//         },
//       ],
//     };

//     let prompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts]}
// for: "${title}"`;

//     if (color_scheme) {
//       prompt += ` Use a ${
//         colorSchemeDescriptions[
//           color_scheme as keyof typeof colorSchemeDescriptions
//         ]
//       } color scheme.`;
//     }
//     if (user_prompt) {
//       prompt += ` Additional details: ${user_prompt}.`;
//     }

//     prompt += ` The thumbnail should be ${aspect_ratio}, visually stunning,
// and designed to maximize click-through rate. Make it bold, professional,
// and impossible to ignore.`;

//     // Generate the image using the AI model
//     const response = await ai.models.generateContent({
//       model,
//       contents: [prompt],
//       config: generationConfig,
//     });

//     // Check if the response is valid
//     if (!response?.candidates?.[0]?.content?.parts) {
//       throw new Error("Unexpected response");
//     }

//     const parts = response.candidates[0].content.parts;
//     let finalBuffer: Buffer | null = null;

//     for (const part of parts) {
//       if (part.inlineData) {
//         finalBuffer = Buffer.from(part.inlineData.data, "base64");
//       }
//     }
//     const filename = `final-output-${Date.now()}.png`;
//     const filePath = path.join("images", filename);

//     // Create the images directory if it doesn't exist
//     fs.mkdirSync("images", { recursive: true });
//     // Write the final image to the file
//     fs.writeFileSync(filePath, finalBuffer!);

//     const uploadResult = await cloudinary.uploader.upload(filePath, {
//       resource_type: "image",
//     });

//     thumbnail.image_url = uploadResult.url;
//     thumbnail.isGenerating = false;
//     await thumbnail.save();
//     res.json({ message: "Thumbnail Generated", thumbnail });

//     // remove image file from disk
//     fs.unlinkSync(filePath);
//   } catch (error: any) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// };  