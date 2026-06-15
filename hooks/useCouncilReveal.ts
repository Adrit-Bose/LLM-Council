"use client";

import { COUNCIL_MEMBERS } from "@/lib/council-members";
import {
  CARD_CONTENT_DELAY_MS,
  CARD_STAGGER_MS,
  CHAIRMAN_SECTION_COUNT,
  CHAIRMAN_SECTION_STAGGER_MS,
  DEBATE_TRANSITION_MS,
} from "@/lib/animation/constants";
import type { CouncilRevealPhase, MemberDisplayState } from "@/lib/animation/types";
import type { ChairmanReport, MemberState } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

function addToSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  next.add(id);
  return next;
}

const MEMBER_ORDER = COUNCIL_MEMBERS.map((m) => m.id);

interface UseCouncilRevealOptions {
  members: MemberState[];
  enableDebate: boolean;
  isRunning: boolean;
  isComplete: boolean;
  chairmanStatus: MemberState["status"];
  report: ChairmanReport | null;
  chairmanError: string | null;
  sessionActive: boolean;
}

export interface CouncilRevealResult {
  phase: CouncilRevealPhase;
  memberDisplay: MemberDisplayState[];
  revealedCount: number;
  showChairmanSection: boolean;
  showChairmanLoading: boolean;
  chairmanVisibleSections: number;
  animateChairmanScores: boolean;
  showDebateBanner: boolean;
  counterPulse: boolean;
}

function memberReady(m: MemberState | undefined): boolean {
  return m?.status === "complete" || m?.status === "error";
}

function allMembersReady(members: MemberState[]): boolean {
  return MEMBER_ORDER.every((id) => memberReady(members.find((m) => m.id === id)));
}

function allDebatesReady(members: MemberState[]): boolean {
  return MEMBER_ORDER.every((id) => {
    const m = members.find((x) => x.id === id);
    return m?.status === "error" || m?.debate != null;
  });
}

