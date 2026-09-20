"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  WizardState,
  MatchInfoForm,
  StandingForm,
  RecentMatchForm,
  Venue,
} from "./types";

const defaultMatchForm: MatchInfoForm = {
  competition: "",
  homeTeam: "",
  awayTeam: "",
};

const defaultStandingForm: StandingForm = {
  position: "",
  goalDifference: "",
  wins: "",
  draws: "",
  losses: "",
  goalsFor: "",
  goalsAgainst: "",
};

const defaultRecentMatch = (venue: Venue): RecentMatchForm => ({
  venue,
  goalsFor: "",
  goalsAgainst: "",
});

const defaultState: WizardState = {
  step: 1,
  matchInfo: defaultMatchForm,
  homeStanding: defaultStandingForm,
  awayStanding: defaultStandingForm,
  homeLast3: [
    defaultRecentMatch("HOME"),
    defaultRecentMatch("AWAY"),
    defaultRecentMatch("HOME"),
  ],
  awayLast3: [
    defaultRecentMatch("AWAY"),
    defaultRecentMatch("HOME"),
    defaultRecentMatch("AWAY"),
  ],
};

interface WizardContextType {
  state: WizardState;
  setMatchInfo: (data: MatchInfoForm) => void;
  setHomeStanding: (data: StandingForm) => void;
  setAwayStanding: (data: StandingForm) => void;
  setHomeLast3: (data: [RecentMatchForm, RecentMatchForm, RecentMatchForm]) => void;
  setAwayLast3: (data: [RecentMatchForm, RecentMatchForm, RecentMatchForm]) => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);

  const setMatchInfo = (data: MatchInfoForm) =>
    setState((s) => ({ ...s, matchInfo: data }));

  const setHomeStanding = (data: StandingForm) =>
    setState((s) => ({ ...s, homeStanding: data }));

  const setAwayStanding = (data: StandingForm) =>
    setState((s) => ({ ...s, awayStanding: data }));

  const setHomeLast3 = (
    data: [RecentMatchForm, RecentMatchForm, RecentMatchForm]
  ) => setState((s) => ({ ...s, homeLast3: data }));

  const setAwayLast3 = (
    data: [RecentMatchForm, RecentMatchForm, RecentMatchForm]
  ) => setState((s) => ({ ...s, awayLast3: data }));

  const goToStep = (step: number) => setState((s) => ({ ...s, step }));

  const reset = () => setState(defaultState);

  return (
    <WizardContext.Provider
      value={{
        state,
        setMatchInfo,
        setHomeStanding,
        setAwayStanding,
        setHomeLast3,
        setAwayLast3,
        goToStep,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextType {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
