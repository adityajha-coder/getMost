import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AnalysisResult, AnalyzeRequest } from "@/lib/types"

export type View = "input" | "result"

interface AnalysisState {
  status: "idle" | "loading" | "succeeded" | "failed"
  view: View
  result: AnalysisResult | null
  error: string | null
  lastRequest: AnalyzeRequest | null
}

const initialState: AnalysisState = {
  status: "idle",
  view: "input",
  result: null,
  error: null,
  lastRequest: null,
}

export const runAnalysis = createAsyncThunk<AnalysisResult, AnalyzeRequest, { rejectValue: string }>(
  "analysis/run",
  async (payload, { rejectWithValue }) => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      return rejectWithValue(data?.error ?? "Analysis failed.")
    }
    return data as AnalysisResult
  },
)

const analysisSlice = createSlice({
  name: "analysis",
  initialState,
  reducers: {
    resetAnalysis(state) {
      state.status = "idle"
      state.view = "input"
      state.result = null
      state.error = null
    },
    setView(state, action: PayloadAction<View>) {
      state.view = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAnalysis.pending, (state, action) => {
        state.status = "loading"
        state.error = null
        state.lastRequest = action.meta.arg
      })
      .addCase(runAnalysis.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.result = action.payload
        state.view = "result"
      })
      .addCase(runAnalysis.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? action.error.message ?? "Analysis failed."
      })
  },
})

export const { resetAnalysis, setView } = analysisSlice.actions
export default analysisSlice.reducer
