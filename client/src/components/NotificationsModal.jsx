import React from 'react';
import { tw } from '@twind/core';

const NotificationsModal = ({
  isOpen,
  onClose,
  notifications,
  onApprove,
  onDecline,
  onApproveProgress,
  onDeclineProgress,
  onApproveChore,
  onDeclineChore
  
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch('http://localhost:5500/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
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
        window.location.reload();
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

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'goal_approved': return '🎯';
      case 'goal_declined': return '⚠️';
      case 'chore_completed': return '✅';
      case 'chore_approved': return '💰';
      case 'chore_declined': return '🔄';
      case 'goal_completed': return '🏆';
      default: return '🔔';
    }
  };

  const getMessageColor = (type) => {
    if (type === 'goal_approved' || type === 'chore_approved') return 'text-green-600';
    if (type === 'goal_declined' || type === 'chore_declined') return 'text-yellow-600';
    return 'text-gray-900';
  };

  return (
    <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
      <div className={tw('bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col')}>
        {/* Header */}
        <div className={tw('p-6 border-b border-gray-100 flex items-center justify-between')}>
          <div>
            <h2 className={tw('text-2xl font-bold text-gray-900')}>🔔 Notifications</h2>
            <p className={tw('text-gray-600 text-sm')}>Stay updated with your family's progress</p>
          </div>
          <div className={tw('flex items-center gap-3')}>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className={tw('px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200')}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className={tw('p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg')}
            >
              <svg className={tw('w-6 h-6')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className={tw('flex-1 overflow-y-auto')}>
          {notifications.length === 0 ? (
            <div className={tw('text-center py-16')}>
              <div className={tw('w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center')}>
                <span className={tw('text-4xl')}>🔔</span>
              </div>
              <h3 className={tw('text-lg font-semibold text-gray-800 mb-2')}>All caught up!</h3>
              <p className={tw('text-gray-600')}>No notifications at the moment</p>
            </div>
          ) : (
            <div className={tw('divide-y divide-gray-100')}>
              {notifications.map((notification) => (
                <div key={notification._id} className={tw(`p-6 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`)}>
                  <div className={tw('flex items-start gap-4')}>
                    <div className={tw(`w-12 h-12 rounded-2xl flex items-center justify-center ${!notification.read ? 'bg-blue-100' : 'bg-gray-100'}`)}>
                      <span className={tw('text-2xl')}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    <div className={tw('flex-1 min-w-0')}>
                      <div className={tw('flex items-start justify-between mb-2')}>
                        <div className={tw('flex-1')}>
                          {notification.type !== 'goal_completed' && (
                            <p className={tw(`${getMessageColor(notification.type)} ${!notification.read ? 'font-semibold' : 'font-medium'}`)}>
                              {notification.message || notification.title}
                            </p>
                          )}
                          <p className={tw('text-sm text-gray-500 mt-1')}>
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && <div className={tw('w-3 h-3 bg-blue-500 rounded-full ml-2 mt-1')}></div>}
                      </div>

                      {/* Goal Completed - Special Styling */}
                      {notification.type === 'goal_completed' && (
                        <div className={tw("bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg mb-2")}>
                          <p className={tw("text-lg font-bold text-green-700")}>
                            🎉 Goal Achieved!
                          </p>
                          <p>{notification.message}</p>
                        </div>
                      )}

                      {/* Goal Approval */}
                      {notification.type === 'goal_request' && notification.goal_id && (
                        <div className={tw('flex gap-2 mt-3 flex-wrap')}>
                          <button onClick={() => { onApprove(notification.goal_id); handleMarkSingleRead(notification._id); }} className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600')}>
                            ✅ Approve
                          </button>
                          <button onClick={() => { onDecline(notification.goal_id); handleMarkSingleRead(notification._id); }} className={tw('px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600')}>
                            ❌ Decline
                          </button>
                          <button onClick={() => handleMarkSingleRead(notification._id)} className={tw('px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200')}>
                            Mark as read
                          </button>
                        </div>
                      )}

                      // In NotificationsModal component
                      {notification.type === "chore_completed" && (
                        <div className="mt-3">
                          <button onClick={() => onApproveChore(notification.chore_id)}>
                            ✅ Approve
                          </button>
                          <button onClick={() => onDeclineChore(notification.chore_id)}>
                            ❌ Decline
                          </button>
                        </div>
                      )}

                      {/* Progress Submission */}
                      {notification.type === 'progress_submission' && (
                        <div className={tw('mt-3')}>
                          <p>Earned: <strong>${notification.earned_amount}</strong></p>
                          <ul className={tw('list-disc pl-5 mt-2')}>
                            {notification.completed_chores?.map((chore, index) => (
                              <li key={index}>{chore.title} - ${chore.reward}</li>
                            ))}
                          </ul>
                          <div className={tw('flex gap-2 mt-3 flex-wrap')}>
                            <button onClick={() => { onApproveProgress(notification._id); handleMarkSingleRead(notification._id); }} className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600')}>
                              ✅ Approve
                            </button>
                            <button onClick={() => { onDeclineProgress(notification._id); handleMarkSingleRead(notification._id); }} className={tw('px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600')}>
                              ❌ Decline
                            </button>
                            <button onClick={() => handleMarkSingleRead(notification._id)} className={tw('px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200')}>
                              Mark as read
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Other types */}
                      {notification.type !== 'goal_request' && 
                       notification.type !== 'progress_submission' && 
                       notification.type !== 'goal_completed' && 
                       !notification.read && (
                        <button onClick={() => handleMarkSingleRead(notification._id)} className={tw('px-3 py-1 mt-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200')}>
                          Mark as read
                        </button>
                      )}
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