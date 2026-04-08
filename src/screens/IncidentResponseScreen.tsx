import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface IncidentResponseScreenProps {
  userRole: string;
}

interface Incident {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string;
  details: any;
  created_at: string;
  resolved: boolean;
}

const PLAYBOOK_STEPS = [
  {
    step: 1,
    sla: '< 1hr',
    en: 'Detect — Admin notified',
    es: 'Detectar — Admin notificado',
  },
  {
    step: 2,
    sla: '< 2hrs',
    en: 'Contain — Remove content, suspend account',
    es: 'Contener — Remover contenido, suspender cuenta',
  },
  {
    step: 3,
    sla: '< 4hrs',
    en: 'Communicate — Post acknowledgment',
    es: 'Comunicar — Publicar reconocimiento',
  },
  {
    step: 4,
    sla: '< 24hrs',
    en: 'Fix — Implement detection',
    es: 'Corregir — Implementar detección',
  },
  {
    step: 5,
    sla: '< 72hrs',
    en: 'Review — Post-mortem',
    es: 'Revisar — Post-mortem',
  },
];

export default function IncidentResponseScreen({ userRole }: IncidentResponseScreenProps) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [resolvedIncidents, setResolvedIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<boolean[]>(
    PLAYBOOK_STEPS.map(() => false),
  );

  useEffect(() => {
    if (userRole === 'admin') {
      loadIncidents();
    }
  }, [userRole]);

  async function loadIncidents() {
    setLoading(true);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [activeRes, resolvedRes] = await Promise.all([
      supabase
        .from('abuse_log')
        .select('*')
        .eq('resolved', false)
        .in('severity', ['high', 'critical'])
        .order('created_at', { ascending: false }),
      supabase
        .from('abuse_log')
        .select('*')
        .eq('resolved', true)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
    ]);

    if (activeRes.error) {
      Alert.alert('Error', activeRes.error.message);
    } else {
      setActiveIncidents((activeRes.data as Incident[]) ?? []);
    }

    if (resolvedRes.error) {
      Alert.alert('Error', resolvedRes.error.message);
    } else {
      setResolvedIncidents((resolvedRes.data as Incident[]) ?? []);
    }

    setLoading(false);
  }

  async function handleContain(incident: Incident) {
    Alert.alert(
      isSpanish ? 'Confirmar contención' : 'Confirm Containment',
      isSpanish
        ? 'Esto suspenderá la cuenta y removerá el contenido asociado.'
        : 'This will suspend the account and remove associated content.',
      [
        { text: isSpanish ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: isSpanish ? 'Contener' : 'Contain',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('abuse_log')
              .update({ resolved: false, severity: incident.severity })
              .eq('id', incident.id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              // Suspend user account
              await supabase
                .from('profiles')
                .update({ suspended: true })
                .eq('id', incident.user_id);
              loadIncidents();
            }
          },
        },
      ],
    );
  }

  async function handleResolve(incident: Incident) {
    const { error } = await supabase
      .from('abuse_log')
      .update({ resolved: true })
      .eq('id', incident.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      loadIncidents();
    }
  }

  async function handleEscalate(incident: Incident) {
    const { error } = await supabase
      .from('abuse_log')
      .update({ severity: 'critical' })
      .eq('id', incident.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      loadIncidents();
    }
  }

  function toggleChecklist(index: number) {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function getOverallStatus(): 'green' | 'yellow' | 'red' {
    if (activeIncidents.some((i) => i.severity === 'critical')) return 'red';
    if (activeIncidents.length > 0) return 'yellow';
    return 'green';
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isSpanish ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function severityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#e94560';
      case 'medium':
        return '#f0a500';
      case 'low':
        return '#a0a0a0';
      default:
        return '#a0a0a0';
    }
  }

  // Access denied for non-admins
  if (userRole !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.accessDenied}>
          {isSpanish ? 'Acceso denegado' : 'Access Denied'}
        </Text>
        <Text style={styles.accessDeniedSub}>
          {isSpanish
            ? 'Se requiere rol de administrador.'
            : 'Admin role required.'}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  const overallStatus = getOverallStatus();
  const statusColors = { green: '#4ecca3', yellow: '#f0a500', red: '#ff4444' };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>
          {isSpanish ? 'Respuesta a Incidentes' : 'Incident Response'}
        </Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColors[overallStatus] },
          ]}
        />
      </View>

      {/* Section 1: Active Incidents */}
      <Text style={styles.sectionHeader}>
        {isSpanish ? 'Incidentes activos' : 'Active Incidents'}
        {activeIncidents.length > 0 && ` (${activeIncidents.length})`}
      </Text>

      {activeIncidents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {isSpanish
              ? 'No hay incidentes activos'
              : 'No active incidents'}
          </Text>
        </View>
      ) : (
        activeIncidents.map((incident) => (
          <View key={incident.id} style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <Text style={styles.incidentType}>{incident.event_type}</Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: severityColor(incident.severity) },
                ]}
              >
                <Text style={styles.severityText}>
                  {incident.severity.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.incidentMeta}>
              {isSpanish ? 'Usuario' : 'User'}: {incident.user_id.slice(0, 8)}...
            </Text>
            <Text style={styles.incidentMeta}>
              {formatDate(incident.created_at)}
            </Text>

            {incident.details && (
              <Text style={styles.incidentDetails} numberOfLines={3}>
                {typeof incident.details === 'string'
                  ? incident.details
                  : JSON.stringify(incident.details)}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.containBtn]}
                onPress={() => handleContain(incident)}
              >
                <Text style={styles.actionBtnText}>
                  {isSpanish ? 'Contener' : 'Contain'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.resolveBtn]}
                onPress={() => handleResolve(incident)}
              >
                <Text style={styles.actionBtnText}>
                  {isSpanish ? 'Resolver' : 'Resolve'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.escalateBtn]}
                onPress={() => handleEscalate(incident)}
              >
                <Text style={styles.actionBtnText}>
                  {isSpanish ? 'Escalar' : 'Escalate'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Section 2: Playbook Steps */}
      <Text style={styles.sectionHeader}>
        {isSpanish ? 'Pasos del protocolo' : 'Playbook Steps'}
      </Text>

      <View style={styles.playbookCard}>
        {PLAYBOOK_STEPS.map((step, idx) => (
          <Pressable
            key={step.step}
            style={[
              styles.playbookRow,
              idx < PLAYBOOK_STEPS.length - 1 && styles.playbookRowBorder,
            ]}
            onPress={() => toggleChecklist(idx)}
          >
            <View
              style={[
                styles.checkbox,
                checklist[idx] && styles.checkboxChecked,
              ]}
            >
              {checklist[idx] && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.playbookContent}>
              <Text
                style={[
                  styles.playbookText,
                  checklist[idx] && styles.playbookTextDone,
                ]}
              >
                {step.step}. {isSpanish ? step.es : step.en}
              </Text>
              <Text style={styles.playbookSla}>SLA: {step.sla}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Section 3: Recent Resolved */}
      <Text style={styles.sectionHeader}>
        {isSpanish
          ? 'Resueltos recientemente (7 días)'
          : 'Recently Resolved (7 days)'}
      </Text>

      {resolvedIncidents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {isSpanish
              ? 'No hay incidentes resueltos recientemente'
              : 'No recently resolved incidents'}
          </Text>
        </View>
      ) : (
        resolvedIncidents.map((incident) => (
          <View key={incident.id} style={styles.resolvedCard}>
            <View style={styles.incidentHeader}>
              <Text style={styles.resolvedType}>{incident.event_type}</Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: severityColor(incident.severity), opacity: 0.6 },
                ]}
              >
                <Text style={styles.severityText}>
                  {incident.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.incidentMeta}>
              {formatDate(incident.created_at)}
            </Text>
          </View>
        ))
      )}

      <View style={styles.bottomPadding} />
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
  centered: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 1,
  },
  accessDenied: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e94560',
    marginBottom: 8,
  },
  accessDeniedSub: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  incidentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f5f5',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  incidentMeta: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 2,
  },
  incidentDetails: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  containBtn: {
    backgroundColor: '#e94560',
  },
  resolveBtn: {
    backgroundColor: '#4ecca3',
  },
  escalateBtn: {
    backgroundColor: '#f0a500',
  },
  playbookCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  playbookRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a3e',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ecca3',
    borderColor: '#4ecca3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  playbookContent: {
    flex: 1,
  },
  playbookText: {
    fontSize: 14,
    color: '#f5f5f5',
    lineHeight: 20,
  },
  playbookTextDone: {
    color: '#a0a0a0',
    textDecorationLine: 'line-through',
  },
  playbookSla: {
    fontSize: 11,
    color: '#e94560',
    marginTop: 2,
    fontWeight: '600',
  },
  resolvedCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  resolvedType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});
