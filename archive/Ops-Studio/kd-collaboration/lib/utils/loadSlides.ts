// Content loader with validation
import fs from "node:fs/promises";
import path from "node:path";
import {
  TitleSlideSchema,
  TextSlideSchema,
  TableSlideSchema,
  RegenerativeSlideSchema,
  FitSlideSchema,
  EngagementSlideSchema,
  CTASlideSchema,
} from "@/lib/schemas";
import type { SlidesContent } from "@/types/slides";

/**
 * Load and validate all slide content from individual JSON files
 * @returns Validated slides content object
 * @throws Error if any slide fails validation
 */
export async function loadSlides(): Promise<SlidesContent> {
  const slidesDir = path.join(process.cwd(), "content", "slides");

  try {
    // Load all slide files in parallel
    const [title, alignment, help, regenerative, fit, engagement, cta] =
      await Promise.all([
        loadAndParse(path.join(slidesDir, "title.json")),
        loadAndParse(path.join(slidesDir, "alignment.json")),
        loadAndParse(path.join(slidesDir, "help.json")),
        loadAndParse(path.join(slidesDir, "regenerative.json")),
        loadAndParse(path.join(slidesDir, "fit.json")),
        loadAndParse(path.join(slidesDir, "engagement.json")),
        loadAndParse(path.join(slidesDir, "cta.json")),
      ]);

    // Validate each slide with its schema
    const validatedSlides = {
      title: TitleSlideSchema.parse(title),
      alignment: TextSlideSchema.parse(alignment),
      help: TableSlideSchema.parse(help),
      regenerative: RegenerativeSlideSchema.parse(regenerative),
      fit: FitSlideSchema.parse(fit),
      engagement: EngagementSlideSchema.parse(engagement),
      cta: CTASlideSchema.parse(cta),
    };

    return validatedSlides;
  } catch (error) {
    // Provide helpful error messages for debugging
    console.error("Error loading slides:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load slides: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Helper function to load and parse JSON file
 */
async function loadAndParse(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}
