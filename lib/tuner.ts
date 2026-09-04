export type TuningString = {
  id: 'upper' | 'lower';
  label: string;
  note: string;
  frequency: number;
};

export type PitchMatch = {
  target: TuningString;
  cents: number;
  frequency: number;
};

function distanceInCents(frequency: number, target: number) {
  return 1200 * Math.log2(frequency / target);
}

export function matchPitchToString(
  detectedFrequency: number,
  strings: readonly TuningString[],
): PitchMatch | null {
  if (!Number.isFinite(detectedFrequency) || detectedFrequency <= 0 || !strings.length) return null;

  let best: PitchMatch | null = null;

  strings.forEach((target) => {
    for (let octaveShift = -2; octaveShift <= 2; octaveShift += 1) {
      const candidateFrequency = detectedFrequency * 2 ** octaveShift;
      const cents = distanceInCents(candidateFrequency, target.frequency);
      if (!best || Math.abs(cents) < Math.abs(best.cents)) {
        best = { target, cents, frequency: candidateFrequency };
      }
    }
  });

  return best;
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function createPluckedString(
  context: AudioContext,
  frequency: number,
  durationSeconds = 2.8,
) {
  const frameCount = Math.ceil(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(context.sampleRate / frequency));

  for (let index = 0; index < period && index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }
  for (let index = period; index < samples.length; index += 1) {
    samples[index] = .497 * (samples[index - period] + samples[index - period + 1]);
  }

  return buffer;
}
