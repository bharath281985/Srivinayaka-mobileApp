import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors, spacing, radius } from '../app/theme';

const { width } = Dimensions.get('window');

const AboutScreen = () => {
  const navigation = useNavigation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/pages/about-us');
        setPage(data);
      } catch (e) {
        setError('Unable to load our story right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderBodyText = () => {
    if (!page?.content) return null;
    // Very simple HTML → text conversion for mobile
    const text = page.content
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+\n/g, '\n')
      .trim();

    return text.split('\n\n').map((para, idx) => (
      <Text key={idx} style={styles.storyParagraph}>
        {para.trim()}
      </Text>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
        <Text style={styles.loadingText}>Unfolding our story…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>


      {/* Sacred text card driven by CMS page */}
      <View style={styles.cardWrap}>
        <View style={styles.quoteMarkRow}>
          <View style={styles.quoteLine} />
          <Text style={styles.quoteMark}>❝❞</Text>
          <View style={styles.quoteLine} />
        </View>

        <Text style={styles.sacredEyebrow}>THE SACRED TEXT</Text>
        <Text style={styles.storyTitle}>
          {page?.title || 'Sri Vinayaka Collections – A Story of Tradition and Trust'}
        </Text>
        <View style={styles.storyDivider} />

        {renderBodyText()}
      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FCFAF7' },
  content: { paddingBottom: 40 },

  loadingWrap: {
    flex: 1,
    backgroundColor: '#FCFAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },



  cardWrap: {
    marginTop: 32,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 8,
  },
  quoteMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  quoteLine: {
    width: 60,
    height: 1,
    backgroundColor: '#e6d7c5',
  },
  quoteMark: {
    marginHorizontal: 14,
    color: '#e6d7c5',
    fontSize: 18,
    fontWeight: '700',
  },
  sacredEyebrow: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#b08a55',
    fontWeight: '900',
    marginBottom: 10,
  },
  storyTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  storyDivider: {
    width: 36,
    height: 2,
    backgroundColor: '#d5aa6a',
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 14,
  },
  storyParagraph: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'center',
  },


});

export default AboutScreen;

