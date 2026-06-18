import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';
import { cachedGet } from '../services/api';
import { inr } from '../utils/currency';

const FALLBACK = 'https://via.placeholder.com/100x100?text=🧵';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    cachedGet('/api/categories', 60000)
      .then(data => {
        if (Array.isArray(data)) setCategories(data.filter(c => !c.parent).slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback(async (term, min, max) => {
    const query = term.trim();
    if (!query && min === undefined) { 
      setResults([]); 
      setSearched(false); 
      setLoading(false);
      return; 
    }
    
    setResults([]);
    setLoading(true);
    setSearched(true);
    try {
      const data = await cachedGet('/api/products', 5000, {
        params: { 
          q: query, 
          minPrice: min, 
          maxPrice: max,
          limit: 30, 
          page: 1 
        },
      });
      if (data && data.products) setResults(data.products);
      else if (Array.isArray(data)) setResults(data);
      else setResults([]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearchByPrice = (min, max, label) => {
    setQ(label);
    runSearch('', min, max);
  };

  const onChangeText = (text) => {
    setQ(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 450);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Search sarees, fabrics, colours…"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={onChangeText}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => runSearch(q)}
        />
        {q.length > 0 && (
          <TouchableOpacity onPress={() => { setQ(''); setResults([]); setSearched(false); }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No results found"
          subtitle={`No sarees matched "${q}". Try different keywords.`}
        />
      )}

      {!searched && !loading && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintTitle}>Discover Collections</Text>
          <View style={styles.tagContainer}>
            {(categories.length > 0 ? categories : [{name: 'Banarasi'}, {name: 'Kanjeevaram'}, {name: 'Silk'}, {name: 'Cotton'}]).map((cat) => (
              <TouchableOpacity
                key={cat._id || cat.name}
                style={styles.tag}
                onPress={() => { setQ(cat.name); runSearch(cat.name); }}
              >
                <Text style={styles.tagText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.hintTitle, { marginTop: 24 }]}>Shop by Price</Text>
          <View style={styles.tagContainer}>
            {[
              { label: 'Under ₹1000', min: 0, max: 1000 },
              { label: '₹1000 - ₹3000', min: 1000, max: 3000 },
              { label: '₹3000 - ₹5000', min: 3000, max: 5000 },
              { label: 'Above ₹5000', min: 5000, max: 1000000 },
            ].map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[styles.tag, { borderColor: colors.primary + '30' }]}
                onPress={() => runSearchByPrice(range.min, range.max, range.label)}
              >
                <Text style={styles.tagText}>{range.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 20, color: colors.text },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 6,
  },
  clear: { fontSize: 16, color: colors.muted, paddingHorizontal: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  loadingText: { color: colors.muted },
  hintWrap: { padding: spacing.md },
  hintTitle: { ...typography.h3, marginBottom: spacing.md, color: colors.primary },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { color: colors.text, fontWeight: '600' },
  grid: { padding: spacing.md, gap: 10 },
});

export default SearchScreen;
