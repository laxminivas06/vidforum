import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'PARENT'>('STUDENT');
  const [selectedChild, setSelectedChild] = useState<string | null>('student-001');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandLetter}>V</Text>
          <Text style={styles.brandText}>ID</Text>
        </View>
        <Text style={styles.headerTitle}>VID Educational Ecosystem</Text>
        <Text style={styles.headerSubtitle}>Unified Mobile Portal</Text>
      </View>

      <View style={styles.roleToggleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, selectedRole === 'STUDENT' && styles.roleButtonActive]}
          onPress={() => setSelectedRole('STUDENT')}
        >
          <Text style={[styles.roleButtonText, selectedRole === 'STUDENT' && styles.roleButtonTextActive]}>
            Student Portal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, selectedRole === 'PARENT' && styles.roleButtonActive]}
          onPress={() => setSelectedRole('PARENT')}
        >
          <Text style={[styles.roleButtonText, selectedRole === 'PARENT' && styles.roleButtonTextActive]}>
            Parent Portal
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>
          {selectedRole === 'STUDENT' ? 'Student Workspace' : 'Parent Dashboard'}
        </Text>
        <Text style={styles.cardBody}>
          {selectedRole === 'STUDENT'
            ? 'Access your academic overview, roll-call attendance, class timetable, examination grades, and 24/7 AI Tutor.'
            : 'Multi-child overview: Select enrolled child to review live attendance, fee structures, report cards, and teacher notes.'}
        </Text>

        {selectedRole === 'PARENT' && (
          <View style={styles.childSelectorBox}>
            <Text style={styles.childSelectorLabel}>Selected Child (Rule 9):</Text>
            <Text style={styles.childSelectorValue}>Aarav Sen (Grade 8-A)</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phase 2 Mobile Shell Initialized • Rule 20 Enforced</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  brandLetter: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 16,
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  childSelectorBox: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  childSelectorLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  childSelectorValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
