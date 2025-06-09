import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';
import AIAvatar from './AIAvatar';
import BellIcon from './BellIcon';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCreateChore, setShowCreateChore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [userProfile, setUserProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [chores, setChores] = useState([
    {
      id: 1,
      title: 'Learn to make pancakes',
      description: 'Follow the recipe and make pancakes for family breakfast',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 8.00,
      difficulty: 'Hard',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Help with dishes',
      description: 'Load dishwasher and wipe down counters',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 5.00,
      difficulty: 'Medium',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Clean bedroom',
      description: 'Make bed, organize toys, and put clothes away',
      assignedTo: 'Alex',
      dueDate: 'May 24, 2025',
      reward: 2.00,
      difficulty: 'Easy',
      status: 'completed'
    },
    {
      id: 4,
      title: 'Take out trash',
      description: 'Make bed, organize toys, and put clothes away',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 2.00,
      difficulty: 'Easy',
      status: 'completed'
    }
  ]);

  const [choreForm, setChoreForm] = useState({
    title: '',
    description: '',
    assignTo: '',
    reward: '',
    dueDate: '',
    difficulty: 'Easy'
  });

  useEffect(() => {
    // Fetch user profile and children
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      
      // Fetch user profile
      const profileRes = await fetch('http://localhost:5500/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setUserProfile(profileData.user);
      }

      // Fetch children
      const childrenRes = await fetch('http://localhost:5500/api/users/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const childrenData = await childrenRes.json();
      if (childrenData.success) {
        setChildren(childrenData.children);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image smaller than 5MB');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToServer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch('http://localhost:5500/api/ai/speech-to-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.text);
      } else {
        console.error('Speech to text failed:', data.error);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;

    const userMessage = {
      role: 'user',
      content: message,
      image: selectedImage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('app_token');
      const requestBody = {
        message: message
      };

      if (selectedImage) {
        // Extract base64 data from data URL
        requestBody.image = selectedImage.split(',')[1];
      }

      const response = await fetch('http://localhost:5500/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        console.error('AI chat failed:', data.error);
        alert('Failed to get AI response. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const handleCreateChore = (e) => {
    e.preventDefault();
    // TODO: Create chore via API
    console.log('Creating chore:', choreForm);
    setShowCreateChore(false);
    setChoreForm({
      title: '',
      description: '',
      assignTo: '',
      reward: '',
      dueDate: '',
      difficulty: 'Easy'
    });
  };

  const getChoreStats = () => {
    const completed = chores.filter(c => c.status === 'completed').length;
    const pending = chores.filter(c => c.status === 'pending').length;
    const totalRewards = chores.reduce((sum, chore) => sum + chore.reward, 0);
    return { completed, pending, totalRewards };
  };

  const stats = getChoreStats();

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-purple-50 to-blue-50')}>
      {/* Header */}
      <header className={tw('bg-white shadow-sm')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <div className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
              <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
            </div>
            <div className={tw('flex items-center gap-4')}>
              <button className={tw('p-2 rounded-full hover:bg-gray-100 text-gray-600')}>
                <BellIcon size={24} />
              </button>
              <div className={tw('flex items-center gap-2')}>
                <div className={tw('w-10 h-10 rounded-full bg-accent-pink flex items-center justify-center')}>
                  <span className={tw('text-xl')}>{userProfile?.avatar || '👩‍💼'}</span>
                </div>
                <span className={tw('font-medium')}>{userProfile?.name || 'Parent'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8')}>
        <h1 className={tw('text-2xl font-bold text-gray-800 mb-6')}>Parent Dashboard</h1>

        <div className={tw('bg-white rounded-3xl shadow-xl p-8')}>
          {/* AI Avatar */}
          <div className={tw('flex justify-center mb-6')}>
            <AIAvatar size="medium" animated={true} />
          </div>

          {/* AI Chat Section */}
          <div className={tw('mb-8')}>
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className={tw('mb-4 max-h-96 overflow-y-auto space-y-4')}>
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={tw(`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`)}
                  >
                    <div
                      className={tw(`max-w-3xl p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`)}
                    >
                      {msg.image && (
                        <img src={msg.image} alt="User upload" className={tw('mb-2 rounded-lg max-h-40')} />
                      )}
                      <p className={tw('whitespace-pre-wrap')}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className={tw('flex justify-start')}>
                    <div className={tw('bg-gray-100 p-4 rounded-2xl')}>
                      <div className={tw('flex space-x-2')}>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce')}></div>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100')}></div>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200')}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Chat Input */}
            <div className={tw('relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200')}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Guide me AI DIY..."
                className={tw('w-full bg-transparent resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[60px]')}
                rows="2"
                disabled={isLoading}
              />
              
              {selectedImage && (
                <div className={tw('mt-2 relative inline-block')}>
                  <img src={selectedImage} alt="Upload" className={tw('h-20 rounded-lg')} />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className={tw('absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs')}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className={tw('flex items-center justify-between mt-2')}>
                <div className={tw('flex items-center gap-2')}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={tw('p-2 rounded-full hover:bg-gray-200 text-gray-600')}
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L10 10M10 10L10 18M10 10L18 10M10 10L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={tw('hidden')}
                  />
                  <button
                    onClick={handleVoiceRecord}
                    className={tw(`p-2 rounded-full hover:bg-gray-200 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600'}`)}
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="7" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 10C4 10 4 14 10 14C16 14 16 10 16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M10 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {isRecording && (
                    <span className={tw('text-sm text-red-500')}>Recording...</span>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!message.trim() && !selectedImage)}
                  className={tw(`px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${
                    (isLoading || (!message.trim() && !selectedImage)) ? 'opacity-50 cursor-not-allowed' : ''
                  }`)}
                >
                  {isLoading ? 'Sending...' : 'Guide me'}
                </button>
              </div>
            </div>
          </div>

          {/* Children Performance */}
          <div className={tw('mb-8')}>
            <h2 className={tw('text-xl font-bold text-gray-800 mb-4 flex items-center gap-2')}>
              <span>🏆</span> Children Performance
            </h2>
            
            <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-6')}>
              {children.map((child) => (
                <div key={child.id} className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                  <div className={tw('flex items-center gap-3 mb-2')}>
                    <div className={tw('w-12 h-12 rounded-full bg-accent-pink flex items-center justify-center')}>
                      <span className={tw('text-2xl')}>{child.avatar || '👧'}</span>
                    </div>
                    <div>
                      <h3 className={tw('font-semibold text-gray-800')}>
                        {child.nickName || child.firstName}
                      </h3>
                      <p className={tw('text-sm text-gray-600')}>
                        Chores Completed: {child.tasksCompleted || 0} chores
                      </p>
                      <p className={tw('text-sm text-gray-600')}>
                        Earned: ${child.moneyAccumulated || 0}.00
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className={tw('grid grid-cols-3 gap-4')}>
              <div className={tw('bg-blue-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Chores Completed</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>{stats.completed}</p>
              </div>
              <div className={tw('bg-green-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Chores Pending</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>{stats.pending}</p>
              </div>
              <div className={tw('bg-yellow-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Total Rewards</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>${stats.totalRewards.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Add Chore Button */}
          <div className={tw('flex justify-end mb-6')}>
            <button
              onClick={() => setShowCreateChore(true)}
              className={tw('flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
            >
              <span className={tw('text-xl')}>+</span> Add Chore
            </button>
          </div>

          {/* Assigned Chores */}
          <div>
            <h2 className={tw('text-xl font-bold text-gray-800 mb-4 flex items-center gap-2')}>
              <span>📋</span> Assigned Chores
            </h2>
            
            <div className={tw('space-y-4')}>
              {chores.map((chore) => (
                <div key={chore.id} className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                  <div className={tw('flex items-start justify-between')}>
                    <div className={tw('flex-1')}>
                      <div className={tw('flex items-center gap-3 mb-2')}>
                        <h3 className={tw('font-semibold text-gray-800')}>{chore.title}</h3>
                        <span className={tw(`text-xs px-2 py-1 rounded-full ${
                          chore.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          chore.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`)}>
                          ⭐ {chore.difficulty}
                        </span>
                        {chore.status === 'completed' && (
                          <span className={tw('text-xs px-2 py-1 rounded-full bg-green-100 text-green-700')}>
                            Completed
                          </span>
                        )}
                        {chore.status === 'pending' && (
                          <span className={tw('text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700')}>
                            Pending
                          </span>
                        )}
                      </div>
                      <p className={tw('text-sm text-gray-600 mb-2')}>{chore.description}</p>
                      <div className={tw('flex items-center gap-4 text-sm text-gray-500')}>
                        <span className={tw('flex items-center gap-1')}>
                          <span>👤</span> {chore.assignedTo}
                        </span>
                        <span className={tw('flex items-center gap-1')}>
                          <span>📅</span> Due: {chore.dueDate}
                        </span>
                        <span className={tw('flex items-center gap-1')}>
                          <span>💰</span> Reward: ${chore.reward.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className={tw('flex items-center gap-2')}>
                      {chore.status === 'pending' && (
                        <button className={tw('p-2 rounded-full bg-green-500 text-white hover:bg-green-600')}>
                          ✓ Complete
                        </button>
                      )}
                      <button className={tw('p-2 rounded-full hover:bg-gray-200 text-red-500')}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Chore Modal */}
      {showCreateChore && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <span>🎁</span> Create New Chore
                </h3>
                <button
                  onClick={() => setShowCreateChore(false)}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateChore} className={tw('p-6')}>
              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Chore Title
                </label>
                <input
                  type="text"
                  value={choreForm.title}
                  onChange={(e) => setChoreForm({ ...choreForm, title: e.target.value })}
                  placeholder="e.g., Clean your room"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  required
                />
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Description
                </label>
                <textarea
                  value={choreForm.description}
                  onChange={(e) => setChoreForm({ ...choreForm, description: e.target.value })}
                  placeholder="Describe what needs to be done..."
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  rows="3"
                  required
                />
              </div>

              <div className={tw('grid grid-cols-2 gap-4 mb-4')}>
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Assign to
                  </label>
                  <select
                    value={choreForm.assignTo}
                    onChange={(e) => setChoreForm({ ...choreForm, assignTo: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  >
                    <option value="">Child Profile</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.nickName || child.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Reward ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={choreForm.reward}
                    onChange={(e) => setChoreForm({ ...choreForm, reward: e.target.value })}
                    placeholder="0.00"
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>
              </div>

              <div className={tw('grid grid-cols-2 gap-4 mb-6')}>
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={choreForm.dueDate}
                    onChange={(e) => setChoreForm({ ...choreForm, dueDate: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Difficulty
                  </label>
                  <select
                    value={choreForm.difficulty}
                    onChange={(e) => setChoreForm({ ...choreForm, difficulty: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  >
                    <option value="Easy">⭐ Easy</option>
                    <option value="Medium">⭐⭐ Medium</option>
                    <option value="Hard">⭐⭐⭐ Hard</option>
                  </select>
                </div>
              </div>

              <div className={tw('flex gap-4')}>
                <button
                  type="button"
                  onClick={() => setShowCreateChore(false)}
                  className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Create Chore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;