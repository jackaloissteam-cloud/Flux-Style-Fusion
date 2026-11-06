export type OptionKey =
  | 'motif'
  | 'artistA'
  | 'artistB'
  | 'fusion'
  | 'composition'
  | 'lighting'
  | 'palette'
  | 'detail';

export type FormState = Record<OptionKey, string>;

export type TagGroupKey =
  | 'style'
  | 'camera'
  | 'editorial'
  | 'mood'
  | 'environment'
  | 'human'
  | 'detailTags'
  | 'quality'
  | 'technical'
  | 'postProcessing'
  | 'negativeTags';

export type TagGroup = {
  key: TagGroupKey;
  label: string;
  values: string[];
};

export type PromptLanguage = 'de' | 'en';

export type PromptAudit = {
  duplicates: string[];
  conflicts: string[];
};

export type PromptBuilderInput = {
  form: FormState;
  tagSelections: Record<TagGroupKey, string[]>;
  negativePrompt: string;
  aspectRatio: string;
  seed: string;
  batchCount: string;
  artistAWeight: number;
  guidanceScale: string;
  inferenceSteps: string;
  strength: string;
  outputFormat: 'jpeg' | 'png';
  referenceImageName?: string;
};

export type PromptDocument = {
  language: PromptLanguage;
  descriptivePrompt: string;
  technicalParameters: string;
  negativePrompt: string;
  fullText: string;
};

export const aspectRatios = [
  { label: 'Portrait', value: '4:5' },
  { label: 'Quadrat', value: '1:1' },
  { label: 'Querformat', value: '4:3' },
  { label: 'Mobiles Porträt', value: '9:16' },
  { label: 'Breit', value: '5:3' },
];

export const artistNames = [
  'J.M.W. Turner',
  'John Berkey',
  'Zdzisław Beksiński',
  'Caravaggio',
  'Roy Lichtenstein',
  'Romero Britto',
  'Atey Ghailan',
  'Krenz Cushart',
  'Ray Caesar',
  'Takeshi Obata',
  'Vincenzo Galdi',
  'Jean Agélou',
  'Gerhard Riebicke',
  'Magnus Weidemann',
  'Friedrich Seidenstücker',
  'Lotte Herrlich',
  'Hermann Schieberth',
  'Rudolf Koppitz',
  'Albert Arthur Allen',
  'Ewald Hoinkis',
  'Konrad Helbig',
  'Günter Rössler',
  'Günter Gueffroy',
  'Amos Badertscher',
  'Klaus Ender',
  'Eikoh Hosoe',
  'David Hamilton',
  'Jeanloup Sieff',
  'Douglas Kirkland',
  'Peter Hujar',
  'Jan Saudek',
  'George Dureau',
  'Robert Mapplethorpe',
  'Paolo Roversi',
  'Dominique Isserman',
  'Andreas H. Bitesnich',
  'Karl Vanselow',
  'Jean-Baptiste Huynh',
  'Sylvie Blum',
  'Jiří Růžek',
  'Manfred Baumann',
  'Petter Hegre',
  'Henrik Pfeifer',
  'Ron Kuhwede',
  'Bjarne Jonasson',
  'Astrid Susanna Schulz',
  'Martin Rehm',
  'Aneta Bartos',
  'Juha Arvid Helminen',
  'Oliver Rath',
  'Niels van Roij',
  'Adrian Hamilton',
  'burak bulut Yıldırım',
];

