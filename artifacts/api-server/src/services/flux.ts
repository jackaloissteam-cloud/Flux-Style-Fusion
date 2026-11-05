import { timingSafeEqual } from "node:crypto";

type ProviderName = "fal" | "huggingface";

type ProviderInput = {
  prompt: string;
  negativePrompt?: string;
  seed?: number | null;
  count: number;
  guidanceScale: number;
  inferenceSteps: number;
  strength: number;
  outputFormat: "jpeg" | "png";
  aspectRatio: "1:1" | "4:5" | "4:3" | "9:16" | "5:3";
  referenceImage?: {
    data: string;
    mimeType: "image/png" | "image/jpeg" | "image/webp";
  } | null;
  accessCode: string;
};

type GeneratedImage = {
  data: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  seed?: number | null;
};

export type GenerationStatus = {
  enabled: boolean;
  provider: ProviderName | null;
  model: string | null;
  supportsReferenceImage: boolean;
  reason: string | null;
};

export type GenerationResult = {
  provider: ProviderName;
  model: string;
  images: GeneratedImage[];
  warnings: string[];
};

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

function selectedProvider(): ProviderName | null {
  const provider = process.env["FLUX_PROVIDER"]?.trim().toLowerCase();
  return provider === "fal" || provider === "huggingface" ? provider : null;
}

function configuredModel(provider: ProviderName, hasReference: boolean) {
  if (provider === "fal") {
    return hasReference
      ? process.env["FAL_FLUX_IMAGE_MODEL"] ?? "fal-ai/flux/dev/image-to-image"
      : process.env["FAL_FLUX_TEXT_MODEL"] ?? "fal-ai/flux/dev";
  }
  return hasReference
    ? process.env["HF_FLUX_IMAGE_MODEL"] ?? "black-forest-labs/FLUX.1-Kontext-dev"
    : process.env["HF_FLUX_TEXT_MODEL"] ?? "black-forest-labs/FLUX.1-dev";
}

function providerCredential(provider: ProviderName) {
  return provider === "fal"
    ? process.env["FAL_KEY"]
    : process.env["HF_TOKEN"] ?? process.env["HUGGINGFACE_API_KEY"];
}

function modelIdIsValid(model: string) {
  return /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)+$/i.test(model);
}

export function getGenerationStatus(): GenerationStatus {
  const provider = selectedProvider();
  const enabledByOwner = process.env["FLUX_GENERATION_ENABLED"] === "true";
  const accessCode = process.env["FLUX_GENERATION_ACCESS_CODE"] ?? "";
  if (!provider) {
    return {
      enabled: false,
      provider: null,
      model: null,
      supportsReferenceImage: false,
      reason: "Anbieter ist nicht festgelegt. FLUX_PROVIDER muss fal oder huggingface sein.",
    };
  }

  const credential = providerCredential(provider);
  const model = configuredModel(provider, false);
  const validModel = modelIdIsValid(model);
  const reason = !enabledByOwner
    ? "Bildgenerierung ist standardmäßig deaktiviert. Die Betreiberin oder der Betreiber muss FLUX_GENERATION_ENABLED ausdrücklich auf true setzen."
    : !credential
      ? provider === "fal"
        ? "Für fal.ai fehlt das serverseitige Secret FAL_KEY."
        : "Für Hugging Face fehlt das serverseitige Secret HF_TOKEN."
      : accessCode.length < 16
        ? "Für sichere Freigabe fehlt FLUX_GENERATION_ACCESS_CODE mit mindestens 16 Zeichen."
        : !validModel
          ? "Die konfigurierte Modellkennung ist ungültig."
          : null;
  return {
    enabled: reason === null,
    provider,
    model: validModel ? model : null,
    supportsReferenceImage: true,
    reason,
  };
}

function matchesAccessCode(actual: string, expected: string) {
  const maxLength = 256;
  const actualBytes = Buffer.from(actual.slice(0, maxLength));
  const expectedBytes = Buffer.from(expected.slice(0, maxLength));
  const actualFixed = Buffer.alloc(maxLength);
  const expectedFixed = Buffer.alloc(maxLength);
  actualBytes.copy(actualFixed);
  expectedBytes.copy(expectedFixed);
  return actual.length === expected.length && timingSafeEqual(actualFixed, expectedFixed);
}

