import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Archive, Check, Clipboard, Command, Copy, Download, ImagePlus,
  Layers3, LoaderCircle, Plus, RotateCcw, Save, Sparkles, Trash2, WandSparkles, X,
} from 'lucide-react';
import { useGenerateImages, useGetGenerationStatus } from '@workspace/api-client-react';
import type { GenerateImageInput, GenerateImageResult } from '@workspace/api-client-react';
import {
  aspectRatios, artistNames, auditPrompt, buildPromptDocument, crossGroupConflicts,
  emptyPromptAudit, exclusiveTagGroups, fieldOrder, initialState, initialTagSelections,
  options, tagGroups, type FormState, type PromptAudit, type PromptDocument,
  type PromptLanguage, type TagGroupKey,
} from './lib/promptBuilder';
import { addArchiveImages, deleteArchiveImage, downloadArchiveZip, getArchiveImages, type ArchiveImage } from './lib/localArchive';

type SavedPreset = { name: string; settings: Settings };
type Settings = {
  form: FormState; tags: Record<TagGroupKey, string[]>; aspect: string; negative: string;
  seed: string; count: string; weight: number; guidance: string; steps: string;
  strength: string; format: 'jpeg' | 'png'; language: PromptLanguage; customArtists?: string[];
};
const presetKey = 'flux-fusion-presets-v2';
const settingsKey = 'flux-fusion-settings-v2';
const ratios = aspectRatios;
const blankCustom: Record<TagGroupKey, string> = {
  style: '', camera: '', editorial: '', mood: '', environment: '', human: '',
  detailTags: '', quality: '', technical: '', postProcessing: '', negativeTags: '',
};

function imageDataUrl(item: Pick<ArchiveImage, 'data' | 'mimeType'>) {
  return `data:${item.mimeType};base64,${item.data}`;
}

