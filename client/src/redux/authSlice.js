import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  currentUser: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
    },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.currentUser = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.loading = false;
      sessionStorage.removeItem('app_token');
      sessionStorage.removeItem('google_id_token');
    },
  },
});

export const { loginStart, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