export const options: Record<OptionKey, { label: string; values: string[] }> = {
  motif: {
    label: 'Motiv',
    values: [
      'Portrait', 'Landscape', 'Architecture', 'Animal', 'Abstract', 'Still Life',
      'Fantasy Scene', 'Sci-Fi Scene',
    ],
  },
  artistA: { label: 'Künstler A (Basisstil)', values: artistNames },
  artistB: { label: 'Künstler B (Fusion)', values: artistNames },
  fusion: {
    label: 'Fusionstyp',
    values: [
      'Atmosphärische Sci-Fi-Romantik',
      'Düstere Manga-Surrealwelt',
      'Neon-Pop-Comic',
      'Barock-Fashion-Manga',
      'Cinematic Dark Fantasy',
      'Digital Surreal Couture',
    ],
  },
  composition: {
    label: 'Komposition',
    values: ['Weitwinkel', 'Close-Up', 'Dramatische Perspektive', 'Zentralperspektive', 'Vogelperspektive'],
  },
  lighting: {
    label: 'Licht',
    values: ['Cinematic Lighting', 'Golden Hour', 'Chiaroscuro', 'Soft Diffused Light', 'Hard Rim Light'],
  },
  palette: {
    label: 'Farbwelt',
    values: ['Gedämpft', 'Neon', 'Pastell', 'Erdig', 'Monochrom'],
  },
  detail: {
    label: 'Detailgrad',
    values: ['Hyperdetailliert', 'Malerisch', 'Fotorealistisch', 'Minimalistisch'],
  },
};

export const tagGroups: TagGroup[] = [
  {
    key: 'style',
    label: 'Style',
    values: [
      'photorealistic', 'digital art', 'artistic', 'watercolor', 'oil painting',
      'chalk drawing', 'pencil sketch', 'street art', 'baroque', 'coloring book',
      'Art Nouveau', 'anthropomorphic', 'vintage boho', 'medieval', 'surreal',
      'scary', 'ink sketch', 'paint splashes', 'cute character',
      'miniature diorama', 'pop art', 'inkpunk', '3D', 'cyberpunk', 'cartoon',
      'anime style', 'concept art', 'fantasy art', 'avant-garde editorial',
      'high fashion editorial', 'cinematic documentary', 'Vogue Italia aesthetic',
      'Peter Lindbergh style', 'Mario Testino style', 'fine art photography',
      'street photography', 'romantic portrait', 'glamour photography',
      'soft cinematic mood', 'tasteful fashion editorial', 'luxury magazine aesthetic',
    ],
  },
  {
    key: 'camera',
    label: 'Kamera & Objektiv',
    values: [
      'raw iPhone photo', 'casual smartphone photo', 'Selfie aufgenommen mit iPhone 15',
      'lässiges Handyfoto', 'IMG_XXXX.HEIC', 'image_1025.CR2', 'Canon EOS 5D',
      'Nikon Z9', 'Sony A7R IV', '50mm Objektiv f/1.8', '85mm Objektiv',
      'geringe Tiefenschärfe', 'candid shot', 'realistic photograph',
    ],
  },
  {
    key: 'editorial',
    label: 'Editorial & Referenzen',
    values: [
      'avantgardistische Editorial-Fotografie', 'High-Fashion-Editorial',
      'cineastisches Mode-Editorial', 'Vogue Italia', 'Numéro', 'Interview Magazine',
      'Harper’s Bazaar', 'W Magazine', 'i-D', 'Another Magazine', 'Dazed',
      'Love Magazine', 'CR Fashion Book', 'Mario Testino', 'Peter Lindbergh',
      'Mert & Marcus', 'Inez & Vinoodh', 'Tim Walker', 'Elizaveta Porodina',
    ],
  },
  {
    key: 'mood',
    label: 'Mood / Stimmung',
    values: [
      'romantic atmosphere', 'dreamy mood', 'elegant', 'warm and intimate',
      'soft and graceful', 'confident expression', 'calm presence',
      'poetic composition', 'sophisticated tone', 'gentle expression',
    ],
  },
  {
    key: 'environment',
    label: 'Szene & Atmosphäre',
    values: [
      'minimalistisches Studio mit Betonwänden', 'industrielles Loft',
      'verlassener Strand bei Sonnenuntergang', 'modernistische Villa mit Marmor und Glas',
      'cineastisches Boudoir', 'romantische Atmosphäre', 'avantgardistische Atmosphäre',
      'raffinierte und kraftvolle Stimmung', 'dichte Theaternebel-Atmosphäre',
      'schimmernder Kräuterdampf',
    ],
  },
  {
    key: 'human',
    label: 'Menschliche Details',
    values: [
      'natürliche Hautstruktur mit sichtbaren Poren', 'kleine Unreinheiten',
      'feine Falten', 'realistische Hautdetails', 'abstehende Haare',
      'leichte Gesichtsasymmetrie', 'spontaner Gesichtsausdruck', 'echtes Lächeln',
      'neutraler Blick', 'in Bewegung aufgenommen', 'leichte Kopfneigung',
      'natürliche Haltung', 'nicht perfekt zentriert', 'professionelles Model',
      'selbstbewusste und elegante Pose',
    ],
  },
  {
    key: 'detailTags',
    label: 'Detail-Tags',
    values: [
      'natural fabric texture', 'soft skin highlights', 'refined facial features',
      'subtle jewelry', 'flowing hair', 'clean background', 'gentle contrast',
      'balanced color palette', 'delicate shadows', 'polished composition',
    ],
  },
  {
    key: 'quality',
    label: 'Quality & Resolution',
    values: [
      'masterpiece', '8K resolution', 'sharp focus on face', 'best quality',
      'intricate details', 'professional', 'award winning', 'ultra high resolution',
      'studio quality', 'crisp texture detail', 'soft background bokeh',
    ],
  },
  {
    key: 'technical',
    label: 'Technical Parameters',
    values: [
      'guidance scale 1.5', 'guidance scale 2.5', 'guidance scale 3.5',
      '--style raw', '--stylize 0', '--v 6', 'natural skin texture:1.3',
      'f/1.8 aperture', 'f/2.0 aperture', 'ISO 400', '1/125s shutter speed',
      'wide open aperture',
    ],
  },
  {
    key: 'postProcessing',
    label: 'Finaler Stil & Nachbearbeitung',
    values: [
      'unfiltered', 'authentic', 'no style raw', 'natürliches Bildrauschen',
      'subtile Bewegungsunschärfe', 'leichte Lens Flares', 'natürliches Kantenlicht',
      'weiche Schatten von der Seite', 'Color Grading', 'maximale Auflösung',
      'fotorealistische Details', 'Editorial-Meisterwerk',
    ],
  },
  {
    key: 'negativeTags',
    label: 'Negative Tags',
    values: [
      'blurry', 'low quality', 'bad anatomy', 'extra limbs', 'deformed', 'ugly',
      'watermark', 'signature', 'text', 'cropped', 'plastic skin', 'waxy skin',
      'airbrushed', 'over-smoothed face', 'perfect symmetry', 'doll-like',
      'uncanny valley', 'artificial lighting', 'glossy skin', 'CGI', '3D render',
      'cartoon', 'anime', 'illustration', 'painting', 'drawing',
      'oversaturated colors', 'studio lighting', 'no makeup filter',
      'deformed hands', 'extra fingers', 'mutated anatomy',
    ],
  },
];