function ratioDimensions(ratio: ProviderInput["aspectRatio"]) {
  const sizes: Record<ProviderInput["aspectRatio"], { width: number; height: number }> = {
    "1:1": { width: 1024, height: 1024 },
    "4:5": { width: 832, height: 1040 },
    "4:3": { width: 1024, height: 768 },
    "9:16": { width: 576, height: 1024 },
    "5:3": { width: 1024, height: 614 },
  };
  return sizes[ratio];
}

function mimeTypeFor(value: string | null | undefined): GeneratedImage["mimeType"] {
  if (value === "image/png") return "image/png";
  if (value === "image/webp") return "image/webp";
  return "image/jpeg";
}

function safeProviderError(body: string, providerName: string) {
  let message = body;
  try {
    const data = JSON.parse(body) as { error?: unknown; message?: unknown };
    if (typeof data.error === "string") message = data.error;
    else if (typeof data.message === "string") message = data.message;
  } catch {
    // The provider may return a plain-text error.
  }
  return `${providerName}: ${message.replace(/\s+/g, " ").slice(0, 450) || "unbekannter Fehler"}`;
}

async function readImageResponse(response: Response): Promise<GeneratedImage> {
  if (!response.ok) {
    throw new GenerationError(
      safeProviderError(await response.text(), "Bildabruf fehlgeschlagen"),
      502,
    );
  }
  const mimeType = mimeTypeFor(response.headers.get("content-type"));
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > 25 * 1024 * 1024) {
    throw new GenerationError("Der Anbieter hat ein leeres oder zu großes Bild geliefert.", 502);
  }
  return { data: bytes.toString("base64"), mimeType };
}

async function generateWithFal(
  input: ProviderInput,
  model: string,
  credential: string,
): Promise<GenerationResult> {
  const dimensions = ratioDimensions(input.aspectRatio);
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    seed: input.seed ?? undefined,
    guidance_scale: input.guidanceScale,
    num_inference_steps: input.inferenceSteps,
    num_images: input.count,
    output_format: input.outputFormat,
    enable_safety_checker: true,
    sync_mode: false,
  };
  if (input.referenceImage) {
    payload["image_url"] = `data:${input.referenceImage.mimeType};base64,${input.referenceImage.data}`;
    payload["strength"] = input.strength;
  } else {
    payload["image_size"] = dimensions;
  }

  const endpoint = `https://queue.fal.run/${model}`;
  const submit = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${credential}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  if (!submit.ok) {
    throw new GenerationError(safeProviderError(await submit.text(), "fal.ai"), 502);
  }
  const queued = await submit.json() as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
  };
  if (!queued.request_id || !/^[a-z0-9-]+$/i.test(queued.request_id)) {
    throw new GenerationError("fal.ai hat keine gültige Auftragskennung zurückgegeben.", 502);
  }
  const statusUrl = queued.status_url ?? `${endpoint}/requests/${queued.request_id}/status`;
  const responseUrl = queued.response_url ?? `${endpoint}/requests/${queued.request_id}`;
  for (const url of [statusUrl, responseUrl]) {
    if (new URL(url).origin !== "https://queue.fal.run") {
      throw new GenerationError("fal.ai hat eine ungültige Ergebnisadresse zurückgegeben.", 502);
    }
  }

  const deadline = Date.now() + 180_000;
  let completed = false;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const statusResponse = await fetch(statusUrl, {
      headers: { Authorization: `Key ${credential}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!statusResponse.ok) {
      throw new GenerationError(safeProviderError(await statusResponse.text(), "fal.ai Status"), 502);
    }
    const status = await statusResponse.json() as { status?: string; error?: string };
    if (status.status === "COMPLETED") {
      completed = true;
      break;
    }
    if (status.status === "FAILED" || status.status === "CANCELLED") {
      throw new GenerationError(status.error ?? "fal.ai hat die Generierung abgebrochen.", 502);
    }
  }
  if (!completed) {
    throw new GenerationError("fal.ai hat die Generierung nicht rechtzeitig abgeschlossen.", 502);
  }

  const resultResponse = await fetch(responseUrl, {
    headers: { Authorization: `Key ${credential}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resultResponse.ok) {
    throw new GenerationError(safeProviderError(await resultResponse.text(), "fal.ai Ergebnis"), 502);
  }
  const result = await resultResponse.json() as {
    images?: Array<{ url?: string; content_type?: string }>;
    seed?: number;
  };
  if (!Array.isArray(result.images) || result.images.length === 0) {
    throw new GenerationError("fal.ai hat keine Bilder zurückgegeben.", 502);
  }

  const images: GeneratedImage[] = [];
  for (const image of result.images.slice(0, input.count)) {
    if (!image.url) continue;
    if (image.url.startsWith("data:")) {
      const match = image.url.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i);
      if (!match) throw new GenerationError("fal.ai hat ein nicht unterstütztes Bildformat geliefert.", 502);
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.byteLength > 25 * 1024 * 1024) {
        throw new GenerationError("fal.ai hat ein zu großes Bild geliefert.", 502);
      }
      images.push({
        data: match[2],
        mimeType: mimeTypeFor(match[1]),
        seed: result.seed ?? input.seed ?? null,
      });
      continue;
    }
    const imageUrl = new URL(image.url);
    if (
      imageUrl.protocol !== "https:"
      || !(imageUrl.hostname === "fal.media" || imageUrl.hostname.endsWith(".fal.media"))
    ) {
      throw new GenerationError("fal.ai hat eine ungültige Bildadresse zurückgegeben.", 502);
    }
    const downloaded = await readImageResponse(await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
    }));
    images.push({ ...downloaded, seed: result.seed ?? input.seed ?? null });
  }
  if (images.length === 0) {
    throw new GenerationError("Die Bildergebnisse von fal.ai waren nicht abrufbar.", 502);
  }
  return {
    provider: "fal",
    model,
    images,
    warnings: input.negativePrompt?.trim()
      ? ["Der fal.ai-FLUX-Endpunkt unterstützt keinen separaten Negative Prompt; dieser wurde nicht an das Modell übermittelt."]
      : [],
  };
}

