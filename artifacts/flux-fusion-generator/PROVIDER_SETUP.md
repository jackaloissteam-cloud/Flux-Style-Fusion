# FLUX provider setup

Image generation is disabled unless it is deliberately enabled on the API
server. No provider call was made while this integration was implemented or
tested.

To enable it later, add these values through Replit Secrets or the server
environment. Do not put provider credentials in frontend variables:

- `FLUX_PROVIDER`: `fal` or `huggingface`
- `FAL_KEY` for fal.ai, or `HF_TOKEN` for Hugging Face
- `FLUX_GENERATION_ACCESS_CODE`: a private code of at least 16 characters
- `FLUX_GENERATION_ENABLED`: set to `true` only after explicitly approving
  provider usage

Optional model overrides:

- `FAL_FLUX_TEXT_MODEL` (default `fal-ai/flux/dev`)
- `FAL_FLUX_IMAGE_MODEL` (default `fal-ai/flux/dev/image-to-image`)
- `HF_FLUX_TEXT_MODEL` (default `black-forest-labs/FLUX.1-dev`)
- `HF_FLUX_IMAGE_MODEL` (default `black-forest-labs/FLUX.1-Kontext-dev`)

The API requires the access code for each run, limits it to five requests per
hour, and accepts at most four images per request. The app also requires a
separate per-run billing confirmation. The access code is not saved in browser
storage.

The provider APIs do not expose identical controls. fal.ai's image-to-image
endpoint retains the reference image's aspect ratio and has no separate
negative-prompt field; the app reports these limitations after generation.
Hugging Face receives the requested aspect ratio and negative prompt; its
image-to-image endpoint does not accept the strength control, which is reported
as a warning.

Generated images, prompts, and settings are stored only in the current
browser's IndexedDB archive. They are not uploaded to this workspace's storage.