export const initialTagSelections: Record<TagGroupKey, string[]> = {
  style: ['photorealistic'],
  camera: [],
  editorial: [],
  mood: [],
  environment: [],
  human: [],
  detailTags: [],
  quality: [],
  technical: [],
  postProcessing: [],
  negativeTags: [],
};

export const exclusiveTagGroups: Partial<Record<TagGroupKey, string[][]>> = {
  technical: [
    ['guidance scale 1.5', 'guidance scale 2.5', 'guidance scale 3.5'],
    ['f/1.8 aperture', 'f/2.0 aperture', 'wide open aperture'],
  ],
};

export const crossGroupConflicts: Array<[TagGroupKey, string, TagGroupKey, string]> = [
  ['style', 'anime style', 'negativeTags', 'anime'],
  ['style', 'cartoon', 'negativeTags', 'cartoon'],
  ['style', 'oil painting', 'negativeTags', 'painting'],
  ['style', 'watercolor', 'negativeTags', 'painting'],
  ['style', 'pencil sketch', 'negativeTags', 'drawing'],
  ['style', 'chalk drawing', 'negativeTags', 'drawing'],
  ['style', 'ink sketch', 'negativeTags', 'drawing'],
  ['style', '3D', 'negativeTags', '3D render'],
];

const semanticAliases: Record<string, string> = {
  fotorealistisch: 'photorealistic',
  'realistic photograph': 'photorealistic',
  'realistisches foto': 'photorealistic',
  '8k auflösung': '8k resolution',
  hochdetailliert: 'intricate details',
  'weicher hintergrund bokeh': 'soft background bokeh',
};

