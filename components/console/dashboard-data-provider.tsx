'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../auth/auth-provider';

interface DashboardData {
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalEarnings: number;
    averageRating: number;
    upcomingDeadlines: number;
    unreadMessages: number;
    pendingPayments: number;
  };
  recentActivity: ActivityItem[];
  notifications: DashboardNotification[];
  quickActions: QuickAction[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface ActivityItem {
  id: string;
  type: 'project' | 'message' | 'payment' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  link?: string;
}

interface DashboardNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
}

interface DashboardDataContextType extends DashboardData {
  refreshData: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  addActivity: (activity: ActivityItem) => void;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalEarnings: 0,
      averageRating: 0,
      upcomingDeadlines: 0,
      unreadMessages: 0,
      pendingPayments: 0,
    },
    recentActivity: [],
    notifications: [],
    quickActions: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Mock data generation based on user role
  const generateMockData = (): DashboardData => {
    const isClient = profile?.role === 'client';
    const isDeveloper = profile?.role === 'developer';
    
    // Generate stats based on role
    const stats = {
      totalProjects: isClient ? 8 : 12,
      activeProjects: isClient ? 3 : 5,
      completedProjects: isClient ? 5 : 7,
      totalEarnings: isClient ? 45000 : 78000,
      averageRating: 4.8,
      upcomingDeadlines: 2,
      unreadMessages: 4,
      pendingPayments: isClient ? 1 : 3,
    };

    // Generate recent activity
    const recentActivity: ActivityItem[] = [
      {
        id: '1',
        type: 'project',
        title: 'Project milestone completed',
        description: 'E-commerce Platform Redesign - Phase 2 completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        icon: 'CheckCircle',
      },
      {
        id: '2',
        type: 'message',
        title: 'New message received',
        description: 'Sarah Johnson sent you a message about the mobile app project',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        icon: 'MessageSquare',
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment received',
        description: '$2,500 payment for AI Chatbot Integration project',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        icon: 'DollarSign',
      },
      {
        id: '4',
        type: 'project',
        title: 'New project proposal',
        description: 'Blockchain Voting System - Proposal submitted for review',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        icon: 'FileText',
      },
      {
        id: '5',
        type: 'system',
        title: 'Profile updated',
        description: 'Your skills and portfolio have been updated',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        icon: 'User',
      },
    ];

    // Generate notifications
    const notifications: DashboardNotification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Deadline approaching',
        message: 'Mobile App Development project deadline is in 3 days',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/console?section=projects',
        actionText: 'View Project',
      },
      {
        id: '2',
        type: 'info',
        title: 'New team member added',
        message: 'Alex Chen has joined the E-commerce Platform Redesign team',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        type: 'success',
        title: 'Payment processed',
        message: 'Your payment of $2,500 has been successfully processed',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
      },
    ];

    return {
      stats,
      recentActivity,
      notifications,
      quickActions: [], // Will be populated by the component
      loading: false,
      error: null,
      lastUpdated: new Date(),
    };
  };

  // Load dashboard data
  const refreshData = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newData = generateMockData();
      setData(newData);
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  };

  // Mark notification as read
  const markNotificationRead = (id: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  // Dismiss notification
  const dismissNotification = (id: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  };

  // Add new activity item
  const addActivity = (activity: ActivityItem) => {
    setData(prev => ({
      ...prev,
      recentActivity: [activity, ...prev.recentActivity.slice(0, 9)], // Keep only 10 items
    }));
  };

  // Load data when user changes
  useEffect(() => {
    if (user && profile) {
      refreshData();
    }
  }, [user, profile]);

  // Set up real-time updates (mock)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      const shouldUpdate = Math.random() < 0.1; // 10% chance every 30 seconds
      
      if (shouldUpdate) {
        const activityTypes = ['message', 'project', 'payment', 'system'];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)] as ActivityItem['type'];
        
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: randomType,
          title: `New ${randomType} update`,
          description: `Real-time update for ${randomType}`,
          timestamp: new Date(),
          icon: randomType === 'message' ? 'MessageSquare' : 
                randomType === 'project' ? 'Folder' :
                randomType === 'payment' ? 'DollarSign' : 'Bell',
        };
        
        addActivity(newActivity);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value: DashboardDataContextType = {
    ...data,
    refreshData,
    markNotificationRead,
    dismissNotification,
    addActivity,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}