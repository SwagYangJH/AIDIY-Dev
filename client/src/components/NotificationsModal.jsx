import React from 'react';
import { tw } from '@twind/core';

const NotificationsModal = ({ isOpen, onClose, notifications, onApprove, onDecline, onApproveChore }) => {
  if (!isOpen) return null;

  const handleApproveChore = async (notification) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`http://localhost:5500/api/chores/${notification.chore_id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Chore approved! ${data.reward_added.toFixed(2)} added to ${notification.kid_username}'s goal.`);
        // Refresh notifications
        window.location.reload();
      } else {
        alert(data.error || 'Failed to approve chore');
      }
    } catch (error) {
      console.error('Error approving chore:', error);
      alert('Failed to approve chore. Please try again.');
    }
  };

  const handleMarkSingleRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`http://localhost:5500/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Refresh notifications after marking as read
        window.location.reload(); // Simple refresh - you might want to call a callback instead
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      
      // Less than 1 minute
      if (diff < 60000) return 'Just now';
      
      // Less than 1 hour
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      }
      
      // Less than 1 day
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      }
      
      // Less than 1 week
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
      }
      
      // More than 1 week, show date
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getNotificationIcon = (type, message) => {
    if (message?.includes('goal')) return '🎯';
    if (message?.includes('chore')) return '✅';
    if (message?.includes('reward')) return '💰';
    if (type === 'goal_request') return '🎯';
    if (type === 'chore_completed') return '✅';
    return '🔔';
  };

  return (
    <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
      <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden')}>
        <div className={tw('bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-6 text-white')}>
          <div className={tw('flex items-center justify-between')}>
            <div>
              <h2 className={tw('text-2xl font-bold')}>Notifications</h2>
              <p className={tw('text-white/80')}>Stay updated with your family's activities</p>
            </div>
            <button
              onClick={onClose}
              className={tw('w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors')}
            >
              ✕
            </button>
          </div>
        </div>

        <div className={tw('overflow-y-auto max-h-[60vh]')}>
          {notifications.length === 0 ? (
            <div className={tw('p-8 text-center')}>
              <div className={tw('w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center')}>
                <span className={tw('text-3xl')}>🔔</span>
              </div>
              <h3 className={tw('text-lg font-semibold text-gray-800 mb-2')}>All caught up!</h3>
              <p className={tw('text-gray-600')}>No new notifications at the moment</p>
            </div>
          ) : (
            <div className={tw('divide-y divide-gray-100')}>
              {notifications.map((notification) => (
                <div key={notification._id} className={tw('p-6 hover:bg-gray-50 transition-colors')}>
                  <div className={tw('flex items-start gap-4')}>
                    <div className={tw('w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg')}>
                      <span className={tw('text-xl')}>
                        {notification.type === 'goal_approval_request' ? '🎯' :
                         notification.type === 'chore_completion' ? '✅' :
                         notification.type === 'chore_deadline_warning' ? '⏰' :
                         notification.type === 'chore_overdue' ? '❌' :
                         notification.type === 'progress_submission' ? '📊' : '🔔'}
                      </span>
                    </div>
                    
                    <div className={tw('flex-1')}>
                      <div className={tw('flex items-start justify-between mb-2')}>
                        <div>
                          <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
                          <p className={tw('text-gray-600 text-sm mt-1')}>{notification.message}</p>
                          {notification.kid_avatar && (
                            <p className={tw('text-xs text-gray-500 mt-2')}>
                              From: <span className={tw('font-medium')}>{notification.kid_avatar} {notification.kid_username}</span>
                            </p>
                          )}
                        </div>
                        {!notification.read && (
                          <span className={tw('w-2 h-2 bg-blue-500 rounded-full animate-pulse')} />
                        )}
                      </div>
                      
                      <div className={tw('flex items-center gap-3 mt-3')}>
                        {notification.type === 'goal_approval_request' && notification.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onApprove(notification.goal_id)}
                              className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
                            >
                              Approve Goal
                            </button>
                            <button
                              onClick={() => onDecline(notification.goal_id)}
                              className={tw('px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors')}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        {notification.type === 'chore_completion' && (
                          <>
                            <span className={tw('text-sm font-medium text-green-600')}>
                              Reward: ${notification.reward_amount?.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleApproveChore(notification)}
                              className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
                            >
                              Approve & Add Reward
                            </button>
                          </>
                        )}
                        
                        {notification.type === 'chore_overdue' && (
                          <span className={tw('text-sm font-medium text-red-600')}>
                            Action Required
                          </span>
                        )}
                        
                        {notification.type === 'progress_submission' && (
                          <>
                            <span className={tw('text-sm font-medium text-green-600')}>
                              Earned: ${notification.earned_amount?.toFixed(2)}
                            </span>
                            <button
                              onClick={() => onApprove(notification.goal_id)}
                              className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
                            >
                              Approve Progress
                            </button>
                          </>
                        )}
                        
                        <span className={tw('text-xs text-gray-500')}>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;