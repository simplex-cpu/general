import { createContext, useContext } from "react";

export const TranscriptReadOnly = createContext(false);
export const useTranscriptReadOnly = () => useContext(TranscriptReadOnly);