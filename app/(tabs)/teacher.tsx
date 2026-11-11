
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import RotatingQR from '@/components/RotatingQR';

import { COLORS } from '@/constants/colors';
import { SHADOW } from '@/constants/theme';

import { createEvent } from '@/lib/events';
import { getProfile } from '@/lib/profiles';
import { useAuth } from '@/lib/auth';

// Format local date and time for database storage
function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

// Display readable date and time
function formatDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Quick event duration options
const QUICK_END_OPTIONS = [
  { label: '30 Minutes', ms: 30 * 60 * 1000 },
  { label: '1 Hour', ms: 60 * 60 * 1000 },
  { label: '2 Hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();

  // Teacher verification
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [roleLoading, setRoleLoading] = useState(true);

  // Event form
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');

  // Event schedule
  const [startDate, setStartDate] = useState(() => new Date());

  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );

  // Date picker
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');

  // Event creation
  const [creating, setCreating] = useState(false);

  const [payload, setPayload] = useState<{
    eventId: string;
    title: string;
    start: string;
    end: string;
  } | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const isAndroid = Platform.OS === 'android';

  // Check teacher role whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const checkRole = async () => {
        if (!user?.id) {
          setRole('student');
          setRoleLoading(false);
          return;
        }

        setRoleLoading(true);

        try {
          const profile = await getProfile(user.id);

          if (active) {
            setRole(profile?.role === 'teacher' ? 'teacher' : 'student');
          }
        } catch (error) {
          console.error('Failed to load profile:', error);

          if (active) {
            setRole('student');
          }
        } finally {
          if (active) {
            setRoleLoading(false);
          }
        }
      };

      void checkRole();

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  // Open date/time picker
  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  // Close date/time picker
  const closePicker = () => {
    setEditTarget(null);
    setEditingPart('date');
  };

  // Handle date/time changes
  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;

    if (event.type === 'dismissed' || !selected) {
      closePicker();
      return;
    }

    const current =
      editTarget === 'start' ? startDate : endDate;

    const next = new Date(current);

    if (isAndroid && editingPart === 'date') {
      // Preserve the existing time when changing the date
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
    } else {
      // Preserve the selected date when changing the time
      next.setHours(
        selected.getHours(),
        selected.getMinutes(),
        0,
        0
      );
    }

    if (editTarget === 'start') {
      setStartDate(next);
    } else {
      setEndDate(next);
    }

    if (isAndroid && editingPart === 'date') {
      // Android uses separate date and time pickers
      setEditingPart('time');
    } else {
      closePicker();
    }
  };

  // Set quick event duration
  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  // Reset event form after successful creation
  const resetForm = () => {
    setTitle('');
    setEventId('');

    const now = new Date();

    setStartDate(now);
    setEndDate(new Date(now.getTime() + 60 * 60 * 1000));

    setPayload(null);
    setMessage(null);
    closePicker();
  };

  // Create attendance event
  const handleCreateEvent = async () => {
    if (creating) return;

    setMessage(null);

    const cleanTitle = title.trim();
    const cleanEventId = eventId.trim().toUpperCase();

    // Validate event title
    if (!cleanTitle) {
      setMessageType('error');
      setMessage('Please enter an event title.');
      return;
    }

    if (cleanTitle.length > 100) {
      setMessageType('error');
      setMessage('Event title must not exceed 100 characters.');
      return;
    }

    // Validate event code
    if (!cleanEventId) {
      setMessageType('error');
      setMessage('Please enter an event code.');
      return;
    }

    if (cleanEventId.length > 50) {
      setMessageType('error');
      setMessage('Event code must not exceed 50 characters.');
      return;
    }

    // Validate schedule
    if (endDate.getTime() <= startDate.getTime()) {
      setMessageType('error');
      setMessage('End time must be later than start time.');
      return;
    }

    const eventData = {
      eventId: cleanEventId,
      title: cleanTitle,
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    setCreating(true);

    try {
      const { error } = await createEvent(eventData);

      if (error) {
        console.error('Event creation failed:', error);

        setMessageType('error');
        setMessage('Unable to create event. Please check your event details and try again.');
        return;
      }

      // Generate QR only after successful database creation
      setPayload(eventData);

      setTitle(cleanTitle);
      setEventId(cleanEventId);

      setMessageType('success');
      setMessage('Your event has been created successfully!');
    } catch (error) {
      console.error('Create event error:', error);

      setMessageType('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  // Loading screen
  if (roleLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Verifying your account...
        </Text>
      </View>
    );
  }

  // Teacher-only access
  if (role !== 'teacher') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.lockIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={48}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.lockTitle}>
          Teachers Only
        </Text>

        <Text style={styles.lockSubtitle}>
          This section is available only to teacher accounts.
          Please use an authorized teacher account to create
          and manage attendance events.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="calendar-outline"
            size={26}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>
          Create Event
        </Text>

        <Text style={styles.subtitle}>
          Set up your attendance event and generate
          a QR code for your students.
        </Text>
      </View>

      {/* Event Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={COLORS.primary}
          />

          <Text style={styles.sectionTitle}>
            Event Information
          </Text>
        </View>

        {/* Event Title */}
        <Text style={styles.label}>
          Event Title
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="document-text-outline"
            size={19}
            color={COLORS.textSecondary}
          />

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Founders Day Assembly"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={100}
            editable={!creating}
            returnKeyType="next"
          />
        </View>

        {/* Event Code */}
        <Text style={styles.label}>
          Event Code
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="qr-code-outline"
            size={19}
            color={COLORS.textSecondary}
          />

          <TextInput
            style={styles.input}
            value={eventId}
            onChangeText={(value) =>
              setEventId(value.toUpperCase())
            }
            placeholder="e.g. EVT-2026-0002"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={50}
            editable={!creating}
          />
        </View>

        <Text style={styles.helperText}>
          Enter a unique event code to identify this attendance event.
        </Text>
      </View>

      {/* Event Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="time-outline"
            size={21}
            color={COLORS.primary}
          />

          <Text style={styles.sectionTitle}>
            Event Schedule
          </Text>
        </View>

        {/* Start Date */}
        <Text style={styles.label}>
          Start Date and Time
        </Text>

        <PickerField
          value={formatDateTime(startDate)}
          icon="play-circle-outline"
          onPress={() => openPicker('start')}
          disabled={creating}
        />

        {/* End Date */}
        <Text style={styles.label}>
          End Date and Time
        </Text>

        <PickerField
          value={formatDateTime(endDate)}
          icon="stop-circle-outline"
          onPress={() => openPicker('end')}
          disabled={creating}
        />

        {/* Quick Duration */}
        <Text style={styles.quickLabel}>
          Quick Duration
        </Text>

        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
              onPress={() => handleQuickEnd(option.ms)}
              disabled={creating}
            >
              <Ionicons
                name="time-outline"
                size={15}
                color={COLORS.primary}
              />

              <Text style={styles.chipText}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.helperText}>
          Choose how long your attendance event will remain scheduled.
        </Text>

        {/* Date Picker */}
        {editTarget && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {editTarget === 'start'
                  ? 'Set Start'
                  : 'Set End'}{' '}
                {isAndroid
                  ? editingPart === 'date'
                    ? 'Date'
                    : 'Time'
                  : 'Date and Time'}
              </Text>

              {!isAndroid && (
                <Pressable
                  onPress={closePicker}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>
                    Done
                  </Text>
                </Pressable>
              )}
            </View>

            <DateTimePicker
              key={`${editTarget}-${editingPart}-${isAndroid ? 'android' : 'ios'}`}
              value={
                editTarget === 'start'
                  ? startDate
                  : endDate
              }
              mode={
                isAndroid
                  ? editingPart
                  : 'datetime'
              }
              display={
                isAndroid
                  ? 'default'
                  : 'spinner'
              }
              onChange={onPickerChange}
            />
          </View>
        )}
      </View>

      {/* Feedback Message */}
      {message && (
        <View
          style={[
            styles.messageContainer,
            messageType === 'success'
              ? styles.successMessage
              : styles.errorMessage,
          ]}
        >
          <Ionicons
            name={
              messageType === 'success'
                ? 'checkmark-circle'
                : 'alert-circle'
            }
            size={21}
            color={
              messageType === 'success'
                ? COLORS.success
                : COLORS.danger
            }
          />

          <Text
            style={[
              styles.messageText,
              {
                color:
                  messageType === 'success'
                    ? COLORS.success
                    : COLORS.danger,
              },
            ]}
          >
            {message}
          </Text>
        </View>
      )}

      {/* Create Event Button */}
      <View style={styles.createButtonContainer}>
        <AppButton
          theme="primary"
          title={
            creating
              ? 'Creating Event...'
              : 'Create Event'
          }
          icon="add-circle-outline"
          onPress={handleCreateEvent}
        />

        {creating && (
          <ActivityIndicator
            color={COLORS.primary}
            style={styles.buttonLoader}
          />
        )}
      </View>

      {/* Generated QR Code */}
      {payload && (
        <View style={styles.resultCard}>
          <View style={styles.successHeader}>
            <Ionicons
              name="checkmark-circle"
              size={23}
              color={COLORS.success}
            />

            <Text style={styles.successTitle}>
              Event Created Successfully
            </Text>
          </View>

          <Text style={styles.resultDescription}>
            Your attendance QR code is ready.
            Students can scan it using the Scan tab.
          </Text>

          <View style={styles.eventSummary}>
            <Text style={styles.summaryLabel}>
              EVENT TITLE
            </Text>

            <Text style={styles.summaryValue}>
              {payload.title}
            </Text>

            <Text style={styles.summaryLabel}>
              EVENT CODE
            </Text>

            <Text style={styles.summaryValue}>
              {payload.eventId}
            </Text>

            <Text style={styles.summaryLabel}>
              STARTS
            </Text>

            <Text style={styles.summaryValue}>
              {formatDateTime(startDate)}
            </Text>

            <Text style={styles.summaryLabel}>
              ENDS
            </Text>

            <Text style={styles.summaryValue}>
              {formatDateTime(endDate)}
            </Text>
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>
              Attendance QR Code
            </Text>

            <RotatingQR
              code={payload.eventId}
              title={payload.title}
              start={payload.start}
              end={payload.end}
            />
          </View>

          <View style={styles.qrNotice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.primary}
            />

            <Text style={styles.noticeText}>
              Keep this QR code visible during the
              attendance period. Students should
              scan it using their QR-ATT application.
            </Text>
          </View>

          <Pressable
            style={styles.newEventButton}
            onPress={resetForm}
          >
            <Ionicons
              name="add-circle-outline"
              size={19}
              color={COLORS.primary}
            />

            <Text style={styles.newEventText}>
              Create Another Event
            </Text>
          </Pressable>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={15}
          color={COLORS.textSecondary}
        />

        <Text style={styles.footerText}>
          QR-ATT | Teacher Event Management
        </Text>
      </View>

    </ScrollView>
  );
}