async function generateWithHuggingFace(
  input: ProviderInput,
  model: string,
  credential: string,
): Promise<GenerationResult> {
  const { width, height } = ratioDimensions(input.aspectRatio);
  const modelPath = model.split("/").map(encodeURIComponent).join("/");
  const endpoint = `https://router.huggingface.co/hf-inference/models/${modelPath}`;
  const images: GeneratedImage[] = [];
  for (let index = 0; index < input.count; index += 1) {
    const parameters: Record<string, unknown> = {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt?.trim() || undefined,
      guidance_scale: input.guidanceScale,
      num_inference_steps: input.inferenceSteps,
      width,
      height,
    };
    const imageSeed = input.seed == null ? undefined : input.seed + index;
    if (imageSeed != null && imageSeed <= 2_147_483_647) {
      parameters["seed"] = imageSeed;
    }
    const body = input.referenceImage
      ? {
          inputs: input.referenceImage.data,
          parameters,
        }
      : {
          inputs: input.prompt,
          parameters: {
            negative_prompt: input.negativePrompt?.trim() || undefined,
            guidance_scale: input.guidanceScale,
            num_inference_steps: input.inferenceSteps,
            width,
            height,
            seed: imageSeed,
          },
        };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
        Accept: input.outputFormat === "png" ? "image/png" : "image/jpeg",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      throw new GenerationError(safeProviderError(await response.text(), "Hugging Face"), 502);
    }
    const image = await readImageResponse(response);
    if (image.mimeType !== `image/${input.outputFormat}`) {
      images.push({
        ...image,
        seed: imageSeed ?? null,
      });
    } else {
      images.push({ ...image, seed: imageSeed ?? null });
    }
  }
  return {
    provider: "huggingface",
    model,
    images,
    warnings: [],
  };
}

export async function generateImages(input: ProviderInput): Promise<GenerationResult> {
  const status = getGenerationStatus();
  if (!status.enabled || !status.provider) {
    throw new GenerationError(status.reason ?? "Bildgenerierung ist nicht aktiviert.", 503);
  }
  const expectedAccessCode = process.env["FLUX_GENERATION_ACCESS_CODE"] ?? "";
  if (!matchesAccessCode(input.accessCode, expectedAccessCode)) {
    throw new GenerationError("Der Freigabecode ist ungültig.", 403);
  }
  const provider = status.provider;
  const model = configuredModel(provider, Boolean(input.referenceImage));
  if (!modelIdIsValid(model)) {
    throw new GenerationError("Die konfigurierte Modellkennung ist ungültig.", 503);
  }
  const credential = providerCredential(provider);
  if (!credential) {
    throw new GenerationError("Der serverseitige Anbieterzugang ist nicht konfiguriert.", 503);
  }
  if (provider === "fal") return generateWithFal(input, model, credential);
  return generateWithHuggingFace(input, model, credential);
}