const englishLabels: Record<string, string> = {
  Motiv: 'Motif',
  'Künstler A (Basisstil)': 'Artist A (base style)',
  'Künstler B (Fusion)': 'Artist B (fusion style)',
  Fusionstyp: 'Fusion type',
  Farbwelt: 'Color palette',
  Detailgrad: 'Detail level',
  'Style-Tags': 'Style tags',
  'Kamera & Objektiv': 'Camera & lens',
  'Editorial & Referenzen': 'Editorial & references',
  'Quality & Resolution': 'Quality & resolution',
  'Finaler Stil & Nachbearbeitung': 'Finishing & post-processing',
  Mood: 'Mood',
  'Szene & Atmosphäre': 'Scene & atmosphere',
  'Menschliche Details': 'Human details',
  'Detail-Tags': 'Detail tags',
  Komposition: 'Composition',
  Licht: 'Lighting',
  'Negative Prompt': 'Negative prompt',
};

const englishValues: Record<string, string> = {
  'Atmosphärische Sci-Fi-Romantik': 'atmospheric sci-fi romance',
  'Düstere Manga-Surrealwelt': 'dark manga surrealism',
  'Neon-Pop-Comic': 'neon pop comic',
  'Barock-Fashion-Manga': 'baroque fashion manga',
  'Cinematic Lighting': 'cinematic lighting',
  'Golden Hour': 'golden hour',
  'Soft Diffused Light': 'soft diffused light',
  'Hard Rim Light': 'hard rim light',
  Gedämpft: 'muted',
  Pastell: 'pastel',
  Erdig: 'earthy',
  Monochrom: 'monochrome',
  CloseUp: 'close-up',
  'Close-Up': 'close-up',
  Hyperdetailliert: 'highly detailed',
  Malerisch: 'painterly',
  Fotorealistisch: 'photorealistic',
  Minimalistisch: 'minimalist',
  'romantische Atmosphäre': 'romantic atmosphere',
  'avantgardistische Atmosphäre': 'avant-garde atmosphere',
  'natürliches Bildrauschen': 'natural image grain',
  'subtile Bewegungsunschärfe': 'subtle motion blur',
  'leichte Lens Flares': 'subtle lens flares',
  'natürliches Kantenlicht': 'natural rim light',
  'weiche Schatten von der Seite': 'soft side shadows',
  'maximale Auflösung': 'maximum resolution',
  'fotorealistische Details': 'photorealistic details',
  'Editorial-Meisterwerk': 'editorial masterpiece',
  Weitwinkel: 'wide-angle',
  'Dramatische Perspektive': 'dramatic perspective',
  Zentralperspektive: 'one-point perspective',
  Vogelperspektive: "bird's-eye view",
  'Natürliches Studio mit Betonwänden': 'minimalist concrete studio',
  'minimalistisches Studio mit Betonwänden': 'minimalist concrete studio',
  'industrielles Loft': 'industrial loft',
  'verlassener Strand bei Sonnenuntergang': 'deserted beach at sunset',
  'modernistische Villa mit Marmor und Glas': 'modernist villa with marble and glass',
  'cineastisches Boudoir': 'cinematic boudoir',
  'raffinierte und kraftvolle Stimmung': 'refined and powerful mood',
  'dichte Theaternebel-Atmosphäre': 'dense theatrical fog',
  'schimmernder Kräuterdampf': 'shimmering herbal vapor',
  'natürliche Hautstruktur mit sichtbaren Poren': 'natural skin texture with visible pores',
  'kleine Unreinheiten': 'small imperfections',
  'feine Falten': 'fine wrinkles',
  'realistische Hautdetails': 'realistic skin details',
  'abstehende Haare': 'loose flyaway hair',
  'leichte Gesichtsasymmetrie': 'subtle facial asymmetry',
  'spontaner Gesichtsausdruck': 'candid expression',
  'echtes Lächeln': 'genuine smile',
  'neutraler Blick': 'neutral gaze',
  'in Bewegung aufgenommen': 'captured in motion',
  'leichte Kopfneigung': 'slight head tilt',
  'natürliche Haltung': 'natural posture',
  'nicht perfekt zentriert': 'intentionally off-center framing',
  'professionelles Model': 'professional model',
  'selbstbewusste und elegante Pose': 'confident, elegant pose',
  'High-Fashion-Editorial': 'high-fashion editorial',
  'cineastisches Mode-Editorial': 'cinematic fashion editorial',
  'avantgardistische Editorial-Fotografie': 'avant-garde editorial photography',
  'lässiges Handyfoto': 'casual phone photo',
  'Selfie aufgenommen mit iPhone 15': 'iPhone 15 selfie',
  '50mm Objektiv f/1.8': '50mm lens at f/1.8',
  '85mm Objektiv': '85mm lens',
  'geringe Tiefenschärfe': 'shallow depth of field',
};

