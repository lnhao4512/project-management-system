import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsAPI } from '../../api';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await projectsAPI.getAll(params);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await projectsAPI.getById(id);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await projectsAPI.create(projectData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data: projectData }, { rejectWithValue }) => {
  try {
    const { data } = await projectsAPI.update(id, projectData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await projectsAPI.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    selectedProject: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedProject(state, action) {
      state.selectedProject = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
      })

      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.items.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selectedProject?._id === action.payload._id) {
          state.selectedProject = action.payload;
        }
      })

      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p._id !== action.payload);
      });
  },
});

export const { setSelectedProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
