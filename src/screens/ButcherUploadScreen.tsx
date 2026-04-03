import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type MeatCut = Database['public']['Tables']['meat_cuts']['Row'];
type PriceUnit = Database['public']['Tables']['price_unit']['Row'];

interface PriceEntry {
  cut: MeatCut;
  unit: PriceUnit;
  price: string;
}

export default function ButcherUploadScreen() {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [cuts, setCuts] = useState<MeatCut[]>([]);
  const [units, setUnits] = useState<PriceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search + selection state
  const [cutQuery, setCutQuery] = useState('');
  const [filteredCuts, setFilteredCuts] = useState<MeatCut[]>([]);
  const [selectedCut, setSelectedCut] = useState<MeatCut | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PriceUnit | null>(null);
  const [priceInput, setPriceInput] = useState('');

  // Batch of prices to submit
  const [entries, setEntries] = useState<PriceEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [cutsRes, unitsRes] = await Promise.all([
      supabase.from('meat_cuts').select('*').order('name_es'),
      supabase.from('price_unit').select('*'),
    ]);
    setCuts(cutsRes.data ?? []);
    setUnits(unitsRes.data ?? []);
    if (unitsRes.data?.length) {
      setSelectedUnit(unitsRes.data.find((u) => u.abbreviation === 'lb') ?? unitsRes.data[0]);
    }
    setLoading(false);
  }

  function handleCutSearch(text: string) {
    setCutQuery(text);
    if (text.length < 2) {
      setFilteredCuts([]);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredCuts(
      cuts.filter(
        (c) =>
          c.name_es.toLowerCase().includes(lower) ||
          c.name_en.toLowerCase().includes(lower) ||
          c.alt_names.some((a) => a.toLowerCase().includes(lower))
      )
    );
  }

  function selectCut(cut: MeatCut) {
    setSelectedCut(cut);
    setCutQuery(isSpanish ? cut.name_es : cut.name_en);
    setFilteredCuts([]);
  }

  function addEntry() {
    if (!selectedCut || !selectedUnit || !priceInput) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('butcher.invalidPrice'));
      return;
    }

    // Prevent duplicate cut+unit combos
    const exists = entries.some(
      (e) => e.cut.id === selectedCut.id && e.unit.id === selectedUnit.id
    );
    if (exists) {
      Alert.alert(t('butcher.duplicateEntry'));
      return;
    }

    setEntries([...entries, { cut: selectedCut, unit: selectedUnit, price: priceInput }]);
    setSelectedCut(null);
    setCutQuery('');
    setPriceInput('');
  }

  function removeEntry(index: number) {
    setEntries(entries.filter((_, i) => i !== index));
  }

  async function submitPrices() {
    if (entries.length === 0) return;
    setSubmitting(true);

    // TODO: Get actual shop_id from butcher's claimed shop
    // For now this is a scaffold — will be wired to auth + shop claim in Week 3
    const shopId = null;

    if (!shopId) {
      Alert.alert(
        t('butcher.noShopTitle'),
        t('butcher.noShopBody')
      );
      setSubmitting(false);
      return;
    }

    const results = await Promise.allSettled(
      entries.map((entry) =>
        supabase.rpc('upsert_price', {
          p_shop_id: shopId,
          p_cut_id: entry.cut.id,
          p_unit_id: entry.unit.id,
          p_price: parseFloat(entry.price),
        })
      )
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      Alert.alert(t('butcher.partialError', { count: failed }));
    } else {
      Alert.alert(t('butcher.success'));
      setEntries([]);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{t('butcher.uploadTitle')}</Text>
      <Text style={styles.subtitle}>{t('butcher.uploadSubtitle')}</Text>

      {/* Cut search */}
      <Text style={styles.label}>{t('butcher.selectCut')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('search.placeholder')}
        placeholderTextColor="#666"
        value={cutQuery}
        onChangeText={handleCutSearch}
        autoCapitalize="none"
      />
      {filteredCuts.length > 0 && (
        <View style={styles.dropdown}>
          {filteredCuts.slice(0, 5).map((cut) => (
            <Pressable key={cut.id} style={styles.dropdownItem} onPress={() => selectCut(cut)}>
              <Text style={styles.dropdownText}>
                {isSpanish ? cut.name_es : cut.name_en}
              </Text>
              <Text style={styles.dropdownAlt}>
                {isSpanish ? cut.name_en : cut.name_es}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Unit selector */}
      <Text style={styles.label}>{t('butcher.selectUnit')}</Text>
      <View style={styles.unitRow}>
        {units.map((unit) => (
          <Pressable
            key={unit.id}
            style={[
              styles.unitPill,
              selectedUnit?.id === unit.id && styles.unitPillActive,
            ]}
            onPress={() => setSelectedUnit(unit)}
          >
            <Text
              style={[
                styles.unitText,
                selectedUnit?.id === unit.id && styles.unitTextActive,
              ]}
            >
              {isSpanish ? unit.name_es : unit.name_en} ({unit.abbreviation})
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Price input */}
      <Text style={styles.label}>{t('butcher.enterPrice')}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="0.00"
          placeholderTextColor="#666"
          value={priceInput}
          onChangeText={setPriceInput}
          keyboardType="decimal-pad"
        />
        <Pressable
          style={[styles.addButton, (!selectedCut || !priceInput) && styles.addButtonDisabled]}
          onPress={addEntry}
          disabled={!selectedCut || !priceInput}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* Preview: queued entries */}
      {entries.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewHeader}>
            {t('butcher.preview')} ({entries.length})
          </Text>
          {entries.map((entry, index) => (
            <View key={`${entry.cut.id}-${entry.unit.id}`} style={styles.previewCard}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewCut}>
                  {isSpanish ? entry.cut.name_es : entry.cut.name_en}
                </Text>
                <Text style={styles.previewPrice}>
                  ${parseFloat(entry.price).toFixed(2)}/{entry.unit.abbreviation}
                </Text>
              </View>
              <Pressable onPress={() => removeEntry(index)} style={styles.removeButton}>
                <Text style={styles.removeText}>x</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={submitPrices}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {t('butcher.submitPrices', { count: entries.length })}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdown: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownAlt: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitPill: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  unitPillActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
  },
  unitText: {
    color: '#888',
    fontSize: 14,
  },
  unitTextActive: {
    color: '#e94560',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarSign: {
    color: '#888',
    fontSize: 24,
    fontWeight: '700',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  addButton: {
    backgroundColor: '#e94560',
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#333',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  previewSection: {
    marginTop: 24,
    paddingBottom: 40,
  },
  previewHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewCut: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewPrice: {
    color: '#4ecca3',
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitDisabled: {
    backgroundColor: '#555',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
