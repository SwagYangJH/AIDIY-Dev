// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { tw } from '@twind/core';

/* ───────────────────────── small fetch helper ───────────────────────── */
const api = (path, opts = {}) =>
  fetch(`http://localhost:5500${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('app_token')}`,
      ...opts.headers,
    },
    ...opts,
  }).then((r) => r.json());

/* ───────────────────────── main component ───────────────────────────── */
const ProfilePage = () => {
  /* UI state */
  const [isManageMode, setIsManageMode] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showParentEditForm, setShowParentEditForm] = useState(false);
  const [editingParentRole, setEditingParentRole] = useState(null); // 'dad' or 'mom'
  const [formError, setFormError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  /* parents data - will be populated based on user profile */
  const [parents, setParents] = useState([]);

  /* kids pulled from API + live-added */
  const [kids, setKids] = useState([]);

  /* form data for new kid */
  const [childData, setChildData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    username: '',
    avatar: '👧', // default girl
    birthDate: { day: '1', month: '1', year: '2015' },
    loginCode: ['', '', '', ''],
    confirmLoginCode: ['', '', '', ''],
  });

  /* form data for editing parent */
  const [parentEditData, setParentEditData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    parentRole: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ───────── fetch user profile and existing kids on mount ───────── */
  useEffect(() => {
    (async () => {
      try {
        // Fetch user profile
        const profileRes = await api('/api/users/profile');
        if (profileRes.success) {
          setUserProfile(profileRes.user);
          
          // Only show the current user's parent info, don't pre-fill empty slots
          const parentsList = [];
          
          if (profileRes.user.parentRole && profileRes.user.name) {
            if (profileRes.user.parentRole === 'dad') {
              parentsList.push({
                id: 1,
                name: profileRes.user.name,
                avatar: '👨‍💼',
                role: 'dad'
              });
            } else if (profileRes.user.parentRole === 'mom') {
              parentsList.push({
                id: 2,
                name: profileRes.user.name,
                avatar: '👩‍💼',
                role: 'mom'
              });
            }
          }
          
          setParents(parentsList);
          
          // Set edit form data
          setParentEditData({
            firstName: profileRes.user.firstName || '',
            lastName: profileRes.user.lastName || '',
            phoneNumber: profileRes.user.phoneNumber || '',
            birthDate: profileRes.user.birthDate || '',
            parentRole: profileRes.user.parentRole || ''
          });
        }
        
        // Fetch kids
        const res = await api('/api/users/children');
        if (res.success) setKids(res.children.map((c) => ({ ...c, avatar: c.avatar || '👧' })));
      } catch (e) {
        console.error('Could not load data', e);
      }
    })();
  }, []);

  /* ───────── focus-jump handlers for 4-digit code ───────── */
  const handleCodeChange = (idx, val) => {
    if (val.length <= 1 && /^[0-9]*$/.test(val)) {
      const copy = [...childData.loginCode];
      copy[idx] = val;
      setChildData({ ...childData, loginCode: copy });
      if (val && idx < 3) document.getElementById(`child-code-${idx + 1}`)?.focus();
    }
  };
  const handleConfirmCodeChange = (idx, val) => {
    if (val.length <= 1 && /^[0-9]*$/.test(val)) {
      const copy = [...childData.confirmLoginCode];
      copy[idx] = val;
      setChildData({ ...childData, confirmLoginCode: copy });
      if (val && idx < 3) document.getElementById(`confirm-code-${idx + 1}`)?.focus();
    }
  };

  /* ───────── save new kid ───────── */
  const handleSaveChild = async (e) => {
    e.preventDefault();

    if (childData.loginCode.join('') !== childData.confirmLoginCode.join('')) {
      setFormError('Login code and Confirm code do not match!');
      return;
    }
    setFormError('');

    const { day, month, year } = childData.birthDate;
    try {
      const res = await api('/api/users/children', {
        method: 'POST',
        body: JSON.stringify({
          firstName: childData.firstName.trim(),
          lastName: childData.lastName.trim(),
          nickName: childData.nickName.trim(),
          username: childData.username.trim(),
          avatar: childData.avatar,
          birthDate: `${year}-${month}-${day}`,
          loginCode: childData.loginCode.join(''),
        }),
      });
      if (!res.success) throw new Error(res.error || 'Unknown error');

      /* push into UI list */
      setKids((prev) => [...prev, { ...res.child, avatar: childData.avatar }]);

      /* reset + close */
      setChildData({
        firstName: '',
        lastName: '',
        nickName: '',
        username: '',
        avatar: '👧',
        birthDate: { day: '1', month: '1', year: '2015' },
        loginCode: ['', '', '', ''],
        confirmLoginCode: ['', '', '', ''],
      });
      setShowChildForm(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  /* ───────── logout ───────── */
  const handleLogout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    sessionStorage.clear();
    dispatch(logout());
    navigate('/');
  };

  /* ───────── save parent edit ───────── */
  const handleSaveParentEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      // If editing current user's profile
      if (editingParentRole === userProfile?.parentRole) {
        const res = await api('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify(parentEditData),
        });
        
        if (!res.success) throw new Error(res.error || 'Update failed');

        // Update local state
        setUserProfile({ ...userProfile, ...parentEditData });
        
        // Update parent display
        const updatedName = `${parentEditData.firstName} ${parentEditData.lastName}`;
        setParents(parents.map(p => {
          if (p.role === userProfile.parentRole) {
            return { ...p, name: updatedName };
          }
          return p;
        }));
      } else {
        // Adding new parent (spouse/partner) - just update display locally
        const updatedName = `${parentEditData.firstName} ${parentEditData.lastName}`;
        const newParent = {
          id: editingParentRole === 'dad' ? 1 : 2,
          name: updatedName,
          avatar: editingParentRole === 'dad' ? '👨‍💼' : '👩‍💼',
          role: editingParentRole
        };
        
        // Add to parents list
        setParents([...parents, newParent].sort((a, b) => a.id - b.id));
      }

      setShowParentEditForm(false);
      setEditingParentRole(null);
    } catch (err) {
      setFormError(err.message);
    }
  };

  /* ───────── handle parent edit/add ───────── */
  const handleParentAction = (parent) => {
    if (parent) {
      // Editing existing parent
      setEditingParentRole(parent.role);
      
      if (parent.role === userProfile?.parentRole) {
        // Editing current user
        setParentEditData({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          phoneNumber: userProfile.phoneNumber || '',
          birthDate: userProfile.birthDate || '',
          parentRole: parent.role
        });
      }
    } else {
      // Adding new parent - determine which role is available
      const hasDad = parents.some(p => p.role === 'dad');
      const hasMom = parents.some(p => p.role === 'mom');
      
      let newRole;
      if (!hasDad && !hasMom) {
        // No parents yet, use user's role or default to dad
        newRole = userProfile?.parentRole || 'dad';
      } else if (!hasDad) {
        newRole = 'dad';
      } else if (!hasMom) {
        newRole = 'mom';
      } else {
        // Both slots filled
        return;
      }
      
      setEditingParentRole(newRole);
      setParentEditData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        birthDate: '',
        parentRole: newRole
      });
    }
    
    setShowParentEditForm(true);
  };

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark')}>
      {/* Header */}
      <Header onLogout={handleLogout} />

      {/* Main card */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12')}>
        <div className={tw('max-w-4xl w-full')}>
          <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
            {/* Parents header */}
            <div className={tw('flex items-center justify-between mb-8')}>
              <h2 className={tw('text-2xl font-bold text-gray-800')}>Parents</h2>
              {!isManageMode ? (
                <button
                  onClick={() => setIsManageMode(true)}
                  className={tw(
                    'flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300',
                  )}
                >
                  ⚙️ Manage profiles
                </button>
              ) : (
                <button
                  onClick={() => setIsManageMode(false)}
                  className={tw(
                    'px-4 py-2 bg-white border-2 border-primary-turquoise text-primary-turquoise rounded-lg hover:bg-primary-turquoise hover:text-white transition-colors',
                  )}
                >
                  Save
                </button>
              )}
            </div>

            {/* Parents grid (dynamic based on user) */}
            <AvatarGrid 
              items={parents} 
              isManage={isManageMode} 
              addLabel="Add parent"
              onEdit={handleParentAction}
              onAdd={() => {
                // Check if we can add more parents (max 2)
                if (parents.length < 2) {
                  handleParentAction(null);
                }
              }}
              showAddButton={true} // Show add button for parents too
              maxItems={2} // Maximum 2 parents
            />

            {/* Kids */}
            <h3 className={tw('text-xl font-bold text-gray-800 mb-6')}>Kids</h3>
            <AvatarGrid
              items={kids.map((k) => ({
                id: k.id,
                name: k.nickName || k.firstName,
                avatar: k.avatar || '👧',
              }))}
              isManage={isManageMode}
              addLabel="Add kid profile"
              onAdd={() => setShowChildForm(true)}
              showAddButton={true}
            />
          </div>
        </div>
      </div>

      {/* Add-Kid Modal */}
      {showChildForm && (
        <Modal onClose={() => setShowChildForm(false)}>
          {/* pink stats card */}
          <PinkStatsCard avatar={childData.avatar} />

          {/* form */}
          <form onSubmit={handleSaveChild}>
            <NameInputs childData={childData} setChildData={setChildData} />
            <NicknameInput childData={childData} setChildData={setChildData} />
            <UsernameInput childData={childData} setChildData={setChildData} />

            {/* avatar selector */}
            <div className={tw('mb-4')}>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Avatar (boy / girl)</label>
              <select
                value={childData.avatar}
                onChange={(e) => setChildData({ ...childData, avatar: e.target.value })}
                className={tw(
                  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                )}
              >
                <option value="👧">Girl (👧)</option>
                <option value="👦">Boy (👦)</option>
              </select>
            </div>

            <DOBInputs childData={childData} setChildData={setChildData} />
            <CodeInputRow
              label="Kid login code"
              idBase="child-code"
              codeArray={childData.loginCode}
              handleChange={handleCodeChange}
            />
            <CodeInputRow
              label="Confirm login code"
              idBase="confirm-code"
              codeArray={childData.confirmLoginCode}
              handleChange={handleConfirmCodeChange}
            />
            {formError && <p className={tw('text-sm text-red-600 text-center mb-4')}>{formError}</p>}
            <SubmitButton />
          </form>
        </Modal>
      )}

      {/* Edit Parent Modal */}
      {showParentEditForm && (
        <Modal onClose={() => {
          setShowParentEditForm(false);
          setEditingParentRole(null);
        }}>
          <h3 className={tw('text-xl font-bold text-gray-800 mb-6')}>
            {editingParentRole === userProfile?.parentRole ? 'Edit' : 'Add'} Parent Profile
          </h3>
          
          <form onSubmit={handleSaveParentEdit}>
            <div className={tw('mb-4 text-center')}>
              <span className={tw('text-4xl')}>
                {editingParentRole === 'dad' ? '👨‍💼' : '👩‍💼'}
              </span>
              <p className={tw('text-sm text-gray-600 mt-2')}>
                {editingParentRole === 'dad' ? 'Father' : 'Mother'}
              </p>
            </div>

            <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-4')}>
              <div>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  First Name
                </label>
                <input
                  type="text"
                  value={parentEditData.firstName}
                  onChange={(e) => setParentEditData({ ...parentEditData, firstName: e.target.value })}
                  className={tw(
                    'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                  )}
                  required
                />
              </div>
              
              <div>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={parentEditData.lastName}
                  onChange={(e) => setParentEditData({ ...parentEditData, lastName: e.target.value })}
                  className={tw(
                    'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                  )}
                  required
                />
              </div>
            </div>

            <div className={tw('mb-4')}>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                Phone Number
              </label>
              <input
                type="tel"
                value={parentEditData.phoneNumber}
                onChange={(e) => setParentEditData({ ...parentEditData, phoneNumber: e.target.value })}
                className={tw(
                  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                )}
              />
            </div>

            <div className={tw('mb-4')}>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                Date of Birth
              </label>
              <input
                type="date"
                value={parentEditData.birthDate}
                onChange={(e) => setParentEditData({ ...parentEditData, birthDate: e.target.value })}
                className={tw(
                  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                )}
              />
            </div>

            {formError && <p className={tw('text-sm text-red-600 text-center mb-4')}>{formError}</p>}
            
            <div className={tw('text-center')}>
              <button
                type="submit"
                className={tw(
                  'px-8 py-3 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300',
                )}
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ────────── reusable UI pieces ────────── */

const Header = ({ onLogout }) => (
  <header className={tw('bg-white shadow-sm')}>
    <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
      <div className={tw('flex items-center justify-between h-20')}>
        <Link to="/" className={tw('flex items-center space-x-2')}>
          <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
          <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
        </Link>
        <button
          onClick={onLogout}
          className={tw(
            'px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors',
          )}
        >
          Logout
        </button>
      </div>
    </div>
  </header>
);

const AvatarGrid = ({ items, isManage, addLabel, onAdd, onEdit, showAddButton = true, maxItems = null }) => (
  <div className={tw('mb-12')}>
    <div className={tw('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6')}>
      {items.map((p) => (
        <div key={p.id} className={tw('text-center')}>
          <div
            onClick={() => isManage && onEdit && onEdit(p)}
            className={tw(
              `relative w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center border-3 transition-all duration-300 bg-accent-pink border-transparent ${
                isManage ? 'hover:border-primary-turquoise cursor-pointer' : ''
              }`,
            )}
          >
            <span className={tw('text-3xl')}>{p.avatar}</span>
            {isManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(p);
                }}
                className={tw(
                  'absolute -top-1 -right-1 w-6 h-6 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-xs',
                )}
              >
                ✏️
              </button>
            )}
          </div>
          <p className={tw('text-sm font-medium text-gray-700')}>{p.name}</p>
        </div>
      ))}
      {/* Show add button if in manage mode and haven't reached max items */}
      {isManage && onAdd && showAddButton && (!maxItems || items.length < maxItems) && (
        <div onClick={onAdd} className={tw('text-center cursor-pointer group')}>
          <div
            className={tw(
              'w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 group-hover:border-primary-turquoise transition-colors',
            )}
          >
            <span className={tw('text-2xl text-gray-400')}>+</span>
          </div>
          <p className={tw('text-sm text-gray-500')}>{addLabel}</p>
        </div>
      )}
    </div>
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
    <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto')}>
      <div className={tw('flex items-center justify-between p-6 border-b border-gray-200')}>
        <h3 className={tw('text-xl font-bold text-gray-800')}>Account Settings</h3>
        <button
          onClick={onClose}
          className={tw('w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-2xl text-gray-500')}
        >
          ×
        </button>
      </div>
      <div className={tw('p-6')}>{children}</div>
    </div>
  </div>
);

/* pink card with dummy stats */
const PinkStatsCard = ({ avatar }) => (
  <div className={tw('grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 mb-8 p-6 bg-accent-pink rounded-xl')}>
    <div className={tw('relative')}>
      <div className={tw('w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg')}>
        <span className={tw('text-4xl')}>{avatar}</span>
      </div>
      {/* optional edit icon */}
      <button
        className={tw(
          'absolute bottom-0 right-0 w-8 h-8 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-sm',
        )}
      >
        ✏️
      </button>
    </div>
    <div className={tw('space-y-3')}>
      <Stat label="Money Accumulated" value="$ 0" />
      <Stat label="Tasks Assigned" value="0" />
      <Stat label="Tasks Completed" value="0" />
    </div>
  </div>
);

/* plain stat row */
const Stat = ({ label, value }) => (
  <div className={tw('flex justify-between items-center')}>
    <span className={tw('text-sm text-gray-600')}>{label}</span>
    <span className={tw('text-sm font-semibold text-gray-800')}>{value}</span>
  </div>
);

/* form chunks */
const NameInputs = ({ childData, setChildData }) => (
  <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-4')}>
    {['firstName', 'lastName'].map((field) => (
      <div key={field}>
        <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
          {field === 'firstName' ? 'First Name' : 'Last Name'}
        </label>
        <input
          type="text"
          placeholder={field === 'firstName' ? 'Tanya' : 'Makan'}
          value={childData[field]}
          onChange={(e) => setChildData({ ...childData, [field]: e.target.value })}
          className={tw(
            'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
          required
        />
      </div>
    ))}
  </div>
);

const NicknameInput = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Nick name</label>
    <input
      type="text"
      placeholder="Sweety"
      value={childData.nickName}
      onChange={(e) => setChildData({ ...childData, nickName: e.target.value })}
      className={tw(
        'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
      )}
    />
  </div>
);

const UsernameInput = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>User name </label>
    <input
      type="text"
      placeholder="sweety123"
      value={childData.username}
      onChange={(e) => setChildData({ ...childData, username: e.target.value })}
      className={tw(
        'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
      )}
      required
    />
  </div>
);

const DOBInputs = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Date of Birth</label>
    <div className={tw('flex gap-2')}>
      {['day', 'month', 'year'].map((unit) => (
        <select
          key={unit}
          value={childData.birthDate[unit]}
          onChange={(e) =>
            setChildData({
              ...childData,
              birthDate: { ...childData.birthDate, [unit]: e.target.value },
            })
          }
          className={tw(
            'flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
        >
          {unit === 'year'
            ? [...Array(20)].map((_, i) => {
                const y = 2025 - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })
            : [...Array(unit === 'month' ? 12 : 31)].map((_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ))}
        </select>
      ))}
    </div>
  </div>
);

const CodeInputRow = ({ label, idBase, codeArray, handleChange }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>{label}</label>
    <div className={tw('flex gap-2')}>
      {codeArray.map((d, idx) => (
        <input
          key={idx}
          id={`${idBase}-${idx}`}
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(idx, e.target.value)}
          className={tw(
            'w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
          type="text"
          required
        />
      ))}
    </div>
  </div>
);

const SubmitButton = () => (
  <div className={tw('text-center')}>
    <button
      type="submit"
      className={tw(
        'px-8 py-3 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300',
      )}
    >
      Save changes
    </button>
  </div>
);

export default ProfilePage;
