"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_INTERACTION_TYPES,
  type LeadInteractionType,
} from "@/lib/leads/interaction-types";

const InteractionTypesContext = createContext<LeadInteractionType[]>(DEFAULT_INTERACTION_TYPES);

export function InteractionTypesProvider({
  types,
  children,
}: {
  types: LeadInteractionType[];
  children: ReactNode;
}) {
  return (
    <InteractionTypesContext.Provider value={types.length ? types : DEFAULT_INTERACTION_TYPES}>
      {children}
    </InteractionTypesContext.Provider>
  );
}

export function useInteractionTypes() {
  return useContext(InteractionTypesContext);
}