export function useCouncilReveal({
  members,
  enableDebate,
  isRunning,
  isComplete,
  chairmanStatus,
  report,
  chairmanError,
  sessionActive,
}: UseCouncilRevealOptions): CouncilRevealResult {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<CouncilRevealPhase>("idle");
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [contentVisibleIds, setContentVisibleIds] = useState<Set<string>>(new Set());
  const [showDebateBanner, setShowDebateBanner] = useState(false);
  const [debateHighlight, setDebateHighlight] = useState(false);
  const [debateShownIds, setDebateShownIds] = useState<Set<string>>(new Set());
  const [chairmanVisibleSections, setChairmanVisibleSections] = useState(0);
  const [animateChairmanScores, setAnimateChairmanScores] = useState(false);
  const [showChairmanSection, setShowChairmanSection] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reportKeyRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  // Reset on new session
  useEffect(() => {
    if (!sessionActive) {
      clearTimers();
      setPhase("idle");
      setRevealIndex(0);
      setRevealedIds(new Set());
      setContentVisibleIds(new Set());
      setShowDebateBanner(false);
      setDebateHighlight(false);
      setDebateShownIds(new Set());
      setChairmanVisibleSections(0);
      setAnimateChairmanScores(false);
      setShowChairmanSection(false);
      return;
    }
    if (isRunning && phase === "idle") {
      setPhase("convening");
      setRevealIndex(0);
      setRevealedIds(new Set());
      setContentVisibleIds(new Set());
      setDebateShownIds(new Set());
      setChairmanVisibleSections(0);
      setAnimateChairmanScores(false);
      setShowChairmanSection(false);
    }
  }, [sessionActive, isRunning, phase, clearTimers]);

  // Reduced motion: show everything immediately as data arrives
  useEffect(() => {
    if (!reducedMotion || !sessionActive) return;

    if (isRunning || isComplete) {
      setPhase(report ? "done" : chairmanStatus !== "idle" ? "chairman" : "revealing");
      setRevealedIds(new Set(MEMBER_ORDER));
      setContentVisibleIds(new Set(MEMBER_ORDER));
      setDebateShownIds(new Set(MEMBER_ORDER.filter((id) => members.find((m) => m.id === id)?.debate)));
      if (chairmanStatus !== "idle" || report || chairmanError) {
        setShowChairmanSection(true);
      }
      if (report) {
        setChairmanVisibleSections(CHAIRMAN_SECTION_COUNT);
        setAnimateChairmanScores(true);
        setPhase("done");
      }
    }
  }, [
    reducedMotion,
    sessionActive,
    isRunning,
    isComplete,
    members,
    chairmanStatus,
    report,
    chairmanError,
  ]);

  // Staggered member reveal
  useEffect(() => {
    if (reducedMotion || !sessionActive) return;
    if (phase !== "convening" && phase !== "revealing") return;
    if (revealIndex >= MEMBER_ORDER.length) return;

    const nextId = MEMBER_ORDER[revealIndex];
    const member = members.find((m) => m.id === nextId);
    if (!memberReady(member)) return;

    const delay = revealIndex === 0 ? 0 : CARD_STAGGER_MS;
    schedule(() => {
      setRevealedIds((prev) => addToSet(prev, nextId));
      setPhase("revealing");
      schedule(() => {
        setContentVisibleIds((prev) => addToSet(prev, nextId));
      }, CARD_CONTENT_DELAY_MS);
      setRevealIndex((i) => i + 1);
    }, delay);
  }, [reducedMotion, sessionActive, phase, revealIndex, members, schedule]);

  // After all members revealed → debate or chairman
  useEffect(() => {
    if (reducedMotion || !sessionActive) return;
    if (revealIndex < MEMBER_ORDER.length) return;
    if (phase === "debating" || phase === "chairman" || phase === "done") return;

    if (enableDebate && !allDebatesReady(members)) {
      setPhase("debating");
      setShowDebateBanner(true);
      setDebateHighlight(true);
      return;
    }

    setPhase("chairman");
    setShowDebateBanner(false);
    setDebateHighlight(false);
    if (chairmanStatus !== "idle" || report || chairmanError) {
      setShowChairmanSection(true);
    }
  }, [
    reducedMotion,
    sessionActive,
    revealIndex,
    phase,
    enableDebate,
    members,
    chairmanStatus,
    report,
    chairmanError,
  ]);

  // Debate completes → show debate content with cross-fade, then chairman
  useEffect(() => {
    if (reducedMotion || phase !== "debating") return;

    const ready = allDebatesReady(members);
    if (!ready) return;

    schedule(() => {
      setDebateHighlight(false);
      setShowDebateBanner(false);
      MEMBER_ORDER.forEach((id, i) => {
        schedule(() => {
          setDebateShownIds((prev) => addToSet(prev, id));
        }, i * 80);
      });
      schedule(() => {
        setPhase("chairman");
        if (chairmanStatus !== "idle" || report || chairmanError) {
          setShowChairmanSection(true);
        }
      }, DEBATE_TRANSITION_MS);
    }, DEBATE_TRANSITION_MS);
  }, [reducedMotion, phase, members, chairmanStatus, report, chairmanError, schedule]);

  // Chairman section visibility when synthesis starts
  useEffect(() => {
    if (reducedMotion) return;
    if (chairmanStatus !== "idle" || report || chairmanError) {
      if (phase === "chairman" || phase === "done" || revealIndex >= MEMBER_ORDER.length) {
        setShowChairmanSection(true);
      }
    }
  }, [reducedMotion, chairmanStatus, report, chairmanError, phase, revealIndex]);

  // Reset report animation key on new session
  useEffect(() => {
    if (!sessionActive) {
      reportKeyRef.current = null;
    }
  }, [sessionActive]);

  // Chairman report section stagger
  useEffect(() => {
    if (reducedMotion || !report) return;

    const key = `${report.verdict}-${report.marketFitScore}-${report.executiveSummary.slice(0, 32)}`;
    if (reportKeyRef.current === key) return;
    reportKeyRef.current = key;

    setChairmanVisibleSections(0);
    setAnimateChairmanScores(false);

    for (let i = 0; i < CHAIRMAN_SECTION_COUNT; i++) {
      schedule(() => {
        setChairmanVisibleSections(i + 1);
        if (i === CHAIRMAN_SECTION_COUNT - 1) {
          schedule(() => setAnimateChairmanScores(true), CHAIRMAN_SECTION_STAGGER_MS);
        }
      }, (i + 1) * CHAIRMAN_SECTION_STAGGER_MS);
    }

    schedule(() => setPhase("done"), CHAIRMAN_SECTION_COUNT * CHAIRMAN_SECTION_STAGGER_MS + 200);
  }, [reducedMotion, report, schedule]);

  // Resolve stuck deliberating when run ends early
  useEffect(() => {
    if (reducedMotion || isRunning || !sessionActive) return;
    if (revealIndex >= MEMBER_ORDER.length) return;

    schedule(() => {
      setRevealedIds(new Set(MEMBER_ORDER));
      setContentVisibleIds(new Set(MEMBER_ORDER));
      setRevealIndex(MEMBER_ORDER.length);
      setShowDebateBanner(false);
      setDebateHighlight(false);
      setPhase(chairmanError || chairmanStatus === "error" ? "done" : "chairman");
      setShowChairmanSection(true);
    }, 300);
  }, [
    reducedMotion,
    isRunning,
    sessionActive,
    revealIndex,
    chairmanError,
    chairmanStatus,
    schedule,
  ]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const memberDisplay = useMemo((): MemberDisplayState[] => {
    return MEMBER_ORDER.map((id) => {
      const m = members.find((x) => x.id === id);
      const revealed = revealedIds.has(id);
      const isDeliberating =
        !reducedMotion &&
        sessionActive &&
        (phase === "convening" || phase === "revealing") &&
        !revealed &&
        m?.status !== "error";

      let displayStatus: MemberDisplayState["displayStatus"] = "idle";
      if (!sessionActive) displayStatus = "idle";
      else if (revealed && m?.status === "error") displayStatus = "error";
      else if (revealed) displayStatus = "revealed";
      else if (isDeliberating || (isRunning && !revealed)) displayStatus = "deliberating";

      return {
        id,
        displayStatus,
        showContent: reducedMotion || contentVisibleIds.has(id),
        isDebating: debateHighlight && revealed,
        showDebate: reducedMotion
          ? Boolean(m?.debate && enableDebate)
          : debateShownIds.has(id) && Boolean(m?.debate),
      };
    });
  }, [
    members,
    revealedIds,
    contentVisibleIds,
    debateShownIds,
    debateHighlight,
    reducedMotion,
    sessionActive,
    phase,
    isRunning,
    enableDebate,
  ]);

  const revealedCount = revealedIds.size;

  return {
    phase,
    memberDisplay,
    revealedCount,
    showChairmanSection: reducedMotion
      ? chairmanStatus !== "idle" || Boolean(report) || Boolean(chairmanError)
      : showChairmanSection,
    showChairmanLoading:
      chairmanStatus === "loading" || chairmanStatus === "streaming",
    chairmanVisibleSections: reducedMotion
      ? report
        ? CHAIRMAN_SECTION_COUNT
        : 0
      : chairmanVisibleSections,
    animateChairmanScores: reducedMotion ? Boolean(report) : animateChairmanScores,
    showDebateBanner,
    counterPulse: phase === "convening" || phase === "revealing",
  };
}
