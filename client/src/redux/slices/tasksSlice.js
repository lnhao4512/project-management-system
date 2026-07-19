import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../../api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.getAll(params);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const fetchMyTasks = createAsyncThunk('tasks/fetchMine', async (params, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.getMyTasks(params);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.create(taskData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data: taskData }, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.update(id, taskData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await tasksAPI.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const changeTaskStatus = createAsyncThunk('tasks/changeStatus', async ({ id, status, progress }, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.changeStatus(id, { status, progress });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to change status');
  }
});

export const updateTaskProgress = createAsyncThunk('tasks/updateProgress', async ({ id, progress }, { rejectWithValue }) => {
  try {
    const { data } = await tasksAPI.updateProgress(id, { progress });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    myTasks: [],
    selectedTask: null,
    pagination: null,
    loading: false,
    error: null,
    filters: {
      status: '',
      priority: '',
      project: '',
      search: '',
    },
  },
  reducers: {
    setSelectedTask(state, action) {
      state.selectedTask = action.payload;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { status: '', priority: '', project: '', search: '' };
    },
    updateTaskInList(state, action) {
      const idx = state.items.findIndex(t => t._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    addTaskToList(state, action) {
      state.items.unshift(action.payload);
    },
    removeTaskFromList(state, action) {
      state.items = state.items.filter(t => t._id !== action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMyTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.myTasks = action.payload.data;
      })
      .addCase(fetchMyTasks.rejected, (state) => { state.loading = false; })

      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
      })
      .addCase(changeTaskStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        const myIdx = state.myTasks.findIndex(t => t._id === action.payload._id);
        if (myIdx !== -1) state.myTasks[myIdx] = action.payload;
      })
      .addCase(updateTaskProgress.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        const myIdx = state.myTasks.findIndex(t => t._id === action.payload._id);
        if (myIdx !== -1) state.myTasks[myIdx] = action.payload;
      });
  },
});

export const { setSelectedTask, setFilters, clearFilters, updateTaskInList, addTaskToList, removeTaskFromList, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