export const fieldOrder: OptionKey[] = [
  'motif', 'artistA', 'artistB', 'fusion', 'composition', 'lighting', 'palette', 'detail',
];

export const emptyPromptAudit: PromptAudit = { duplicates: [], conflicts: [] };

export function normalizePromptValue(value: string) {
  const normalized = value.toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return semanticAliases[normalized] ?? normalized;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function auditPrompt(
  selections: Record<TagGroupKey, string[]>,
  negativePrompt: string,
  form?: FormState,
): PromptAudit {
  const entries = Object.entries(selections).flatMap(([group, values]) =>
    values.map((value) => ({ group, value, key: normalizePromptValue(value) })),
  );
  if (form) {
    entries.push(
      ...Object.entries(form).map(([group, value]) => ({
        group,
        value,
        key: normalizePromptValue(value),
      })),
    );
    if (normalizePromptValue(form.artistA) === normalizePromptValue(form.artistB)) {
      entries.push({ group: 'same-artist', value: form.artistA, key: normalizePromptValue(form.artistA) });
    }
  }
  const manualNegative = negativePrompt
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ group: 'Negative Prompt', value, key: normalizePromptValue(value) }));
  const allEntries = [...entries, ...manualNegative];
  const duplicates = uniqueValues(
    allEntries
      .filter((entry, index, values) => values.some((other, otherIndex) => (
        otherIndex !== index && entry.key && entry.key === other.key
      )))
      .map((entry) => entry.value),
  );
  const conflicts: string[] = [];
  for (const [leftGroup, leftTag, rightGroup, rightTag] of crossGroupConflicts) {
    const leftSelected = selections[leftGroup].some(
      (value) => normalizePromptValue(value) === normalizePromptValue(leftTag),
    );
    const rightSelected = selections[rightGroup].some(
      (value) => normalizePromptValue(value) === normalizePromptValue(rightTag),
    ) || manualNegative.some((entry) => entry.key === normalizePromptValue(rightTag));
    if (leftSelected && rightSelected) conflicts.push(`${leftTag} ↔ ${rightTag}`);
  }
  for (const group of exclusiveTagGroups.technical ?? []) {
    const selected = selections.technical.filter((value) => group.includes(value));
    if (selected.length > 1) conflicts.push(selected.join(' ↔ '));
  }
  return { duplicates, conflicts: uniqueValues(conflicts) };
}

function translateValue(value: string, language: PromptLanguage) {
  return language === 'en' ? englishValues[value] ?? value : value;
}

function translateGroupLabel(label: string, language: PromptLanguage) {
  if (language === 'de') return label;
  return englishLabels[label] ?? label;
}

function listValue(values: string[], fallback: string, language: PromptLanguage) {
  return values.length > 0
    ? values.map((value) => translateValue(value, language)).join(', ')
    : fallback;
}