function App() {
  const statusQuery = useGetGenerationStatus();
  const generateMutation = useGenerateImages();
  const [form, setForm] = useState<FormState>(initialState);
  const [tagSelections, setTagSelections] = useState<Record<TagGroupKey, string[]>>(initialTagSelections);
  const [customTags, setCustomTags] = useState(blankCustom);
  const [customArtists, setCustomArtists] = useState<string[]>([]);
  const [newArtist, setNewArtist] = useState('');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('42');
  const [batchCount, setBatchCount] = useState('1');
  const [artistAWeight, setArtistAWeight] = useState(60);
  const [guidanceScale, setGuidanceScale] = useState('3.5');
  const [inferenceSteps, setInferenceSteps] = useState('28');
  const [strength, setStrength] = useState('0.65');
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png'>('png');
  const [language, setLanguage] = useState<PromptLanguage>('de');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState('');
  const [document, setDocument] = useState<PromptDocument | null>(null);
  const [promptAudit, setPromptAudit] = useState<PromptAudit>(emptyPromptAudit);
  const [copied, setCopied] = useState(false);
  const [consent, setConsent] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [generationNotice, setGenerationNotice] = useState('');
  const [localError, setLocalError] = useState('');
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [gallery, setGallery] = useState<ArchiveImage[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const settings: Settings = useMemo(() => ({
    form, tags: tagSelections, aspect: aspectRatio, negative: negativePrompt, seed,
    count: batchCount, weight: artistAWeight, guidance: guidanceScale, steps: inferenceSteps,
    strength, format: outputFormat, language, customArtists,
  }), [form, tagSelections, aspectRatio, negativePrompt, seed, batchCount, artistAWeight, guidanceScale, inferenceSteps, strength, outputFormat, language, customArtists]);
  const allArtists = useMemo(() => [...new Set([...artistNames, ...customArtists])], [customArtists]);
  const audit = useMemo(() => auditPrompt(tagSelections, negativePrompt, form), [tagSelections, negativePrompt, form]);
  const generationEnabled = statusQuery.data?.enabled === true;
  const providerLabel = statusQuery.data?.provider ? `${statusQuery.data.provider} · ${statusQuery.data.model ?? 'Modell unbekannt'}` : 'Kein Anbieter verbunden';
  const generationAllowed = generationEnabled && consent && accessCode.trim().length > 0 && !generateMutation.isPending;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (saved) applySettings(JSON.parse(saved) as Settings);
      const storedPresets = localStorage.getItem(presetKey);
      if (storedPresets) setPresets(JSON.parse(storedPresets) as SavedPreset[]);
    } catch {
      setLocalError('Gespeicherte Einstellungen konnten nicht gelesen werden.');
    }
    getArchiveImages().then((items) => setGallery(items)).catch(() => setLocalError('Das lokale Archiv konnte nicht geladen werden.')).finally(() => setGalleryLoading(false));
  }, []);

  function applySettings(value: Settings) {
    setForm(value.form);
    setTagSelections(value.tags);
    setAspectRatio(value.aspect);
    setNegativePrompt(value.negative);
    setSeed(value.seed);
    setBatchCount(value.count);
    setArtistAWeight(value.weight);
    setGuidanceScale(value.guidance);
    setInferenceSteps(value.steps);
    setStrength(value.strength);
    setOutputFormat(value.format);
    setLanguage(value.language);
    setCustomArtists(value.customArtists ?? []);
    setDocument(null);
  }

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleTag(group: TagGroupKey, tag: string) {
    const guidanceTags = ['guidance scale 1.5', 'guidance scale 2.5', 'guidance scale 3.5'];
    if (group === 'technical' && guidanceTags.includes(tag)) {
      setGuidanceScale(tagSelections.technical.includes(tag) ? '3.5' : tag.replace('guidance scale ', ''));
    }
    setTagSelections((current) => {
      const next = { ...current, [group]: current[group].includes(tag) ? current[group].filter((item) => item !== tag) : [...current[group], tag] };
      if (!current[group].includes(tag)) {
        for (const exclusive of exclusiveTagGroups[group] ?? []) {
          if (exclusive.includes(tag)) next[group] = next[group].filter((item) => item === tag || !exclusive.includes(item));
        }
        for (const [leftGroup, leftTag, rightGroup, rightTag] of crossGroupConflicts) {
          if (group === leftGroup && tag === leftTag) next[rightGroup] = next[rightGroup].filter((item) => item !== rightTag);
          if (group === rightGroup && tag === rightTag) next[leftGroup] = next[leftGroup].filter((item) => item !== leftTag);
        }
      }
      return next;
    });
  }

  function updateGuidanceScale(value: string) {
    setGuidanceScale(value);
    const guidanceTags = ['guidance scale 1.5', 'guidance scale 2.5', 'guidance scale 3.5'];
    const matchingTag = guidanceTags.find((tag) => tag.endsWith(` ${value}`));
    setTagSelections((current) => {
      const remaining = current.technical.filter((tag) => !guidanceTags.includes(tag));
      return {
        ...current,
        technical: matchingTag ? [...remaining, matchingTag] : remaining,
      };
    });
  }

  function addCustomTag(group: TagGroupKey) {
    const tag = customTags[group].trim();
    if (!tag) return;
    setTagSelections((current) => current[group].some((item) => item.toLocaleLowerCase() === tag.toLocaleLowerCase())
      ? current : { ...current, [group]: [...current[group], tag] });
    setCustomTags((current) => ({ ...current, [group]: '' }));
  }

  function onReferenceChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLocalError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setLocalError('Bitte JPG, PNG oder WEBP auswählen.');
      event.target.value = '';
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setLocalError('Das Referenzbild darf höchstens 6 MB groß sein.');
      event.target.value = '';
      return;
    }
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(file);
    setReferencePreview(URL.createObjectURL(file));
  }

  function makeDocument() {
    const built = buildPromptDocument({
      form, tagSelections, negativePrompt, aspectRatio, seed, batchCount,
      artistAWeight, guidanceScale, inferenceSteps, strength, outputFormat,
      referenceImageName: referenceImage?.name,
    }, language);
    setDocument(built);
    setPromptAudit(auditPrompt(tagSelections, negativePrompt, form));
    return built;
  }

  async function copyPrompt() {
    const current = makeDocument();
    try {
      await navigator.clipboard.writeText(current.fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setLocalError('Kopieren nicht möglich — bitte den Prompt markieren.');
    }
  }

  function exportFile(type: 'txt' | 'json') {
    const current = makeDocument();
    const content = type === 'txt' ? current.fullText : JSON.stringify({ ...current, settings }, null, 2);
    const blob = new Blob([content], { type: type === 'txt' ? 'text/plain;charset=utf-8' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `flux-fusion-prompt.${type}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function savePreset() {
    const name = presetName.trim();
    if (!name) return;
    const next = [...presets.filter((preset) => preset.name !== name), { name, settings }];
    try {
      localStorage.setItem(presetKey, JSON.stringify(next));
      setPresets(next);
      setPresetName('');
      setGenerationNotice('Preset lokal gespeichert.');
    } catch {
      setLocalError('Preset konnte nicht im Browser gespeichert werden.');
    }
  }

  function removePreset(name: string) {
    const next = presets.filter((preset) => preset.name !== name);
    try {
      localStorage.setItem(presetKey, JSON.stringify(next));
      setPresets(next);
    } catch {
      setLocalError('Preset konnte nicht aus dem Browser entfernt werden.');
    }
  }

  function saveCurrentSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      setGenerationNotice('Einstellungen lokal gespeichert.');
    } catch {
      setLocalError('Einstellungen konnten nicht im Browser gespeichert werden.');
    }
  }

  async function generateImages() {
    if (!generationAllowed) return;
    setGenerationNotice('');
    setLocalError('');
    const current = makeDocument();
    if (current.descriptivePrompt.length > 8000) {
      setLocalError('Der beschreibende Prompt überschreitet 8.000 Zeichen.');
      return;
    }
    if (audit.duplicates.length || audit.conflicts.length) {
      setLocalError('Bitte zuerst doppelte oder widersprüchliche Angaben prüfen.');
      return;
    }
    const count = Number(batchCount);
    if (!Number.isInteger(count) || count < 1 || count > 4) {
      setLocalError('Die Bildanzahl muss zwischen 1 und 4 liegen.');
      return;
    }
    const numericSeed = seed.trim() ? Number(seed) : null;
    if (numericSeed !== null && (!Number.isInteger(numericSeed) || numericSeed < 0 || numericSeed > 2147483647)) {
      setLocalError('Der Seed muss eine ganze Zahl zwischen 0 und 2.147.483.647 sein.');
      return;
    }
    const guidance = Number(guidanceScale);
    const steps = Number(inferenceSteps);
    const imageStrength = Number(strength);
    if (!Number.isFinite(guidance) || guidance < 1 || guidance > 20) {
      setLocalError('Die Guidance Scale muss zwischen 1 und 20 liegen.');
      return;
    }
    if (!Number.isInteger(steps) || steps < 1 || steps > 60) {
      setLocalError('Die Inferenzschritte müssen zwischen 1 und 60 liegen.');
      return;
    }
    if (!Number.isFinite(imageStrength) || imageStrength < 0 || imageStrength > 1) {
      setLocalError('Die Referenzbild-Stärke muss zwischen 0 und 1 liegen.');
      return;
    }
    if (current.negativePrompt.length > 2000) {
      setLocalError('Der Negative Prompt darf höchstens 2.000 Zeichen enthalten.');
      return;
    }
    let reference: GenerateImageInput['referenceImage'];
    if (referenceImage) {
      if (!statusQuery.data?.supportsReferenceImage) {
        setLocalError('Der konfigurierte Anbieter unterstützt keine Referenzbilder. Bitte Bild entfernen oder Anbieter wechseln.');
        return;
      }
      try {
        const data = await fileToBase64(referenceImage);
        reference = { data, mimeType: referenceImage.type as 'image/png' | 'image/jpeg' | 'image/webp' };
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Referenzbild konnte nicht gelesen werden.');
        return;
      }
    }
    const request: GenerateImageInput = {
      prompt: current.descriptivePrompt,
      negativePrompt: current.negativePrompt || undefined,
      seed: numericSeed,
      count,
      guidanceScale: guidance,
      inferenceSteps: steps,
      strength: imageStrength,
      outputFormat,
      aspectRatio: aspectRatio as GenerateImageInput['aspectRatio'],
      referenceImage: reference,
      accessCode: accessCode.trim(),
    };
    generateMutation.mutate({ data: request }, {
      onSuccess: async (result: GenerateImageResult) => {
        setConsent(false);
        setAccessCode('');
        setGenerationNotice(`Erzeugt mit ${result.provider} · ${result.model}${result.warnings.length ? ` — ${result.warnings.join(' · ')}` : ''}`);
        try {
          await addArchiveImages(result, current, settings, form.artistA, form.artistB);
          setGallery(await getArchiveImages());
        } catch {
          setLocalError('Bilder wurden erzeugt, konnten aber nicht im lokalen Archiv gespeichert werden.');
        }
      },
      onError: (error) => {
        setConsent(false);
        setGenerationNotice('');
        setLocalError(error instanceof Error ? error.message : 'Die Bildgenerierung ist fehlgeschlagen. Bitte erneut versuchen.');
      },
    });
  }

  async function deleteImage(id: string) {
    try {
      await deleteArchiveImage(id);
      setGallery((items) => items.filter((item) => item.id !== id));
      setCompareIds((items) => items.filter((item) => item !== id));
    } catch {
      setLocalError('Das Bild konnte nicht aus dem lokalen Archiv entfernt werden.');
    }
  }

  function resetAll() {
    setForm(initialState);
    setTagSelections(initialTagSelections);
    setAspectRatio('4:5');
    setNegativePrompt('');
    setSeed('42');
    setBatchCount('1');
    setArtistAWeight(60);
    setGuidanceScale('3.5');
    setInferenceSteps('28');
    setStrength('0.65');
    setOutputFormat('png');
    setLanguage('de');
    setDocument(null);
    setPromptAudit(emptyPromptAudit);
    setConsent(false);
    setAccessCode('');
    setLocalError('');
    setGenerationNotice('');
    generateMutation.reset();
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(null);
    setReferencePreview('');
  }

  const compared = gallery.filter((item) => compareIds.includes(item.id)).slice(0, 2);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-home" aria-label="FLUX Style Fusion Startseite">
          <span className="brand-mark" aria-hidden="true"><WandSparkles size={18} strokeWidth={1.8} /></span><span>flux / studio</span>
        </a>
        <nav className="topnav" aria-label="Hauptnavigation">
          <a className="nav-link" href="#studio" data-testid="link-studio">Generator</a>
          <a className="nav-link" href="#archive" data-testid="link-archive">Archiv</a>
          <a className="nav-link" href={`${import.meta.env.BASE_URL}flux-stil-fusion-generator.html`} download data-testid="link-html-download">HTML herunterladen</a>
          <a className="nav-link download-link" href={`${import.meta.env.BASE_URL}flux-generator-download.zip`} download data-testid="link-zip-download">ZIP herunterladen</a>
          <button className="nav-button" type="button" onClick={resetAll} data-testid="button-reset-top"><RotateCcw size={14} />Zurücksetzen</button>
        </nav>
      </header>
      <main className="page-content">
        <section className="hero" id="about" aria-labelledby="page-title">
          <div><p className="eyebrow">Kreativwerkzeug / 02</p><h1 id="page-title">Stile kreuzen.<br /><em>Welten öffnen.</em></h1>
            <p className="hero-copy">Zwei visuelle Stimmen, ein eigener Bildgedanke. Entwickle präzise Prompts — oder generiere direkt, wenn der verbundene Anbieter es erlaubt.</p></div>
          <div className="hero-stamp" aria-label="Make the unexpected visible"><span className="stamp-dot one" /><span className="stamp-dot two" /><span className="stamp-text">make the<br />unexpected<br />visible</span></div>
        </section>

        <section className="workspace" id="studio" aria-label="Prompt Studio">
          <div className="panel controls-panel">
            <div className="panel-heading"><div><p className="panel-kicker">Deine Zutaten</p><h2 className="panel-title">Baue deine Fusion</h2></div><span className="step-count">Prompt · Bild · Archiv</span></div>
            <div className="field-grid">
              {fieldOrder.map((key, index) => {
                const config = options[key];
                return <div className={`field ${key === 'fusion' ? 'field-wide' : ''}`} key={key}>
                  <label className="field-label" htmlFor={`select-${key}`}>{config.label}<span>{String(index + 1).padStart(2, '0')}</span></label>
                  <div className="select-wrap"><select className="field-select" id={`select-${key}`} value={form[key]} onChange={(event) => updateField(key, event.target.value)} data-testid={`select-${key}`}>
                    {(key === 'artistA' || key === 'artistB' ? allArtists : config.values).map((value) => <option value={value} key={value}>{value}</option>)}
                  </select></div>
                </div>;
              })}
            </div>
            <section className="mixer-block" aria-label="Stilanteile">
              <div className="field-label"><span className="mixer-label">Stilanteile</span><span data-testid="text-weight-total">100 % gesamt</span></div>
              <div className="mixer-names"><strong>{form.artistA}<small>Basisstil · {artistAWeight}%</small></strong><span className="mixer-cross">×</span><strong>{form.artistB}<small>Fusion · {100 - artistAWeight}%</small></strong></div>
              <input className="mixer-range" type="range" min="0" max="100" value={artistAWeight} onChange={(event) => setArtistAWeight(Number(event.target.value))} aria-label="Gewichtung Künstler A" data-testid="input-artist-a-weight" />
              <div className="range-labels"><span>Künstler A <b>{artistAWeight}%</b></span><span>Künstler B <b>{100 - artistAWeight}%</b></span></div>
            </section>
            <div className="custom-artist-row">
              <label className="sr-only" htmlFor="custom-artist">Eigenen Künstler ergänzen</label>
              <input className="field-input" id="custom-artist" value={newArtist} onChange={(event) => setNewArtist(event.target.value)} placeholder="Eigene Künstlerstimme hinzufügen" data-testid="input-custom-artist" />
              <button className="small-action" type="button" onClick={() => {
                const value = newArtist.trim();
                if (!value || allArtists.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
                setCustomArtists((items) => [...items, value]); setNewArtist('');
              }} data-testid="button-add-artist"><Plus size={15} />Hinzufügen</button>
            </div>
            <div className="advanced-fields">
              <div className="field field-wide"><div className="tag-group-grid">
                {tagGroups.map((group) => <div className="tag-group" key={group.key}>
                  <div className="field-label">{group.label}<span>{group.values.length + tagSelections[group.key].filter((tag) => !group.values.includes(tag)).length} Tags</span></div>
                  <div className="style-chips" aria-label={group.label}>
                    {[...group.values, ...tagSelections[group.key].filter((tag) => !group.values.includes(tag))].map((tag) => <button className={`style-chip ${tagSelections[group.key].includes(tag) ? 'selected' : ''}`} type="button" key={tag} aria-pressed={tagSelections[group.key].includes(tag)} onClick={() => toggleTag(group.key, tag)} data-testid={`tag-${group.key}-${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{tag}</button>)}
                  </div>
                  <div className="custom-tag-row"><input className="field-input" value={customTags[group.key]} onChange={(event) => setCustomTags((current) => ({ ...current, [group.key]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomTag(group.key); } }} placeholder="Eigenen Tag ergänzen" aria-label={`Eigenen Tag für ${group.label}`} data-testid={`input-custom-tag-${group.key}`} /><button className="icon-action" type="button" aria-label={`Tag zu ${group.label} hinzufügen`} onClick={() => addCustomTag(group.key)} data-testid={`button-add-tag-${group.key}`}><Plus size={14} /></button></div>
                </div>)}
              </div></div>
              <div className="field"><label className="field-label" htmlFor="select-aspect-ratio">Aspekt Ratio<span>10</span></label><div className="select-wrap"><select className="field-select" id="select-aspect-ratio" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} data-testid="select-aspect-ratio">{ratios.map((ratio) => <option value={ratio.value} key={ratio.value}>{ratio.label} ({ratio.value})</option>)}</select></div></div>
              <div className="field"><label className="field-label" htmlFor="seed">Seed<span>11</span></label><input className="field-input" id="seed" type="number" min="0" max="2147483647" value={seed} onChange={(event) => setSeed(event.target.value)} data-testid="input-seed" /></div>
              <div className="field"><label className="field-label" htmlFor="batch-count">Anzahl Bilder<span>max. 4</span></label><input className="field-input" id="batch-count" type="number" min="1" max="4" value={batchCount} onChange={(event) => setBatchCount(event.target.value)} data-testid="input-batch-count" /></div>
              <div className="field"><label className="field-label" htmlFor="guidance">Guidance Scale</label><input className="field-input" id="guidance" type="number" min="1" max="20" step="0.1" value={guidanceScale} onChange={(event) => updateGuidanceScale(event.target.value)} data-testid="input-guidance-scale" /></div>
              <div className="field"><label className="field-label" htmlFor="steps">Inferenzschritte</label><input className="field-input" id="steps" type="number" min="1" max="60" value={inferenceSteps} onChange={(event) => setInferenceSteps(event.target.value)} data-testid="input-inference-steps" /></div>
              <div className="field"><label className="field-label" htmlFor="strength">Referenzbild-Stärke</label><input className="field-input" id="strength" type="number" min="0" max="1" step="0.05" value={strength} onChange={(event) => setStrength(event.target.value)} data-testid="input-strength" /></div>
              <div className="field"><label className="field-label" htmlFor="output-format">Ausgabeformat</label><div className="select-wrap"><select className="field-select" id="output-format" value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as 'png' | 'jpeg')} data-testid="select-output-format"><option value="png">PNG</option><option value="jpeg">JPEG</option></select></div></div>
              <div className="field"><label className="field-label" htmlFor="prompt-language">Prompt-Sprache</label><div className="select-wrap"><select className="field-select" id="prompt-language" value={language} onChange={(event) => setLanguage(event.target.value as PromptLanguage)} data-testid="select-prompt-language"><option value="de">Deutsch</option><option value="en">English</option></select></div></div>
              <div className="field field-wide"><label className="field-label" htmlFor="negative-prompt">Negative Prompt<span>13</span></label><textarea className="field-textarea" id="negative-prompt" value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="z. B. watermarks, distorted hands, extra fingers" rows={3} data-testid="textarea-negative-prompt" /></div>
              <div className="field field-wide"><div className="field-label">Referenz / Base Image<span>max. 6 MB</span></div>
                {!referenceImage ? <label className="upload-zone" htmlFor="reference-image"><ImagePlus size={20} /><span><strong>Bild hochladen</strong> oder hier auswählen</span><small>JPG, PNG oder WEBP · bis 6 MB</small><input id="reference-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={onReferenceChange} data-testid="input-reference-image" /></label> :
                  <div className="reference-card"><img src={referencePreview} alt={`Vorschau von ${referenceImage.name}`} /><div className="reference-info"><strong>{referenceImage.name}</strong><span>{Math.max(1, Math.round(referenceImage.size / 1024))} KB · wird als Referenz eingebunden</span></div><button className="remove-image" type="button" onClick={() => { URL.revokeObjectURL(referencePreview); setReferenceImage(null); setReferencePreview(''); }} aria-label="Referenzbild entfernen" data-testid="button-remove-reference"><X size={16} /></button></div>}
              </div>
            </div>
            <div className="controls-footer"><div className="hint"><Clipboard size={14} /> Einstellungen bleiben lokal in deinem Browser.</div><button className="action-button" type="button" onClick={() => { const built = makeDocument(); setDocument(built); }} data-testid="button-generate"><Sparkles size={16} />Prompt erzeugen</button></div>
          </div>
          <div className="panel output-panel" aria-live="polite">
            <div className="output-top"><div><p className="panel-kicker">Dein Ergebnis</p><h2 className="panel-title">Prompt Canvas</h2></div><span className="output-mark"><Layers3 size={18} /></span></div>
            {!document ? <div className="output-empty" data-testid="empty-output"><Command size={26} strokeWidth={1.4} /><p>Wähle deine Zutaten und klicke auf „Prompt erzeugen“.<br />Deine Bildidee wartet schon.</p></div> :
              <div className="prompt-box"><div className="prompt-tabs"><span>Beschreibung</span><span>Technik separat</span></div><textarea className="prompt-text" value={document.descriptivePrompt} readOnly aria-label="Generierter beschreibender Prompt" data-testid="textarea-output" /><div className="prompt-meta"><span>{document.descriptivePrompt.length} Zeichen / {language.toUpperCase()}</span><button className="copy-button" type="button" onClick={copyPrompt} data-testid="button-copy">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Kopiert' : 'Kopieren'}</button></div>
                <details className="technical-details"><summary>Technische Parameter separat ansehen</summary><pre>{document.technicalParameters}</pre><strong>Negative Prompt</strong><p>{document.negativePrompt || 'keine'}</p></details>
                <div className={`prompt-audit ${promptAudit.duplicates.length || promptAudit.conflicts.length ? 'has-issues' : 'is-clean'}`} data-testid="prompt-audit">{promptAudit.duplicates.length || promptAudit.conflicts.length ? <><strong>Prompt-Prüfung</strong>{promptAudit.duplicates.length > 0 && <span>Doppelte Inhalte: {promptAudit.duplicates.join(', ')}</span>}{promptAudit.conflicts.length > 0 && <span>Konflikte: {promptAudit.conflicts.join(', ')}</span>}</> : <><Check size={13} /> Prompt-Prüfung: keine doppelten Inhalte oder Konflikte erkannt.</>}</div>
                <div className="export-row"><button className="small-action light" type="button" onClick={() => exportFile('txt')} data-testid="button-export-txt"><Download size={14} />TXT</button><button className="small-action light" type="button" onClick={() => exportFile('json')} data-testid="button-export-json"><Download size={14} />JSON</button></div>
              </div>}
            <div className="output-actions"><span className="status-message" data-testid="status-message">{document ? <><Check size={13} />Prompt bereit</> : 'Noch kein Prompt erzeugt'}</span><button className="text-button" type="button" onClick={resetAll} data-testid="button-reset"><RotateCcw size={13} />Alles zurücksetzen</button></div>
          </div>
        </section>

        <section className="studio-tools" aria-label="Lokale Presets und Bildgenerierung">
          <div className="panel tools-panel"><div className="panel-heading"><div><p className="panel-kicker">Wiederverwenden</p><h2 className="panel-title">Presets im Browser</h2></div><Save size={19} /></div>
            <div className="preset-save"><input className="field-input" value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset benennen" aria-label="Presetname" data-testid="input-preset-name" /><button className="small-action" type="button" onClick={savePreset} disabled={!presetName.trim()} data-testid="button-save-preset"><Save size={14} />Preset speichern</button><button className="small-action secondary" type="button" onClick={saveCurrentSettings} data-testid="button-save-settings">Einstellungen merken</button></div>
            {presets.length === 0 ? <p className="quiet-empty" data-testid="empty-presets">Noch keine Presets gespeichert.</p> : <div className="preset-list">{presets.map((preset) => <div className="preset-item" key={preset.name}><strong>{preset.name}</strong><button className="small-action" type="button" onClick={() => applySettings(preset.settings)} data-testid={`button-load-preset-${slug(preset.name)}`}>Laden</button><button className="icon-action" type="button" aria-label={`Preset ${preset.name} löschen`} onClick={() => removePreset(preset.name)} data-testid={`button-delete-preset-${slug(preset.name)}`}><Trash2 size={14} /></button></div>)}</div>}
          </div>
          <div className="panel generation-panel"><div className="panel-heading"><div><p className="panel-kicker">Anbieter-Verbindung</p><h2 className="panel-title">Bildgenerierung</h2></div><span className={`provider-indicator ${generationEnabled ? 'online' : ''}`} data-testid="status-provider">{statusQuery.isLoading ? <><LoaderCircle size={14} />Status wird geprüft</> : statusQuery.isError ? 'Status nicht verfügbar' : generationEnabled ? 'Aktiv' : 'Nicht verfügbar'}</span></div>
            {statusQuery.isLoading ? <div className="status-skeleton" data-testid="loading-provider"><i /><i /><i /></div> : statusQuery.isError ? <div className="inline-error"><AlertCircle size={17} /><span>Anbieterstatus konnte nicht geladen werden. Die Generierung bleibt gesperrt.</span><button className="text-button" type="button" onClick={() => statusQuery.refetch()} data-testid="button-retry-status">Erneut prüfen</button></div> : <div className="provider-meta"><strong data-testid="text-provider">{providerLabel}</strong><span>{statusQuery.data?.reason ?? (generationEnabled ? 'Bereit für eine bestätigte Generierung.' : 'Der Server hat die Bildgenerierung deaktiviert.')}</span>{referenceImage && !statusQuery.data?.supportsReferenceImage && <span className="field-help">Dieser Anbieter verarbeitet keine Referenzbilder. Das Bild wird nicht übertragen.</span>}</div>}
            <form className="generation-access-form" onSubmit={(event) => { event.preventDefault(); void generateImages(); }}>
              <div className="billing-confirm"><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={!generationEnabled} data-testid="checkbox-billing-confirmation" /><span>Ich bestätige die mögliche Abrechnung dieses einzelnen Generierungslaufs.</span></label></div>
              <label className="field-label" htmlFor="access-code">Zugriffscode <span>wird nicht gespeichert</span></label><input className="field-input" id="access-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} disabled={!generationEnabled} placeholder="Code für diesen Lauf" data-testid="input-access-code" />
              <button className="action-button generation-button" type="submit" disabled={!generationAllowed} data-testid="button-generate-images">{generateMutation.isPending ? <><LoaderCircle size={16} className="spin" />Bild wird angefordert</> : <><Sparkles size={16} />Bilder generieren</>}</button>
              <p className="generation-footnote">Nur der API-Anbieter erzeugt Bilder. Ohne Statusfreigabe, Bestätigung und Zugriffscode bleibt die Aktion deaktiviert.</p>
            </form>
            {generationNotice && <p className="inline-success" data-testid="status-generation-result"><Check size={14} />{generationNotice}</p>}
          </div>
        </section>
        {(localError || generateMutation.isError) && <div className="global-error" role="alert" data-testid="status-error"><AlertCircle size={16} />{localError || 'Die Anfrage ist fehlgeschlagen.'}<button type="button" onClick={() => { setLocalError(''); generateMutation.reset(); }} data-testid="button-dismiss-error"><X size={14} /></button></div>}

        <section className="archive-section" id="archive">
          <div className="archive-heading"><div><p className="panel-kicker">Nur auf diesem Gerät</p><h2 className="panel-title">Bildarchiv <span>{gallery.length.toString().padStart(2, '0')}</span></h2></div><div className="archive-actions"><button className="small-action" type="button" onClick={() => void downloadArchiveZip(gallery).catch(() => setLocalError('Das ZIP-Archiv konnte nicht erstellt werden.'))} disabled={!gallery.length} data-testid="button-export-zip"><Archive size={14} />ZIP exportieren</button><span className="archive-note">Bilddaten in IndexedDB gespeichert</span></div></div>
          {compareIds.length > 0 && <p className="compare-hint" data-testid="status-compare">Zum Vergleich {compareIds.length}/2 ausgewählt — wähle ein zweites Bild.</p>}
          {compared.length === 2 && <div className="comparison" data-testid="comparison-view">{compared.map((item) => <figure key={item.id}><img src={imageDataUrl(item)} alt={`Vergleich ${item.artistA} + ${item.artistB}`} /><figcaption>{item.artistA} × {item.artistB}<span>{item.createdAt}</span></figcaption></figure>)}</div>}
          {galleryLoading ? <div className="gallery-skeleton" data-testid="loading-gallery"><i /><i /><i /></div> : gallery.length === 0 ? <div className="archive-empty" data-testid="empty-gallery"><ImagePlus size={23} /><strong>Hier beginnt dein Archiv.</strong><span>Generierte Bilder, Prompt und Einstellungen werden lokal abgelegt.</span></div> :
            <div className="gallery-grid">{gallery.map((item) => <article className="gallery-card" key={item.id} data-testid={`card-archive-${item.id}`}><div className="gallery-image"><img src={imageDataUrl(item)} alt={`Bildidee ${item.artistA} und ${item.artistB}`} loading="lazy" /><label className="compare-check"><input type="checkbox" checked={compareIds.includes(item.id)} disabled={!compareIds.includes(item.id) && compareIds.length >= 2} onChange={(event) => setCompareIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} data-testid={`checkbox-compare-${item.id}`} /><span>Vergleichen</span></label></div><div className="gallery-info"><strong>{item.artistA} <i>×</i> {item.artistB}</strong><span>{new Date(item.createdAt).toLocaleString('de-DE')} · Seed {item.seed ?? 'zufällig'}</span><details><summary>Prompt & Parameter</summary><pre>{item.prompt}</pre><pre>{item.settingsText}</pre></details><div className="gallery-actions"><a className="small-action" href={imageDataUrl(item)} download={`flux-fusion-${item.id}.${item.mimeType.split('/')[1]}`} data-testid={`link-download-image-${item.id}`}><Download size={13} />Bild laden</a><button className="icon-action" type="button" aria-label="Archivbild löschen" onClick={() => void deleteImage(item.id)} data-testid={`button-delete-image-${item.id}`}><Trash2 size={14} /></button></div></div></article>)}</div>}
        </section>
        <section className="notes-strip" aria-label="Hinweise zur Arbeitsweise"><div className="note-item"><span className="note-number">01</span><div><strong>Basis trifft Kontrast</strong><p>Der erste Stil gibt deiner Szene Haltung. Der zweite bringt Reibung.</p></div></div><div className="note-item"><span className="note-number">02</span><div><strong>Weniger ist präziser</strong><p>Jede Auswahl ist ein bewusst gesetzter Impuls für dein Modell.</p></div></div><div className="note-item"><span className="note-number">03</span><div><strong>Dein Studio bleibt deins</strong><p>Presets, Prompts und Bildarchiv bleiben lokal in deinem Browser.</p></div></div></section>
        <footer className="footer"><span>FLUX Style Fusion</span><span>Ein kleines Studio für große Bilder</span></footer>
      </main>
    </div>
  );
}

function slug(value: string) { return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Referenzbild konnte nicht gelesen werden.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(file);
  });
}
export default App;
