import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface PriceComparison {
  shopName: string;
  cutNameEn: string;
  cutNameEs: string;
  price: number;
  unit: string;
  avgPrice: number;
  date: string;
}

interface Props {
  data: PriceComparison;
}

export default function PriceComparisonCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const cardRef = useRef<View>(null);

  const saved = data.avgPrice - data.price;
  const savedPercent = ((saved / data.avgPrice) * 100).toFixed(0);
  const isSaving = saved > 0;

  async function handleShare() {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: isSpanish ? 'Compartir ahorro' : 'Share savings',
      });
    } catch {
      // Sharing cancelled or unavailable
    }
  }

  return (
    <View>
      <View ref={cardRef} style={styles.card} collapsable={false}>
        {/* App branding */}
        <Text style={styles.brand}>Carniceria Ranker</Text>

        {/* Cut name (bilingual) */}
        <Text style={styles.cutName}>
          {isSpanish ? data.cutNameEs : data.cutNameEn}
        </Text>
        <Text style={styles.cutNameAlt}>
          {isSpanish ? data.cutNameEn : data.cutNameEs}
        </Text>

        {/* Shop name */}
        <Text style={styles.shopLabel}>
          {isSpanish ? 'Comprado en' : 'Found at'}
        </Text>
        <Text style={styles.shopName}>{data.shopName}</Text>

        {/* Price vs average */}
        <View style={styles.priceSection}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {isSpanish ? 'Precio' : 'Price'}
            </Text>
            <Text style={styles.priceValue}>
              ${data.price.toFixed(2)}/{data.unit}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {isSpanish ? 'Promedio local' : 'Local avg'}
            </Text>
            <Text style={styles.avgValue}>
              ${data.avgPrice.toFixed(2)}/{data.unit}
            </Text>
          </View>
        </View>

        {/* Savings callout */}
        {isSaving && (
          <View style={styles.savingsBox}>
            <Text style={styles.savingsText}>
              {isSpanish
                ? `Ahorré $${saved.toFixed(2)}/${data.unit} (${savedPercent}% menos)`
                : `Saved $${saved.toFixed(2)}/${data.unit} (${savedPercent}% less)`}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text style={styles.date}>{data.date}</Text>

        {/* Language toggle indicator */}
        <View style={styles.langToggle}>
          <Text style={[styles.langOption, isSpanish && styles.langActive]}>ES</Text>
          <Text style={styles.langDivider}>|</Text>
          <Text style={[styles.langOption, !isSpanish && styles.langActive]}>EN</Text>
        </View>
      </View>

      {/* Share button (outside the captured card) */}
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>
          {isSpanish ? 'Compartir' : 'Share'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  brand: {
    fontSize: 11,
    color: '#e94560',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  cutName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  cutNameAlt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  shopLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ecca3',
    marginBottom: 16,
  },
  priceSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4ecca3',
  },
  avgValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#888',
  },
  savingsBox: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsText: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  langOption: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  langActive: {
    color: '#e94560',
  },
  langDivider: {
    color: '#333',
    fontSize: 11,
  },
  shareButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
