import { useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";

type UseStoriesProgressArgs = {
  length: number;
  durationMs: number;
  autoStart?: boolean;
};

export function useStoriesProgress({
  length,
  durationMs,
  autoStart = true,
}: UseStoriesProgressArgs) {
  const [index, setIndex] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const runningAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedProgressRef = useRef(0); // 0..1
  const isPressingRef = useRef(false);

  // keep index in bounds if length changes
  useEffect(() => {
    if (length === 0) {
      setIndex(0);
      progressAnim.setValue(0);
      pausedProgressRef.current = 0;
      runningAnimRef.current?.stop();
      runningAnimRef.current = null;
      return;
    }
    setIndex((prev) => Math.min(prev, length - 1));
  }, [length, progressAnim]);

  const stop = () => {
    runningAnimRef.current?.stop();
    runningAnimRef.current = null;
  };

  const start = (fromProgress = 0) => {
    if (length === 0) return;

    progressAnim.setValue(fromProgress);

    const remaining = Math.max(0, 1 - fromProgress);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: Math.round(durationMs * remaining),
      useNativeDriver: false,
    });

    runningAnimRef.current = anim;

    anim.start(({ finished }) => {
      runningAnimRef.current = null;
      if (!finished) return;
      if (isPressingRef.current) return;

      pausedProgressRef.current = 0;
      setIndex((prev) => (prev + 1) % length);
    });
  };

  const pause = () => {
    if (length === 0) return;
    isPressingRef.current = true;

    stop();

    progressAnim.stopAnimation((value) => {
      pausedProgressRef.current = typeof value === "number" ? value : 0;
    });
  };

  const resume = () => {
    if (length === 0) return;
    isPressingRef.current = false;
    start(pausedProgressRef.current);
  };

  const resetAndGoTo = (nextIndex: number) => {
    if (length === 0) return;

    stop();
    pausedProgressRef.current = 0;
    progressAnim.setValue(0);

    // normalize
    const clamped = Math.max(0, Math.min(nextIndex, length - 1));
    setIndex(clamped);
  };

  const next = () => {
    if (length === 0) return;
    // wrap on next (optional — keep if you want looping)
    resetAndGoTo(index === length - 1 ? 0 : index + 1);
  };

  const prev = () => {
    if (length === 0) return;

    // If on first image: restart progress without changing index
    if (index === 0) {
      stop();
      pausedProgressRef.current = 0;
      progressAnim.setValue(0);

      // If user is currently holding, don't start yet — onPressOut will resume.
      if (!isPressingRef.current) start(0);
      return;
    }

    resetAndGoTo(index - 1);
  };

  const HOLD_THRESHOLD_MS = 450;

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasHoldRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  const onPressIn = () => {
    wasHoldRef.current = false;
    pause();

    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = setTimeout(() => {
      wasHoldRef.current = true;
    }, HOLD_THRESHOLD_MS);
  };

  const onPressOut = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    resume();
  };

  const makeTapHandler = (action: () => void) => () => {
    // Only navigate if it was NOT a hold
    if (wasHoldRef.current) return;
    action();
  };

  // autoplay when index changes
  useEffect(() => {
    if (!autoStart) return;
    if (length === 0) return;

    pausedProgressRef.current = 0;
    start(0);

    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, length, autoStart, durationMs]);

  const progressWidthFor = useMemo(() => {
    return (segmentIndex: number) => {
      if (segmentIndex < index) return "100%";
      if (segmentIndex > index) return "0%";
      return progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      });
    };
  }, [index, progressAnim]);

  return {
    index,
    setIndex: resetAndGoTo,
    next,
    prev,
    pause,
    resume,
    progressAnim,
    progressWidthFor,
    onPressIn,
    onPressOut,
    makeTapHandler,
  };
}
