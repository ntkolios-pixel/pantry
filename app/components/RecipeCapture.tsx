import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radii } from '../constants/theme';
import { PrimaryButton, SecondaryButton, WrapPill } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { useAddRecipe } from '../hooks/useRecipes';
import { useDiscoverRecipes, useAddDiscoverToLibrary } from '../hooks/useDiscover';
import { supabase } from '../lib/supabase';

type Method = 'manual' | 'link' | 'photo' | 'email' | 'discover';

const METHODS: { key: Method; label: string }[] = [
  { key: 'manual', label: 'Add manually' },
  { key: 'link', label: 'Paste a link' },
  { key: 'photo', label: 'Add a photo' },
  { key: 'email', label: 'Forward an email' },
  { key: 'discover', label: 'Discover something new' },
];

// The one form for getting a recipe into the library — shared by the
// onboarding "add a few recipes" step and the full-app "Add a recipe"
// screen so both offer the same methods and stay in sync.
export function RecipeCapture({
  onSaved,
  embedded = false,
}: {
  onSaved?: () => void;
  /** True when this form sits inside a screen that has its own, more important
   * primary action below it (e.g. onboarding's "Start planning"). Downgrades
   * this form's own save buttons to a secondary style so the two don't compete. */
  embedded?: boolean;
}) {
  const SubmitButton = embedded ? SecondaryButton : PrimaryButton;
  const { user } = useAuth();
  const addRecipe = useAddRecipe();
  const { data: discoverList } = useDiscoverRecipes();
  const addFromDiscover = useAddDiscoverToLibrary();

  const [method, setMethod] = useState<Method>('manual');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkTitleTouched, setLinkTitleTouched] = useState(false);

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [ocrState, setOcrState] = useState<'idle' | 'scanned'>('idle');
  const [ocrTitle, setOcrTitle] = useState('');
  const [saving, setSaving] = useState(false);

  function submitManual() {
    if (!title.trim()) return;
    addRecipe.mutate(
      { title: title.trim(), body, source: 'manual' },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          onSaved?.();
        },
      }
    );
  }

  function guessTitleFromText(text: string) {
    const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? '';
    if (!firstLine || /^https?:\/\//i.test(firstLine)) return '';
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
  }

  function onLinkTextChange(value: string) {
    setLinkText(value);
    if (!linkTitleTouched) setLinkTitle(guessTitleFromText(value));
  }

  function submitLink() {
    if (!linkText.trim()) return;
    const resolvedTitle = linkTitle.trim() || 'Recipe from link';
    addRecipe.mutate(
      { title: resolvedTitle, body: linkText.trim(), source: 'link' },
      {
        onSuccess: () => {
          setLinkText('');
          setLinkTitle('');
          setLinkTitleTouched(false);
          onSaved?.();
        },
      }
    );
  }

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }

  function removePhoto(uri: string) {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }

  function scanPhoto() {
    setOcrState('scanned');
    setOcrTitle('Sheet-pan salmon, lemon-dill yogurt');
  }

  async function submitPhoto() {
    if (!ocrTitle.trim() || !user) return;
    setSaving(true);
    try {
      const imageUrls: string[] = [];
      for (const uri of photoUris) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const path = `${user.id}/${Date.now()}-${imageUrls.length}.jpg`;
        const { error: uploadError } = await supabase.storage.from('recipe-photos').upload(path, blob, {
          contentType: 'image/jpeg',
        });
        if (!uploadError) {
          const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
          imageUrls.push(data.publicUrl);
        }
      }
      addRecipe.mutate(
        { title: ocrTitle.trim(), source: 'photo', image_urls: imageUrls },
        {
          onSuccess: () => {
            setPhotoUris([]);
            setOcrState('idle');
            setOcrTitle('');
            onSaved?.();
          },
        }
      );
    } finally {
      setSaving(false);
    }
  }

  const discoverToAdd = (discoverList ?? []).filter((d) => d.saved && !d.added_to_library);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.pillWrap}>
        {METHODS.map((m) => (
          <WrapPill key={m.key} label={m.label} active={method === m.key} onPress={() => setMethod(m.key)} />
        ))}
      </View>

      {method === 'manual' ? (
        <View style={{ gap: 10 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe title"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Type or paste ingredients and steps"
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.textarea]}
          />
          <SubmitButton label="Save recipe" onPress={submitManual} loading={addRecipe.isPending} />
        </View>
      ) : null}

      {method === 'link' ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.helpText}>
            Paste a link, or paste the full recipe text copied from Claude, Gemini, or an Instagram caption — we'll
            figure out which and pull out the details. On Instagram, hitting Share → Copy Link works too.
          </Text>
          <TextInput
            value={linkText}
            onChangeText={onLinkTextChange}
            placeholder="Paste a link or a full recipe"
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea]}
          />
          {linkText.trim() ? (
            <TextInput
              value={linkTitle}
              onChangeText={(v) => {
                setLinkTitle(v);
                setLinkTitleTouched(true);
              }}
              placeholder="Recipe title"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
            />
          ) : null}
          <SubmitButton label="Save to library" onPress={submitLink} loading={addRecipe.isPending} />
        </View>
      ) : null}

      {method === 'photo' ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.helpText}>
            Take or choose one or more photos of a recipe — several pages of a handwritten card, for example — and
            we'll scan them together and pull out the title, ingredients and steps.
          </Text>
          {photoUris.length > 0 ? (
            <View style={styles.photoGrid}>
              {photoUris.map((uri) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <Pressable onPress={() => removePhoto(uri)} style={styles.photoRemove} hitSlop={6}>
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable onPress={pickPhotos} style={styles.photoSlot}>
            <Text style={styles.photoPlaceholder}>
              {photoUris.length > 0 ? '+ Add more photos' : 'Tap to add photos'}
            </Text>
          </Pressable>
          {ocrState === 'idle' ? (
            <SubmitButton label="Scan photos" onPress={scanPhoto} disabled={photoUris.length === 0} />
          ) : (
            <>
              <View style={styles.ocrBanner}>
                <Text style={styles.ocrBannerText}>✓ Title, ingredients & 6 steps extracted — review below</Text>
              </View>
              <TextInput value={ocrTitle} onChangeText={setOcrTitle} style={styles.input} />
              <SubmitButton label="Save to library" onPress={submitPhoto} loading={saving} />
            </>
          )}
        </View>
      ) : null}

      {method === 'email' ? (
        <View>
          <Text style={[styles.helpText, { marginBottom: 12 }]}>
            Forward anything here — an Instagram post shared to your email, a screenshot, or a recipe emailed from a
            Claude/Gemini chat — and we'll read it and drop it into your library.
          </Text>
          <View style={styles.emailBox}>
            <Text style={styles.emailText}>
              recipes-{(user?.email ?? 'you').split('@')[0]}@mealplanner.app
            </Text>
          </View>
        </View>
      ) : null}

      {method === 'discover' ? (
        <View>
          {discoverToAdd.length === 0 ? (
            <Text style={styles.helpText}>
              Nothing saved from Discover yet. Go to the Discover tab, tap &quot;Save to library&quot; on a recipe,
              then come back here to add it.
            </Text>
          ) : (
            discoverToAdd.map((d) => (
              <View key={d.id} style={styles.discoverRow}>
                <View>
                  <Text style={styles.discoverTitle}>{d.title}</Text>
                  <Text style={styles.discoverCreator}>{d.creator}</Text>
                </View>
                <Pressable onPress={() => addFromDiscover.mutate(d, { onSuccess: () => onSaved?.() })} hitSlop={6}>
                  <Text style={styles.discoverAdd}>+ Add</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  input: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { textAlignVertical: 'top', minHeight: 100 },
  helpText: { fontSize: 12, color: colors.inkSoft, lineHeight: 18, marginBottom: 10, fontFamily: fonts.ui },
  photoSlot: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: { fontSize: 13, color: colors.inkFaint, fontFamily: fonts.ui },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { width: 76, height: 76, borderRadius: 10, overflow: 'visible' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 10 },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: colors.paper, fontSize: 13, lineHeight: 15 },
  ocrBanner: { backgroundColor: colors.sageSoft, borderRadius: radii.sm, paddingHorizontal: 11, paddingVertical: 9 },
  ocrBannerText: { fontSize: 11.5, color: colors.marigoldInk, fontWeight: '600', fontFamily: fonts.uiSemiBold },
  emailBox: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: 12,
    alignItems: 'center',
  },
  emailText: { fontFamily: fonts.ui, fontSize: 15, fontWeight: '600', color: colors.ink },
  discoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
  },
  discoverTitle: { fontSize: 13.5, color: colors.ink, fontFamily: fonts.ui },
  discoverCreator: { fontSize: 11, color: colors.inkSoft, fontFamily: fonts.ui },
  discoverAdd: { fontSize: 12, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
});
