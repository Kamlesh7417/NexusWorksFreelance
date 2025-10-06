/**
 * Smart Toast Notification System
 * Provides intelligent, role-based notifications and user guidance
 */

import { DjangoUser } from '@/components/auth/django-auth-provider';

export interface SmartNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  priority: 'low' | 'medium' | 'high';
  duration?: number; // in milliseconds, 0 for persistent
  dismissible?: boolean;
}

export class SmartNotificationService {
  private static instance: SmartNotificationService;
  private notifications: SmartNotification[] = [];
  private listeners: ((notifications: SmartNotification[]) => void)[] = [];

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  public subscribe(listener: (notifications: SmartNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public showNotification(notification: Omit<SmartNotification, 'id'>) {
    const newNotification: SmartNotification = {
      ...notification,
      id: this.generateId(),
      dismissible: notification.dismissible !== false,
      duration: notification.duration || (notification.priority === 'high' ? 0 : 5000)
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismissNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }

  public dismissNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  public clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Smart notification methods based on user context
  public checkProfileCompleteness(user: DjangoUser) {
    if (!user.profile_completed) {
      this.showNotification({
        type: 'info',
        title: 'Complete Your Profile',
        message: 'Complete your profile to get better project matches and increase visibility',
        action: { 
          label: 'Complete Profile', 
          href: '/profile' 
        },
        priority: 'medium'
      });

      // Specific guidance based on missing information
      if (!user.github_username) {
        this.showNotification({
          type: 'info',
          title: 'Connect GitHub',
          message: 'Connect your GitHub account for enhanced skill matching and portfolio analysis',
          action: { 
            label: 'Connect GitHub', 
            href: '/profile?tab=github' 
          },
          priority: 'medium'
        });
      }
    }
  }

  public showRoleBasedMessage(user: DjangoUser, attemptedAction: string) {
    const isClient = user.role === 'client' || user.user_type === 'client';
    const isDeveloper = user.role === 'developer' || user.user_type === 'freelancer';

    switch (attemptedAction) {
      case 'create_project':
        if (!isClient) {
          this.showNotification({
            type: 'warning',
            title: 'Access Restricted',
            message: 'Only clients can create projects. Browse available projects instead.',
            action: { 
              label: 'Browse Projects', 
              href: '/projects' 
            },
            priority: 'medium'
          });
        }
        break;

      case 'bid_on_project':
        if (!isDeveloper) {
          this.showNotification({
            type: 'info',
            title: 'Developer Feature',
            message: 'This feature is available for developers only.',
            action: { 
              label: 'Switch to Developer', 
              href: '/profile?tab=role' 
            },
            priority: 'low'
          });
        }
        break;

      case 'access_console':
        if (!isClient) {
          this.showNotification({
            type: 'info',
            title: 'Client Feature',
            message: 'Project console is available for clients managing their projects.',
            action: { 
              label: 'View Dashboard', 
              href: '/dashboard' 
            },
            priority: 'low'
          });
        }
        break;

      case 'view_earnings':
        if (!isDeveloper) {
          this.showNotification({
            type: 'info',
            title: 'Developer Feature',
            message: 'Earnings tracking is available for developers only.',
            priority: 'low'
          });
        }
        break;
    }
  }

  public showSuccessMessage(message: string, title?: string) {
    this.showNotification({
      type: 'success',
      title: title || 'Success',
      message,
      priority: 'medium'
    });
  }

  public showErrorMessage(message: string, title?: string) {
    this.showNotification({
      type: 'error',
      title: title || 'Error',
      message,
      priority: 'high',
      duration: 0 // Persistent for errors
    });
  }

  public showSkillsPrompt(user: DjangoUser) {
    if (user.role === 'developer' || user.user_type === 'freelancer') {
      this.showNotification({
        type: 'info',
        title: 'Add Your Skills',
        message: 'Add skills to your profile to get better project recommendations',
        action: { 
          label: 'Add Skills', 
          href: '/profile?tab=skills' 
        },
        priority: 'high'
      });
    }
  }

  public showResumeUploadPrompt(user: DjangoUser) {
    if (user.role === 'developer' || user.user_type === 'freelancer') {
      this.showNotification({
        type: 'info',
        title: 'Upload Resume',
        message: 'Upload your resume for AI-powered skill analysis and better matches',
        action: { 
          label: 'Upload Resume', 
          href: '/profile?tab=resume' 
        },
        priority: 'medium'
      });
    }
  }

  public showPaymentMilestoneNotification(projectTitle: string, amount: number) {
    this.showNotification({
      type: 'success',
      title: 'Milestone Payment',
      message: `Payment of $${amount.toLocaleString()} received for "${projectTitle}"`,
      action: { 
        label: 'View Payments', 
        href: '/payments' 
      },
      priority: 'high'
    });
  }

  public showProjectStatusUpdate(projectTitle: string, status: string) {
    this.showNotification({
      type: 'info',
      title: 'Project Update',
      message: `"${projectTitle}" status changed to ${status.replace('_', ' ')}`,
      action: { 
        label: 'View Project', 
        href: '/projects' 
      },
      priority: 'medium'
    });
  }

  public showWelcomeMessage(user: DjangoUser) {
    const isClient = user.role === 'client' || user.user_type === 'client';
    const isDeveloper = user.role === 'developer' || user.user_type === 'freelancer';

    if (isClient) {
      this.showNotification({
        type: 'success',
        title: 'Welcome to NexusWorks!',
        message: 'Ready to find amazing developers for your projects?',
        action: { 
          label: 'Post Your First Project', 
          href: '/projects/create' 
        },
        priority: 'medium'
      });
    } else if (isDeveloper) {
      this.showNotification({
        type: 'success',
        title: 'Welcome to NexusWorks!',
        message: 'Discover exciting projects that match your skills',
        action: { 
          label: 'Browse Projects', 
          href: '/projects' 
        },
        priority: 'medium'
      });
    }
  }
}

// Export singleton instance
export const smartNotifications = SmartNotificationService.getInstance();

// React hook for using smart notifications
export function useSmartNotifications() {
  return {
    showNotification: (notification: Omit<SmartNotification, 'id'>) => 
      smartNotifications.showNotification(notification),
    showSuccess: (message: string, title?: string) => 
      smartNotifications.showSuccessMessage(message, title),
    showError: (message: string, title?: string) => 
      smartNotifications.showErrorMessage(message, title),
    checkProfileCompleteness: (user: DjangoUser) => 
      smartNotifications.checkProfileCompleteness(user),
    showRoleBasedMessage: (user: DjangoUser, action: string) => 
      smartNotifications.showRoleBasedMessage(user, action),
    showSkillsPrompt: (user: DjangoUser) => 
      smartNotifications.showSkillsPrompt(user),
    showResumeUploadPrompt: (user: DjangoUser) => 
      smartNotifications.showResumeUploadPrompt(user),
    showWelcomeMessage: (user: DjangoUser) => 
      smartNotifications.showWelcomeMessage(user),
    dismiss: (id: string) => 
      smartNotifications.dismissNotification(id),
    clearAll: () => 
      smartNotifications.clearAll()
  };
}