// Reusable Date and Time Picker Field
type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
};

function PickerField({
  value,
  icon,
  onPress,
  disabled = false,
}: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickerField,
        pressed && !disabled && styles.pickerFieldPressed,
        disabled && styles.disabledField,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={21}
        color={COLORS.primary}
      />

      <Text style={styles.pickerValue}>
        {value}
      </Text>

      <Ionicons
        name="calendar-outline"
        size={19}
        color={COLORS.textSecondary}
      />
    </Pressable>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 45,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  headerIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7,
    paddingHorizontal: 12,
  },

  // Sections
  section: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  helperText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 17,
  },

  // Date and Time Picker
  pickerField: {
    ...SHADOW.card,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pickerFieldPressed: {
    opacity: 0.7,
  },

  pickerValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },

  disabledField: {
    opacity: 0.5,
  },

  // Quick Duration
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 18,
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  chipPressed: {
    opacity: 0.65,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  pickerContainer: {
    marginTop: 18,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },

  doneText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },

  // Feedback
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },

  successMessage: {
    backgroundColor: '#E8F5E9',
  },

  errorMessage: {
    backgroundColor: '#FCE8E6',
  },

  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },

  // Create Button
  createButtonContainer: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 12,
  },

  buttonLoader: {
    position: 'absolute',
    right: 20,
    top: '35%',
  },

  // Generated QR
  resultCard: {
    ...SHADOW.card,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
  },

  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
  },

  resultDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 18,
  },

  eventSummary: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 15,
    gap: 6,
    marginBottom: 18,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginTop: 5,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qrTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  qrNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 13,
    marginTop: 16,
  },

  noticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  newEventButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  newEventText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 25,
  },

  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Loading and Access
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  lockIcon: {
    width: 85,
    height: 85,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 20,
  },

  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});
