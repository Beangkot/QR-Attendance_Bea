import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Gradient from '@/components/Gradient';
import { COLORS } from '@/constants/colors';
import { GRADIENT, GRADIENT_END, GRADIENT_START, SHADOW } from '@/constants/theme';
import { signOut, useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';

type Item = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  countKey?: 'students' | 'teachers' | 'events' | 'attendance';
};

const ITEMS: Item[] = [
  { title: 'QR Code & Events', subtitle: 'Create events and show live QR codes', icon: 'qr-code-outline', href: '/admin/events', countKey: 'events' },
  { title: 'Attendance', subtitle: 'Review attendance records', icon: 'checkmark-done-outline', href: '/admin/attendance', countKey: 'attendance' },
  { title: 'Reports & Analytics', subtitle: 'Participation per event', icon: 'bar-chart-outline', href: '/admin/reports' },
  { title: 'Student Management', subtitle: 'View student accounts', icon: 'school-outline', href: '/admin/students', countKey: 'students' },
  { title: 'Teacher Management', subtitle: 'View teacher accounts', icon: 'people-outline', href: '/admin/teachers', countKey: 'teachers' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('Admin');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (user) {
          const p = await getProfile(user.id);
          if (active && p?.full_name) setName(p.full_name);
        }
        const count = async (table: string, role?: string) => {
          let q = supabase.from(table).select('id', { count: 'exact', head: true });
          if (role) q = q.eq('role', role);
          const { count: c } = await q;
          return c ?? 0;
        };
        const [students, teachers, events, attendance] = await Promise.all([
          count('profiles', 'student'),
          count('profiles', 'teacher'),
          count('events'),
          count('attendance'),
        ]);
        if (active) setCounts({ students, teachers, events, attendance });
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleSignOut = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Gradient colors={GRADIENT} start={GRADIENT_START} end={GRADIENT_END} style={styles.hero}>
        <Text style={styles.heroSmall}>Admin dashboard</Text>
        <Text style={styles.heroTitle}>Welcome, {name}</Text>
      </Gradient>

      {ITEMS.map((item) => (
        <Pressable
          key={item.href}
          onPress={() => router.push(item.href as any)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.subtitle}</Text>
          </View>
          {item.countKey && <Text style={styles.count}>{counts[item.countKey] ?? '–'}</Text>}
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </Pressable>
      ))}

      <Pressable onPress={handleSignOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  hero: { ...SHADOW.card, borderRadius: 22, padding: 22, marginBottom: 20 },
  heroSmall: { color: '#FFFFFFD9', fontSize: 13, fontWeight: '600' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 4 },
  card: {
    ...SHADOW.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  count: { fontSize: 18, fontWeight: '800', color: COLORS.accent, marginRight: 8 },
  signOut: {
    ...SHADOW.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: { color: COLORS.danger, fontWeight: '800', fontSize: 15 },
});