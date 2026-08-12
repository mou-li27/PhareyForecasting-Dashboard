import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchGFSForecast, GFSForecastData } from '@/services/gfsService';

export interface GFSState {
  data: GFSForecastData | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: GFSState = {
  data: null,
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchGFSDataAsync = createAsyncThunk(
  'gfs/fetchGFSData',
  async () => {
    const data = await fetchGFSForecast();
    return data;
  }
);

const gfsForecastSlice = createSlice({
  name: 'gfsForecast',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGFSDataAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGFSDataAsync.fulfilled, (state, action: PayloadAction<GFSForecastData>) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchGFSDataAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch GFS data';
      });
  },
});

export default gfsForecastSlice.reducer;
