import { GenerateImagesBody, GenerateImagesResponse, GetGenerationStatusResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { generateImages, GenerationError, getGenerationStatus } from "../services/flux";

const router: IRouter = Router();
const maxReferenceBytes = 6 * 1024 * 1024;
const base64Pattern = /^(?:[a-z0-9+/]{4})*(?:[a-z0-9+/]{2}==|[a-z0-9+/]{3}=)?$/i;

router.get("/generate/status", (_req, res) => {
  res.json(GetGenerationStatusResponse.parse(getGenerationStatus()));
});

router.post("/generate", async (req, res): Promise<void> => {
  const parsed = GenerateImagesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const referenceImage = parsed.data.referenceImage;
  if (referenceImage) {
    if (!base64Pattern.test(referenceImage.data)) {
      res.status(400).json({ error: "Das Referenzbild enthält ungültige Base64-Daten." });
      return;
    }
    const imageBytes = Buffer.from(referenceImage.data, "base64");
    if (
      imageBytes.byteLength === 0
      || imageBytes.byteLength > maxReferenceBytes
      || imageBytes.toString("base64") !== referenceImage.data
    ) {
      res.status(400).json({ error: "Referenzbilder dürfen höchstens 6 MB groß sein." });
      return;
    }
  }

  try {
    const result = await generateImages(parsed.data);
    res.json(GenerateImagesResponse.parse(result));
  } catch (error) {
    if (error instanceof GenerationError) {
      if (error.statusCode === 429 && error.retryAfterSeconds) {
        res.setHeader("Retry-After", String(error.retryAfterSeconds));
      }
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    req.log.error({ err: error }, "Image generation failed");
    res.status(502).json({ error: "Der Bildanbieter hat die Generierung nicht abgeschlossen." });
  }
});

export default router;
