'use client';

import * as React from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Checkbox, Field, Select, Textarea } from '@/components/ui';
import type { TranslationPreferences, TranslationStyle } from '@/lib/types/domain';

const STYLE_HINTS: Record<TranslationStyle, string> = {
  natural: 'Reads as though it were written in English, while staying faithful to intent.',
  faithful: 'Stays close to the source structure. Useful for reference or scanlation notes.',
  localized: 'Adapts idioms, jokes, and references for the target audience.',
  custom: 'Follows the project rules you write below.',
};

const TOGGLES: Array<{ key: keyof TranslationPreferences; label: string; description: string }> = [
  { key: 'preserveHonorifics', label: 'Preserve honorifics', description: 'Keeps -ssi, -nim, sahyeong, and similar forms of address.' },
  { key: 'translateSfx', label: 'Translate SFX', description: 'Sound effects baked into artwork are localized too.' },
  { key: 'automaticTypesetting', label: 'Automatic typesetting', description: 'Fits translated text into the original bubble.' },
  { key: 'removeOriginalText', label: 'Remove original text', description: 'Cleans only the text, never the artwork around it.' },
  { key: 'useTranslationMemory', label: 'Use translation memory', description: 'Reuses wording you already approved.' },
  { key: 'useCharacterProfiles', label: 'Use character profiles', description: 'Applies each speaker’s voice and speech rules.' },
  { key: 'runQaAfterTranslation', label: 'Run QA after translation', description: 'Checks terminology, voice, and missing text before export.' },
];

export function ProjectPreferences({
  preferences,
  onSave,
  readOnly = false,
}: {
  readOnly?: boolean;
  preferences: TranslationPreferences;
  onSave: (prefs: TranslationPreferences) => Promise<void>;
}) {
  const [prefs, setPrefs] = React.useState(preferences);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(prefs) !== JSON.stringify(preferences);

  React.useEffect(() => setPrefs(preferences), [preferences]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Translation preferences</CardTitle>
        <span className="text-[12px] text-ink-muted">Applied to every new chapter</span>
      </CardHeader>
      <CardBody><fieldset disabled={readOnly} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Translation style" htmlFor="style" hint={STYLE_HINTS[prefs.style]}>
            <Select
              id="style"
              value={prefs.style}
              onChange={(e) => setPrefs({ ...prefs, style: e.target.value as TranslationStyle })}
            >
              <option value="natural">Natural</option>
              <option value="faithful">Faithful</option>
              <option value="localized">Localized</option>
              <option value="custom">Custom</option>
            </Select>
          </Field>
          <Field label="Character names" htmlFor="names" hint="How proper nouns are rendered in English.">
            <Select
              id="names"
              value={prefs.nameHandling}
              onChange={(e) => setPrefs({ ...prefs, nameHandling: e.target.value as TranslationPreferences['nameHandling'] })}
            >
              <option value="romanize">Romanize</option>
              <option value="localize">Localize</option>
              <option value="keep-source">Keep source script</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <Checkbox
              key={t.key}
              label={t.label}
              description={t.description}
              checked={Boolean(prefs[t.key])}
              onChange={(e) => setPrefs({ ...prefs, [t.key]: e.target.checked })}
            />
          ))}
        </div>

        <Field label="Project rules" htmlFor="rules" hint="One per line — e.g. “Hyunwoo never uses contractions.” Shown beside every translation.">
          <Textarea
            id="rules"
            value={prefs.customRules.join('\n')}
            onChange={(e) => setPrefs({ ...prefs, customRules: e.target.value.split('\n') })}
          />
        </Field>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <Button
            disabled={!dirty}
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({ ...prefs, customRules: prefs.customRules.map((r) => r.trim()).filter(Boolean) });
              } finally {
                setSaving(false);
              }
            }}
          >
            Save preferences
          </Button>
          {dirty && <span className="text-[12.5px] text-ink-muted">Unsaved changes</span>}
        </div>
      </fieldset></CardBody>
    </Card>
  );
}
