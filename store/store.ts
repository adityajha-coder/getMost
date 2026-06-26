import { configureStore } from "@reduxjs/toolkit"
import analysisReducer from "./analysisSlice"

export const makeStore = () =>
  configureStore({
    reducer: {
      analysis: analysisReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
