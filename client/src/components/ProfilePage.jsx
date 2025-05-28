import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { tw } from '@twind/core';

const ProfilePage = () => {
  const [isManageMode, setIsManageMode] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childData, setChildData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    birthDate: '',
    loginCode: ['', '', '', '']
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call backend logout API
      await fetch("http://localhost:5500/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("app_token")}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear local storage regardless of API response
      sessionStorage.removeItem('google_id_token');
      sessionStorage.removeItem('app_token');
      
      // Dispatch logout action
      dispatch(logout());
      
      // Navigate to home page
      navigate('/');
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...childData.loginCode];
      newCode[index] = value;
      setChildData({...childData, loginCode: newCode});
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`child-code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleSaveChild = (e) => {
    e.preventDefault();
    console.log('Saving child data:', childData);
    setShowChildForm(false);
  };

  // Mock data
  const parents = [
    { id: 1, name: 'Father', avatar: '👨‍💼', isEditable: true },
    { id: 2, name: 'Mother', avatar: '👩‍💼', isEditable: true }
  ];

  const kids = [
    { id: 1, name: 'Sweety', avatar: '👧', isEditable: true },
    { id: 2, name: 'Child 2', avatar: '👦', isEditable: true }
  ];

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark')}>
      {/* Header */}
      <header className={tw('bg-white shadow-sm')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <Link to="/" className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
              <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className={tw('px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8')}>
        <div className={tw('max-w-4xl w-full')}>
          <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
            {/* Header with Manage Button */}
            <div className={tw('flex items-center justify-between mb-8')}>
              <h2 className={tw('text-2xl font-bold text-gray-800')}>Parents</h2>
              {!isManageMode ? (
                <button 
                  className={tw('flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                  onClick={() => setIsManageMode(true)}
                >
                  ⚙️ Manage profiles
                </button>
              ) : (
                <button 
                  className={tw('px-4 py-2 bg-white border-2 border-primary-turquoise text-primary-turquoise rounded-lg hover:bg-primary-turquoise hover:text-white transition-colors')}
                  onClick={() => setIsManageMode(false)}
                >
                  Save
                </button>
              )}
            </div>

            {/* Parents Section */}
            <div className={tw('mb-12')}>
              <div className={tw('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6')}>
                {parents.map(parent => (
                  <div key={parent.id} className={tw('text-center cursor-pointer group')}>
                    <div className={tw('relative w-20 h-20 mx-auto mb-3 bg-accent-pink rounded-full flex items-center justify-center border-3 border-transparent group-hover:border-primary-turquoise transition-all duration-300')}>
                      <span className={tw('text-3xl')}>{parent.avatar}</span>
                      {isManageMode && (
                        <button className={tw('absolute -top-1 -right-1 w-6 h-6 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-xs')}>
                          ✏️
                        </button>
                      )}
                    </div>
                    <p className={tw('text-sm font-medium text-gray-700')}>{parent.name}</p>
                  </div>
                ))}
                {isManageMode && (
                  <div className={tw('text-center cursor-pointer group')}>
                    <div className={tw('w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 group-hover:border-primary-turquoise transition-colors')}>
                      <span className={tw('text-2xl text-gray-400')}>+</span>
                    </div>
                    <p className={tw('text-sm text-gray-500')}>Add parent profile</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kids Section */}
            <div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-6')}>Kids</h3>
              <div className={tw('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6')}>
                {kids.map(kid => (
                  <div key={kid.id} className={tw('text-center cursor-pointer group')}>
                    <div className={tw('relative w-20 h-20 mx-auto mb-3 bg-accent-pink rounded-full flex items-center justify-center border-3 border-transparent group-hover:border-primary-turquoise transition-all duration-300')}>
                      <span className={tw('text-3xl')}>{kid.avatar}</span>
                      {isManageMode && (
                        <button className={tw('absolute -top-1 -right-1 w-6 h-6 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-xs')}>
                          ✏️
                        </button>
                      )}
                    </div>
                    <p className={tw('text-sm font-medium text-gray-700')}>{kid.name}</p>
                  </div>
                ))}
                {isManageMode && (
                  <div 
                    className={tw('text-center cursor-pointer group')}
                    onClick={() => setShowChildForm(true)}
                  >
                    <div className={tw('w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 group-hover:border-primary-turquoise transition-colors')}>
                      <span className={tw('text-2xl text-gray-400')}>+</span>
                    </div>
                    <p className={tw('text-sm text-gray-500')}>Add kid profile</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Child Profile Creation Modal */}
      {showChildForm && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto')}>
            <div className={tw('flex items-center justify-between p-6 border-b border-gray-200')}>
              <h3 className={tw('text-xl font-bold text-gray-800')}>Account Settings</h3>
              <button 
                className={tw('w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-2xl text-gray-500')}
                onClick={() => setShowChildForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className={tw('p-6')}>
              <div className={tw('grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 mb-8 p-6 bg-accent-pink rounded-xl')}>
                <div className={tw('relative')}>
                  <div className={tw('w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg')}>
                    <span className={tw('text-4xl')}>👧</span>
                  </div>
                  <button className={tw('absolute bottom-0 right-0 w-8 h-8 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-sm')}>
                    ✏️
                  </button>
                </div>
                <div className={tw('space-y-3')}>
                  <div className={tw('flex justify-between items-center')}>
                    <span className={tw('text-sm text-gray-600')}>Money Accumulated</span>
                    <span className={tw('text-sm font-semibold text-gray-800')}>$ 5000</span>
                  </div>
                  <div className={tw('flex justify-between items-center')}>
                    <span className={tw('text-sm text-gray-600')}>Tasks Assigned</span>
                    <span className={tw('text-sm font-semibold text-gray-800')}>10 tasks</span>
                  </div>
                  <div className={tw('flex justify-between items-center')}>
                    <span className={tw('text-sm text-gray-600')}>Tasks Completed</span>
                    <span className={tw('text-sm font-semibold text-gray-800')}>8 tasks</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveChild}>
                <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-4')}>
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>First Name</label>
                    <input
                      type="text"
                      className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      placeholder="Tanya"
                      value={childData.firstName}
                      onChange={(e) => setChildData({...childData, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Last Name</label>
                    <input
                      type="text"
                      className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      placeholder="Makan"
                      value={childData.lastName}
                      onChange={(e) => setChildData({...childData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className={tw('mb-4')}>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Nick name</label>
                  <input
                    type="text"
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                    placeholder="Sweety"
                    value={childData.nickName}
                    onChange={(e) => setChildData({...childData, nickName: e.target.value})}
                  />
                </div>

                <div className={tw('mb-4')}>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Date of Birth</label>
                  <div className={tw('flex gap-2')}>
                    <select className={tw('flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}>
                      <option>16</option>
                    </select>
                    <select className={tw('flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}>
                      <option>3</option>
                    </select>
                    <select className={tw('flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}>
                      <option>2012</option>
                    </select>
                  </div>
                </div>

                <div className={tw('mb-4')}>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Kid login code</label>
                  <div className={tw('flex gap-2')}>
                    {childData.loginCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`child-code-${index}`}
                        type="text"
                        className={tw('w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        maxLength="1"
                      />
                    ))}
                  </div>
                </div>

                <div className={tw('mb-8')}>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Confirm login code</label>
                  <div className={tw('flex gap-2')}>
                    {childData.loginCode.map((digit, index) => (
                      <input
                        key={`confirm-${index}`}
                        type="text"
                        className={tw('w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500')}
                        value={digit}
                        readOnly
                      />
                    ))}
                  </div>
                </div>

                <div className={tw('text-center')}>
                  <button 
                    type="submit" 
                    className={tw('px-8 py-3 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 