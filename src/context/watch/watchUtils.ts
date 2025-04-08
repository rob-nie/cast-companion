
export const formatStopwatchTime = (timeMs: number): string => {
  // Format time as hh:mm:ss without milliseconds
  const seconds = Math.floor((timeMs / 1000) % 60);
  const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
  const hours = Math.floor(timeMs / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
