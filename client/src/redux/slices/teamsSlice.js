import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { teamsAPI } from '../../api';

export const fetchTeams = createAsyncThunk('teams/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await teamsAPI.getAll();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi tải danh sách nhóm');
  }
});

export const createTeam = createAsyncThunk('teams/create', async (data, { rejectWithValue }) => {
  try {
    const res = await teamsAPI.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi tạo nhóm');
  }
});

export const updateTeam = createAsyncThunk('teams/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await teamsAPI.update(id, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi cập nhật nhóm');
  }
});

export const deleteTeam = createAsyncThunk('teams/delete', async (id, { rejectWithValue }) => {
  try {
    await teamsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi xóa nhóm');
  }
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => { state.loading = true; })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
      });
  },
});

export default teamsSlice.reducer;
