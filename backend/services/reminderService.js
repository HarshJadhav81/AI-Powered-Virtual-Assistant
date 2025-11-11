/**
 * Reminder Service - Alarm & Notification System
 * [COPILOT-UPGRADE]: MongoDB-based reminder system with Node Cron scheduling
 */

import cron from 'node-cron';
import Reminder from '../models/reminder.model.js';

class ReminderService {
  constructor() {
    this.activeReminders = new Map(); // Store active cron jobs
    this.notificationCallbacks = new Map(); // WebSocket callbacks per user
  }

  /**
   * Create a new reminder
   */
  async createReminder(userId, reminderData) {
    try {
      const { title, description, time, repeat, type } = reminderData;

      // Create reminder in database
      const reminder = await Reminder.create({
        userId,
        title,
        description,
        scheduledTime: new Date(time),
        repeat: repeat || 'once', // once, daily, weekly, monthly
        type: type || 'reminder', // reminder, alarm
        isActive: true
      });

      // Schedule the reminder
      await this.scheduleReminder(reminder);

      console.info('[REMINDER-SERVICE]', `Created reminder: ${reminder._id}`);

      return {
        success: true,
        reminder: this.formatReminder(reminder),
        voiceResponse: `Reminder set for ${new Date(time).toLocaleString()}: ${title}`
      };
    } catch (error) {
      console.error('[REMINDER-ERROR]:', error);
      throw new Error('Failed to create reminder');
    }
  }

  /**
   * Schedule a reminder with node-cron
   */
  async scheduleReminder(reminder) {
    const scheduledTime = new Date(reminder.scheduledTime);
    const now = new Date();

    if (scheduledTime <= now) {
      console.warn('[REMINDER-SERVICE]', 'Reminder time is in the past, skipping');
      return;
    }

    // Convert to cron format
    const cronExpression = this.getCronExpression(scheduledTime, reminder.repeat);

    // Create cron job
    const job = cron.schedule(cronExpression, async () => {
      await this.triggerReminder(reminder);
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata' // Change to user's timezone
    });

    this.activeReminders.set(reminder._id.toString(), job);
    console.info('[REMINDER-SERVICE]', `Scheduled reminder: ${reminder._id} at ${cronExpression}`);
  }

  /**
   * Convert time to cron expression
   */
  getCronExpression(date, repeat) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    switch (repeat) {
      case 'daily':
        return `${minute} ${hour} * * *`; // Every day at specific time
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`; // Every week on same day
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`; // Every month on same date
      case 'once':
      default:
        return `${minute} ${hour} ${dayOfMonth} ${month} *`; // Specific date/time
    }
  }

  /**
   * Trigger reminder notification
   */
  async triggerReminder(reminder) {
    try {
      console.info('[REMINDER-SERVICE]', `Triggering reminder: ${reminder._id}`);

      // Get notification callback for this user
      const callback = this.notificationCallbacks.get(reminder.userId.toString());
      
      if (callback) {
        // Send notification via WebSocket
        callback({
          type: 'reminder',
          reminderId: reminder._id,
          title: reminder.title,
          description: reminder.description,
          time: reminder.scheduledTime
        });
      }

      // Update reminder status
      if (reminder.repeat === 'once') {
        await Reminder.findByIdAndUpdate(reminder._id, { isActive: false });
        this.stopReminder(reminder._id.toString());
      }
    } catch (error) {
      console.error('[REMINDER-TRIGGER-ERROR]:', error);
    }
  }

  /**
   * Get user's reminders
   */
  async getUserReminders(userId, activeOnly = true) {
    try {
      const query = { userId };
      if (activeOnly) {
        query.isActive = true;
      }

      const reminders = await Reminder.find(query).sort({ scheduledTime: 1 });

      return {
        reminders: reminders.map(r => this.formatReminder(r)),
        count: reminders.length
      };
    } catch (error) {
      console.error('[REMINDER-ERROR]:', error);
      throw new Error('Failed to fetch reminders');
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId) {
    try {
      await Reminder.findByIdAndDelete(reminderId);
      this.stopReminder(reminderId);

      return {
        success: true,
        voiceResponse: 'Reminder deleted successfully'
      };
    } catch (error) {
      console.error('[REMINDER-ERROR]:', error);
      throw new Error('Failed to delete reminder');
    }
  }

  /**
   * Stop a scheduled reminder
   */
  stopReminder(reminderId) {
    const job = this.activeReminders.get(reminderId);
    if (job) {
      job.stop();
      this.activeReminders.delete(reminderId);
      console.info('[REMINDER-SERVICE]', `Stopped reminder: ${reminderId}`);
    }
  }

  /**
   * Register notification callback for a user
   */
  registerNotificationCallback(userId, callback) {
    this.notificationCallbacks.set(userId.toString(), callback);
  }

  /**
   * Unregister notification callback
   */
  unregisterNotificationCallback(userId) {
    this.notificationCallbacks.delete(userId.toString());
  }

  /**
   * Load all active reminders on server start
   */
  async loadActiveReminders() {
    try {
      const activeReminders = await Reminder.find({ isActive: true });
      
      for (const reminder of activeReminders) {
        await this.scheduleReminder(reminder);
      }

      console.info('[REMINDER-SERVICE]', `Loaded ${activeReminders.length} active reminders`);
    } catch (error) {
      console.error('[REMINDER-LOAD-ERROR]:', error);
    }
  }

  /**
   * Format reminder for response
   */
  formatReminder(reminder) {
    return {
      id: reminder._id,
      title: reminder.title,
      description: reminder.description,
      time: reminder.scheduledTime,
      repeat: reminder.repeat,
      type: reminder.type,
      isActive: reminder.isActive
    };
  }
}

// Export singleton instance
const reminderService = new ReminderService();
export default reminderService;
