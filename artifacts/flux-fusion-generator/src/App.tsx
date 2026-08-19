import { type ChangeEvent, useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  Command,
  Copy,
  ImagePlus,
  Info,
  Layers3,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';

type OptionKey =
  | 'motif'
  | 'artistA'
  | 'artistB'
  | 'fusion'
  | 'composition'
  | 'lighting'
  | 'palette'
  | 'detail';

type FormState = Record<OptionKey, string>;

type TagGroupKey = 'style' | 'mood' | 'detailTags' | 'quality' | 'technical' | 'negativeTags';

type TagGroup = {
  key: TagGroupKey;
  label: string;
  values: string[];
};

const styleDetails = [
  'realistic', 'photorealistic', 'digital draw style', 'detailed', 'artistic',
  'Watercolor', 'cyberpunk', 'Aquarell', 'Kreide', 'Cartoon', 'Scetch',
  'Ölgemälde', 'Bleistiftzeichnung', 'Strassenkunst', 'barock', 'Malbuch',
  'Jugendstil', 'anthropomorph', 'vintage Boho', 'mittelalterlich', 'surreal',
  'gruselig', 'tintenskizze', 'farbspritzer', 'niedlicher Charakter',
  'miniatur diorama', 'Popart', 'inkpunk', '3D',
];

const aspectRatios = [
  { label: 'Portrait', value: '4:5' },
  { label: 'Quadrat', value: '1:1' },
  { label: 'Querformat', value: '4:3' },
  { label: 'Mobiles Porträt', value: '9:16' },
  { label: 'Breit', value: '5:3' },
];

const options: Record<OptionKey, { label: string; values: string[] }> = {
  motif: {
    label: 'Motiv',
    values: [
      'Portrait', 'Landschaft', 'Landscape', 'Architektur', 'Architecture', 'Animal',
      'Abstract', 'Still Life', 'Fantasy Scene', 'Sci-Fi Scene', 'Sci-Fi', 'Fantasy',
      'Surrealismus',
    ],
  },
  artistA: {
    label: 'Künstler A (Basisstil)',
    values: [
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
    ],
  },
  artistB: {
    label: 'Künstler B (Fusion)',
    values: [
      'John Berkey',
      'J.M.W. Turner',
      'Zdzisław Beksiński',
      'Caravaggio',
      'Roy Lichtenstein',
      'Romero Britto',
      'Atey Ghailan',
      'Krenz Cushart',
      'Ray Caesar',
      'Takeshi Obata',
    ],
  },
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

const tagGroups: TagGroup[] = [
  {
    key: 'style',
    label: 'Style',
    values: [
      'photorealistic', 'anime style', 'digital art', 'oil painting', 'concept art',
      'watercolor', '8k render', 'fantasy art', 'avant-garde editorial',
      'high fashion editorial', 'cinematic documentary', 'Vogue Italia aesthetic',
      'Peter Lindbergh style', 'Mario Testino style', 'fine art photography',
      'street photography', 'romantic portrait', 'glamour photography',
      'soft cinematic mood', 'tasteful fashion editorial', 'luxury magazine aesthetic',
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
    key: 'detailTags',
    label: 'Detail',
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
      'masterpiece', 'high detail', '8K resolution', 'sharp focus on face',
      'best quality', 'intricate details', 'professional', 'award winning',
      'ultra high resolution', 'hyper detailed', 'studio quality',
      'crisp texture detail', 'soft background bokeh',
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

const initialTagSelections: Record<TagGroupKey, string[]> = {
  style: ['photorealistic'],
  mood: [],
  detailTags: [],
  quality: [],
  technical: [],
  negativeTags: [],
};

const initialState: FormState = Object.fromEntries(
  Object.entries(options).map(([key, config]) => [key, config.values[0]]),
) as FormState;

const fieldOrder: OptionKey[] = ['motif', 'artistA', 'artistB', 'fusion', 'composition', 'lighting', 'palette', 'detail'];

function App() {
  const [form, setForm] = useState<FormState>(initialState);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['realistic', 'detailed']);
  const [tagSelections, setTagSelections] = useState<Record<TagGroupKey, string[]>>(initialTagSelections);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('42');
  const [batchCount, setBatchCount] = useState('1');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'generated' | 'copied' | 'error'>('idle');

  const promptLength = useMemo(() => prompt.length, [prompt]);

  function updateField(key: OptionKey, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (status !== 'idle') setStatus('idle');
  }

  function toggleStyle(style: string) {
    setSelectedStyles((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style],
    );
    if (status !== 'idle') setStatus('idle');
  }

  function toggleTag(group: TagGroupKey, tag: string) {
    setTagSelections((current) => ({
      ...current,
      [group]: current[group].includes(tag)
        ? current[group].filter((item) => item !== tag)
        : [...current[group], tag],
    }));
    if (status !== 'idle') setStatus('idle');
  }

  function handleReferenceImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(file);
    setReferencePreview(URL.createObjectURL(file));
    if (status !== 'idle') setStatus('idle');
  }

  function removeReferenceImage() {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(null);
    setReferencePreview('');
  }

  function generatePrompt() {
    const selectedTagValues = (group: TagGroupKey) => tagSelections[group];
    const styleTags = [...selectedStyles, ...selectedTagValues('style')];
    const negativeTags = [...selectedTagValues('negativeTags'), negativePrompt.trim()]
      .filter(Boolean)
      .join(', ');
    const nextPrompt =
      `Style: Motiv ${form.motif}; Künstler A (Basisstil) ${form.artistA}; Künstler B (Fusion) ${form.artistB}; ` +
      `Fusionstyp ${form.fusion}; Farbwelt ${form.palette}; Detailgrad ${form.detail}; ` +
      `Art Style Details ${styleTags.length ? styleTags.join(', ') : 'keine zusätzlichen Stil-Details'}; ` +
      `Qualität & Auflösung ${selectedTagValues('quality').join(', ') || 'Standard'}. ` +
      `Stimmung: ${selectedTagValues('mood').join(', ') || 'neutral'}; ` +
      `Detail-Tags ${selectedTagValues('detailTags').join(', ') || 'keine'}; ` +
      `Komposition ${form.composition}; Licht ${form.lighting}; Aspekt Ratio (--ar) ${aspectRatio}; ` +
      `Technische Parameter ${selectedTagValues('technical').join(', ') || 'keine'}; ` +
      `Negative Prompt ${negativeTags || 'keine'}; Seed ${seed || 'zufällig'}; ` +
      `Anzahl Bilder (n) ${batchCount || '1'}; ` +
      `Referenzbild ${referenceImage ? `${referenceImage.name} — als Base Image für Komposition, Farben oder Stil` : 'keines'}. ` +
      'Rendering: hochauflösend, sauber, klar.';
    setPrompt(nextPrompt);
    setStatus('generated');
    window.setTimeout(() => document.getElementById('prompt-output')?.focus(), 0);
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }

  function resetAll() {
    setForm(initialState);
    setSelectedStyles(['realistic', 'detailed']);
    setTagSelections(initialTagSelections);
    setAspectRatio('4:5');
    setNegativePrompt('');
    setSeed('42');
    setBatchCount('1');
    removeReferenceImage();
    setPrompt('');
    setStatus('idle');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-home" aria-label="Flux Stil-Fusion Generator Startseite">
          <span className="brand-mark" aria-hidden="true"><WandSparkles size={18} strokeWidth={1.8} /></span>
          <span>flux / studio</span>
        </a>
        <nav className="topnav" aria-label="Hauptnavigation">
          <a className="nav-link" href="#studio" data-testid="link-studio">Generator</a>
          <a className="nav-link" href="#about" data-testid="link-about">Arbeitsweise</a>
          <a className="nav-link download-link" href={`${import.meta.env.BASE_URL}flux-generator-download.zip`} download>
            ZIP herunterladen
          </a>
          <button className="nav-button" type="button" onClick={resetAll} data-testid="button-reset-top">
            <RotateCcw size={14} />
            Zurücksetzen
          </button>
        </nav>
      </header>

      <main className="page-content">
        <section className="hero" id="about" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Kreativwerkzeug / 01</p>
            <h1 id="page-title">Stile kreuzen.<br /><em>Welten öffnen.</em></h1>
            <p className="hero-copy">
              Ein fokussierter Prompt-Generator für Bildideen mit eigener Handschrift. Kombiniere zwei visuelle Stimmen und gib deiner nächsten Szene eine Richtung.
            </p>
          </div>
          <div className="hero-stamp" aria-label="Motto: Make the unexpected visible">
            <span className="stamp-dot one" />
            <span className="stamp-dot two" />
            <span className="stamp-text">make the<br />unexpected<br />visible</span>
          </div>
        </section>

        <section className="workspace" id="studio" aria-label="Prompt Studio">
          <div className="panel controls-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Deine Zutaten</p>
                <h2 className="panel-title">Baue deine Fusion</h2>
              </div>
              <span className="step-count">20 Parameter</span>
            </div>

            <div className="field-grid">
              {fieldOrder.map((key, index) => {
                const config = options[key];
                return (
                  <div className={`field ${key === 'fusion' ? 'field-wide' : ''}`} key={key}>
                    <label className="field-label" htmlFor={`select-${key}`}>
                      {config.label}
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </label>
                    <div className="select-wrap">
                      <select
                        className="field-select"
                        id={`select-${key}`}
                        value={form[key]}
                        onChange={(event) => updateField(key, event.target.value)}
                        data-testid={`select-${key}`}
                      >
                        {config.values.map((value) => <option value={value} key={value}>{value}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="advanced-fields">
              <div className="field field-wide">
                <div className="field-label">
                  Art Style Details
                  <span>09</span>
                </div>
                <p className="field-help">Wähle einen oder mehrere visuelle Stilimpulse.</p>
                <div className="style-chips" aria-label="Art Style Details">
                  {styleDetails.map((style) => (
                    <button
                      className={`style-chip ${selectedStyles.includes(style) ? 'selected' : ''}`}
                      type="button"
                      key={style}
                      aria-pressed={selectedStyles.includes(style)}
                      onClick={() => toggleStyle(style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field field-wide">
                <div className="tag-group-grid">
                  {tagGroups.map((group) => (
                    <div className="tag-group" key={group.key}>
                      <div className="field-label">
                        {group.label}
                        <span>{group.values.length} Tags</span>
                      </div>
                      <div className="style-chips" aria-label={group.label}>
                        {group.values.map((tag) => (
                          <button
                            className={`style-chip ${tagSelections[group.key].includes(tag) ? 'selected' : ''}`}
                            type="button"
                            key={tag}
                            aria-pressed={tagSelections[group.key].includes(tag)}
                            onClick={() => toggleTag(group.key, tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="select-aspect-ratio">
                  Aspekt Ratio
                  <span>10</span>
                </label>
                <div className="select-wrap">
                  <select
                    className="field-select"
                    id="select-aspect-ratio"
                    value={aspectRatio}
                    onChange={(event) => setAspectRatio(event.target.value)}
                    data-testid="select-aspect-ratio"
                  >
                    {aspectRatios.map((ratio) => (
                      <option value={ratio.value} key={ratio.value}>
                        {ratio.label} ({ratio.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="seed">
                  Seed
                  <span>11</span>
                </label>
                <input
                  className="field-input"
                  id="seed"
                  type="number"
                  min="0"
                  step="1"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder="z. B. 42"
                  data-testid="input-seed"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="batch-count">
                  Anzahl Bilder / Batch Count
                  <span>12</span>
                </label>
                <input
                  className="field-input"
                  id="batch-count"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={batchCount}
                  onChange={(event) => setBatchCount(event.target.value)}
                  data-testid="input-batch-count"
                />
              </div>

              <div className="field field-wide">
                <label className="field-label" htmlFor="negative-prompt">
                  Negative Prompt
                  <span>13</span>
                </label>
                <textarea
                  className="field-textarea"
                  id="negative-prompt"
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="z. B. no watermarks, distorted hands, extra fingers"
                  rows={3}
                  data-testid="textarea-negative-prompt"
                />
              </div>

              <div className="field field-wide">
                <div className="field-label">
                  Referenz / Base Image
                  <span>14</span>
                </div>
                {!referenceImage ? (
                  <label className="upload-zone" htmlFor="reference-image">
                    <ImagePlus size={20} />
                    <span><strong>Bild hochladen</strong> oder hier auswählen</span>
                    <small>JPG, PNG oder WEBP · dient als visuelle Referenz</small>
                    <input
                      id="reference-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleReferenceImage}
                      data-testid="input-reference-image"
                    />
                  </label>
                ) : (
                  <div className="reference-card">
                    <img src={referencePreview} alt={`Vorschau von ${referenceImage.name}`} />
                    <div className="reference-info">
                      <strong>{referenceImage.name}</strong>
                      <span>{Math.max(1, Math.round(referenceImage.size / 1024))} KB · wird als Referenz eingebunden</span>
                    </div>
                    <button
                      className="remove-image"
                      type="button"
                      onClick={removeReferenceImage}
                      aria-label="Referenzbild entfernen"
                      data-testid="button-remove-reference"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="controls-footer">
              <div className="hint"><Info size={14} /> Alle Werte und Bilder bleiben in deinem Browser.</div>
              <button className="action-button" type="button" onClick={generatePrompt} data-testid="button-generate">
                <Sparkles size={16} />
                Prompt erzeugen
              </button>
            </div>
          </div>

          <div className="panel output-panel" aria-live="polite">
            <div className="output-top">
              <div>
                <p className="panel-kicker">Dein Ergebnis</p>
                <h2 className="panel-title">Prompt Canvas</h2>
              </div>
              <span className="output-mark" aria-hidden="true"><Layers3 size={18} /></span>
            </div>

            {!prompt ? (
              <div className="output-empty" data-testid="empty-output">
                <Command size={26} strokeWidth={1.4} />
                <p>Wähle deine Zutaten und klicke auf „Prompt erzeugen“.<br />Deine Bildidee wartet schon.</p>
              </div>
            ) : (
              <div className="prompt-box">
                <textarea
                  id="prompt-output"
                  className="prompt-text"
                  value={prompt}
                  readOnly
                  aria-label="Generierter Prompt"
                  data-testid="textarea-output"
                />
                <div className="prompt-meta">
                  <span>{promptLength} Zeichen / DE</span>
                  <button className="copy-button" type="button" onClick={copyPrompt} data-testid="button-copy">
                    {status === 'copied' ? <Check size={14} /> : <Copy size={14} />}
                    {status === 'copied' ? 'Kopiert' : 'Kopieren'}
                  </button>
                </div>
              </div>
            )}

            <div className="output-actions">
              <span className={`status-message ${status === 'error' ? 'error' : ''}`} data-testid="status-message">
                {status === 'generated' && <><Check size={13} /> Prompt bereit</>}
                {status === 'copied' && <><Check size={13} /> In die Zwischenablage kopiert</>}
                {status === 'error' && <><Clipboard size={13} /> Kopieren nicht möglich — bitte Text markieren</>}
                {status === 'idle' && 'Noch kein Prompt erzeugt'}
              </span>
              <button className="text-button" type="button" onClick={resetAll} data-testid="button-reset">
                <RotateCcw size={13} /> Alles zurücksetzen
              </button>
            </div>
          </div>
        </section>

        <section className="notes-strip" aria-label="Hinweise zur Arbeitsweise">
          <div className="note-item">
            <span className="note-number">01</span>
            <div><strong>Basis trifft Kontrast</strong><p>Der erste Stil gibt deiner Szene Haltung. Der zweite bringt Reibung.</p></div>
          </div>
          <div className="note-item">
            <span className="note-number">02</span>
            <div><strong>Weniger ist präziser</strong><p>Jede Auswahl ist ein bewusst gesetzter Impuls für dein Modell.</p></div>
          </div>
          <div className="note-item">
            <span className="note-number">03</span>
            <div><strong>Direkt weiterarbeiten</strong><p>Prompt kopieren und dort einsetzen, wo deine Bilder entstehen.</p></div>
          </div>
        </section>

        <footer className="footer">
          <span>Flux Stil-Fusion Generator</span>
          <span>Ein kleines Studio für große Bilder</span>
        </footer>
      </main>
    </div>
  );
}

export default App;