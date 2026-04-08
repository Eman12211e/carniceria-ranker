import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';
import type { Database } from '@/types/database';

type MeatCut = Database['public']['Tables']['meat_cuts']['Row'];

interface FuzzyResult extends MeatCut {
  similarity_score?: number;
}

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuzzyResult[]>([]);
  const [loading, setLoading] = useState(false);

  const isSpanish = i18n.language === 'es';

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Use fuzzy search for better typo tolerance (e.g. "diezmilo" -> "Diezmillo")
    const { data } = await supabase.rpc('search_cuts_fuzzy', {
      p_query: text,
      p_limit: 15,
    });

    setResults((data ?? []) as FuzzyResult[]);
    setLoading(false);

    trackEvent('cut_search', { query: text, result_count: (data ?? []).length });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isSpanish
          ? 'Encuentra los mejores precios de carne'
          : 'Find the best meat prices'}
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder={t('search.placeholder')}
        placeholderTextColor="#666"
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
        returnKeyType="search"
      />

      {results.length === 0 && query.length >= 2 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('common.noResults')}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.resultItem}>
            <Text style={styles.cutName}>
              {isSpanish ? item.name_es : item.name_en}
            </Text>
            <Text style={styles.cutNameAlt}>
              {isSpanish ? item.name_en : item.name_es}
            </Text>
            <Text style={styles.animal}>{item.animal}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  resultItem: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  cutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cutNameAlt: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  animal: {
    fontSize: 12,
    color: '#e94560',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