export function buildPromptDocument(
  input: PromptBuilderInput,
  language: PromptLanguage,
): PromptDocument {
  const english = language === 'en';
  const label = (german: string) => translateGroupLabel(german, language);
  const list = (key: TagGroupKey, fallback: string) => listValue(
    input.tagSelections[key],
    fallback,
    language,
  );
  const artistBWeight = 100 - input.artistAWeight;
  const technicalTags = input.tagSelections.technical
    .filter((value) => !/^guidance scale \d+(?:\.\d+)?$/i.test(value));
  const descriptivePrompt = [
    'STYLE',
    `${label(options.motif.label)}: ${translateValue(input.form.motif, language)}`,
    `${label(options.artistA.label)} (${input.artistAWeight}%): ${input.form.artistA}`,
    `${label(options.artistB.label)} (${artistBWeight}%): ${input.form.artistB}`,
    `${label(options.fusion.label)}: ${translateValue(input.form.fusion, language)}`,
    `${label(options.palette.label)}: ${translateValue(input.form.palette, language)}`,
    `${label(options.detail.label)}: ${translateValue(input.form.detail, language)}`,
    `${label('Style-Tags')}: ${list('style', english ? 'none' : 'keine')}`,
    `${label('Kamera & Objektiv')}: ${list('camera', english ? 'none' : 'keine')}`,
    `${label('Editorial & Referenzen')}: ${list('editorial', english ? 'none' : 'keine')}`,
    `${label('Quality & Resolution')}: ${list('quality', english ? 'standard' : 'Standard')}`,
    `${label('Finaler Stil & Nachbearbeitung')}: ${list('postProcessing', english ? 'none' : 'keine')}`,
    '',
    english ? 'MOOD & SCENE' : 'STIMMUNG & SZENE',
    `${label('Mood')}: ${list('mood', english ? 'neutral' : 'neutral')}`,
    `${label('Szene & Atmosphäre')}: ${list('environment', english ? 'none' : 'keine')}`,
    `${label('Menschliche Details')}: ${list('human', english ? 'none' : 'keine')}`,
    `${label('Detail-Tags')}: ${list('detailTags', english ? 'none' : 'keine')}`,
    `${label('Komposition')}: ${translateValue(input.form.composition, language)}`,
    `${label('Licht')}: ${translateValue(input.form.lighting, language)}`,
    `${english ? 'Reference image' : 'Referenzbild'}: ${input.referenceImageName ?? (english ? 'none' : 'keines')}`,
  ].join('\n');
  const technicalParameters = [
    english ? 'TECHNICAL PARAMETERS' : 'TECHNISCHE PARAMETER',
    `${english ? 'Aspect ratio' : 'Seitenverhältnis'}: ${input.aspectRatio}`,
    `${english ? 'Seed' : 'Seed'}: ${input.seed || (english ? 'random' : 'zufällig')}`,
    `${english ? 'Image count' : 'Bildanzahl'}: ${input.batchCount || '1'}`,
    `${english ? 'Guidance scale' : 'Guidance Scale'}: ${input.guidanceScale}`,
    `${english ? 'Inference steps' : 'Inferenzschritte'}: ${input.inferenceSteps}`,
    `${english ? 'Image-to-image strength' : 'Referenzbild-Stärke'}: ${input.strength}`,
    `${english ? 'Output format' : 'Ausgabeformat'}: ${input.outputFormat.toUpperCase()}`,
    `${english ? 'Extra technical tags' : 'Weitere technische Tags'}: ${listValue(technicalTags, english ? 'none' : 'keine', language)}`,
  ].join('\n');
  const negativePrompt = uniqueValues([
    ...input.tagSelections.negativeTags,
    ...input.negativePrompt.split(','),
  ]).map((value) => translateValue(value, language)).join(', ');
  const negativeBlock = `${label('Negative Prompt')}: ${negativePrompt || (english ? 'none' : 'keine')}`;
  return {
    language,
    descriptivePrompt,
    technicalParameters,
    negativePrompt,
    fullText: [descriptivePrompt, technicalParameters, negativeBlock].join('\n\n'),
  };
}

const defaultFormValues = Object.fromEntries(
  Object.entries(options).map(([key, config]) => [key, config.values[0]]),
) as FormState;

export const initialState: FormState = {
  ...defaultFormValues,
  artistB: options.artistB.values[1] ?? defaultFormValues.artistB,
};
