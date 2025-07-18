/**
 * Communication Service
 * Handles messaging, notifications, and real-time communication
 */

import { apiClient, APIResponse, PaginatedResponse } from '../api-client';

export interface Conversation {
  id: string;
  participants: string[];
  project?: string;
  title: string;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: string;
  sender_name: string;
  content: string;
  message_type: 'text' | 'file' | 'system' | 'task_update' | 'payment_notification';
  attachments: MessageAttachment[];
  is_read: boolean;
  created_at: string;
  edited_at?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  download_url: string;
}

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'project_update' | 'payment' | 'task_assignment' | 'message' | 'system';
  related_object_type?: string;
  related_object_id?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  project_updates: boolean;
  payment_notifications: boolean;
  task_assignments: boolean;
  messages: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
}

class CommunicationService {
  /**
   * Get user conversations
   */
  async getConversations(filters?: {
    project?: string;
    unread_only?: boolean;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Conversation>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/communications/conversations/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeAPIRequest(endpoint);
  }

  /**
   * Get specific conversation
   */
  async getConversation(conversationId: string): Promise<APIResponse<Conversation>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/`);
  }

  /**
   * Create new conversation
   */
  async createConversation(data: {
    participants: string[];
    project?: string;
    title: string;
    initial_message?: string;
  }): Promise<APIResponse<Conversation>> {
    return apiClient.makeAPIRequest('/communications/conversations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, page?: number): Promise<APIResponse<PaginatedResponse<Message>>> {
    const endpoint = `/communications/conversations/${conversationId}/messages/${page ? `?page=${page}` : ''}`;
    return apiClient.makeAPIRequest(endpoint);
  }

  /**
   * Send message
   */
  async sendMessage(data: {
    conversation: string;
    content: string;
    message_type?: string;
    attachments?: File[];
  }): Promise<APIResponse<Message>> {
    // Handle file uploads if attachments exist
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('conversation', data.conversation);
      formData.append('content', data.content);
      formData.append('message_type', data.message_type || 'text');
      
      data.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      return apiClient.makeAPIRequest('/communications/messages/', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set content-type for FormData
      });
    } else {
      return apiClient.sendMessage(data.conversation, data.content);
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, content: string): Promise<APIResponse<Message>> {
    return apiClient.makeAPIRequest(`/communications/messages/${messageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/messages/${messageId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest('/communications/messages/mark-read/', {
      method: 'POST',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/mark-read/`, {
      method: 'POST',
    });
  }

  /**
   * Get notifications
   */
  async getNotifications(filters?: {
    type?: string;
    unread_only?: boolean;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Notification>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/communications/notifications/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeAPIRequest(endpoint);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/notifications/${notificationId}/mark-read/`, {
      method: 'POST',
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest('/communications/notifications/mark-all-read/', {
      method: 'POST',
    });
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<APIResponse<NotificationSettings>> {
    return apiClient.makeAPIRequest('/communications/notification-settings/');
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<APIResponse<NotificationSettings>> {
    return apiClient.makeAPIRequest('/communications/notification-settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Send system notification (admin only)
   */
  async sendSystemNotification(data: {
    recipients: string[];
    title: string;
    message: string;
    type?: string;
    action_url?: string;
  }): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest('/communications/system-notifications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get unread counts
   */
  async getUnreadCounts(): Promise<APIResponse<{
    messages: number;
    notifications: number;
    project_updates: number;
    payment_notifications: number;
  }>> {
    return apiClient.makeAPIRequest('/communications/unread-counts/');
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, filters?: {
    conversation?: string;
    sender?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<APIResponse<Message[]>> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/communications/search/?${params.toString()}`;
    return apiClient.makeAPIRequest(endpoint);
  }

  /**
   * Upload file attachment
   */
  async uploadAttachment(file: File): Promise<APIResponse<MessageAttachment>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.makeAPIRequest('/communications/attachments/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  /**
   * Download attachment
   */
  async downloadAttachment(attachmentId: string): Promise<APIResponse<Blob>> {
    return apiClient.makeAPIRequest(`/communications/attachments/${attachmentId}/download/`, {
      method: 'GET',
    });
  }

  /**
   * Get conversation participants
   */
  async getConversationParticipants(conversationId: string): Promise<APIResponse<any[]>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/participants/`);
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(conversationId: string, userId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/participants/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/participants/${userId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/archive/`, {
      method: 'POST',
    });
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(conversationId: string): Promise<APIResponse<void>> {
    return apiClient.makeAPIRequest(`/communications/conversations/${conversationId}/unarchive/`, {
      method: 'POST',
    });
  }
}

export const communicationService = new CommunicationService();
export default communicationService;