
import padStart from 'lodash/padStart';

const padZero = n => padStart(n, 2, 0);

// formats a raw duration (in seconds) to a hh:mm:ss timestamp string
export default function formatTimestamp(duration = 0, showMs = false) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration / 60) % 60;
  const seconds = Math.floor(duration % 60);

  const hh = hours > 0 && padZero(hours);
  const mm = padZero(minutes);
  const ss = padZero(seconds);
  const ms = showMs && duration.toFixed(2).substr(-2);

  return `${hh ? `${hh}:` : ''}${mm}:${ss}${ms ? `.${ms}` : ''}`;
}
