import Ionicons from '@expo/vector-icons/Ionicons';
import LinearGradient from '@/components/Gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { GRADIENT, GRADIENT_END, GRADIENT_START, SHADOW } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'refresh-circle-outline', title: 'Live rotating QR', text: 'Codes refresh every 30 seconds, so screenshots stop working.' },
  { icon: 'alarm-outline', title: 'Late detection', text: 'Each scan is marked Present or Late automatically.' },
  { icon: 'cloud-offline-outline', title: 'Works offline', text: 'Scans are saved on your phone and sync when you reconnect.' },
];

export default function Index() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={GRADIENT}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.hero}
      >
        <View style={styles.logoBox}>
          <Header title="QR Attendance" />
        </View>
        <Text style={styles.heroTitle}>School Event Attendance</Text>
        <Text style={styles.heroSubtitle}>
          Scan QR codes to record attendance during school activities.
        </Text>
      </LinearGradient>

      <View style={styles.actions}>
        <AppButton theme="primary" title="Scan QR Code" icon="qr-code-outline" onPress={() => router.push('/scan')} />
        <AppButton title="Attendance History" icon="time-outline" onPress={() => router.push('/history')} />
        <AppButton title="Profile" icon="person-outline" onPress={() => router.push('/profile')} />
      </View>

      <Text style={styles.sectionTitle}>What's inside</Text>
      {FEATURES.map((f) => (
        <View key={f.title} style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Ionicons name={f.icon} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.text}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.credit}>Developed by: Bea C. Resgoña</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  hero: {
    ...SHADOW.card,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: '#FFFFFFD9', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  actions: { marginBottom: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  featureCard: {
    ...SHADOW.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  featureDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  credit: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 14 },
});
