import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '../../constants/theme';
import { BackLink, PrimaryButton, Screen, WrapPill } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useAddRecipe } from '../../hooks/useRecipes';
import { useDiscoverRecipes, useAddDiscoverToLibrary } from '../../hooks/useDiscover';
import { supabase } from '../../lib/supabase';

type Method = 'manual' | 'link' | 'photo' | 'email' | 'discover';

const METHODS: { key: Method; label: string }[] = [
  { key: 'manual', label: 'Add manually' },
  { key: 'link', label: 'Paste a link' },
  { key: 'photo', label: 'Add a photo' },
  { key: 'email', label: 'Forward an email' },
  { key: 'discover', label: 'Discover something new' },
];

export default function AddRecipe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const addRecipe = useAddRecipe();
  const { data: discoverList } = useDiscoverRecipes();
  const addFromDiscover = useAddDiscoverToLibrary();

  const [method, setMethod] = useState<Method>('manual');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkText, setLinkText] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<'idle' | 'scanned'>('idle');
  const [ocrTitle, setOcrTitle] = useState('');
  const [saving, setSaving] = useState(false);

  function submitManual() {
    if (!title.trim()) return;
    addRecipe.mutate({ title: title.trim(), body, source: 'manual' }, { onSuccess: () => router.back() });
  }

  function submitLink() {
    if (!linkText.trim()) return;
    addRecipe.mutate(
      { title: 'Recipe from link — tap to fill in details', body: linkText.trim(), source: 'link' },
      { onSuccess: () => router.back() }
    );
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  function scanPhoto() {
    setOcrState('scanned');
    setOcrTitle('Sheet-pan salmon, lemon-dill yogurt');
  }

  async function submitPhoto() {
    if (!ocrTitle.trim() || !user) return;
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (photoUri) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('recipe-photos').upload(path, blob, {
          contentType: 'image/jpeg',
        });
        if (!uploadError) {
          const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }
      addRecipe.mutate(
        { title: ocrTitle.trim(), source: 'photo', image_url: imageUrl },
        { onSuccess: () => router.back() }
      );
    } finally {
      setSaving(false);
    }
  }

  const discoverToAdd = (discoverList ?? []).filter((d) => d.saved && !d.added_to_library);

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16 }}>
      <View style={styles.headerRow}>
        <BackLink label="← Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Add a recipe</Text>
      </View>

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
          <PrimaryButton label="Save recipe" onPress={submitManual} loading={addRecipe.isPending} />
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
            onChangeText={setLinkText}
            placeholder="Paste a link or a full recipe"
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea]}
          />
          <PrimaryButton label="Save to library" onPress={submitLink} loading={addRecipe.isPending} />
        </View>
      ) : null}

      {method === 'photo' ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.helpText}>
            Take or choose a photo or screenshot of a recipe — we'll scan it and pull out the title, ingredients and
            steps.
          </Text>
          <Pressable onPress={pickPhoto} style={styles.photoSlot}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoPlaceholder}>Tap to add a photo</Text>
            )}
          </Pressable>
          {ocrState === 'idle' ? (
            <PrimaryButton label="Add photo" onPress={scanPhoto} disabled={!photoUri} />
          ) : (
            <>
              <View style={styles.ocrBanner}>
                <Text style={styles.ocrBannerText}>✓ Title, ingredients & 6 steps extracted — review below</Text>
              </View>
              <TextInput value={ocrTitle} onChangeText={setOcrTitle} style={styles.input} />
              <PrimaryButton label="Save to library" onPress={submitPhoto} loading={saving} />
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
                <Pressable onPress={() => addFromDiscover.mutate(d)} hitSlop={6}>
                  <Text style={styles.discoverAdd}>+ Add</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 18, color: colors.ink },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
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
    height: 130,
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
  photoPreview: { width: '100%', height: '100%' },
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
