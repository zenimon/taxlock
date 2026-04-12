const MEDIUM_THRESHOLD = parseFloat(localStorage.getItem('riskMediumThreshold')) || 0.40;
const HIGH_THRESHOLD = parseFloat(localStorage.getItem('riskHighThreshold')) || 0.75;

export function getRiskColor(score) {
  if (score >= HIGH_THRESHOLD) return '#E24B4A'; // critical
  if (score >= MEDIUM_THRESHOLD) return '#D85A30'; // high
  if (score >= 0.2) return '#EF9F27'; // medium
  return '#1D9E75'; // low
}

export function getRiskLabel(score) {
  if (score >= HIGH_THRESHOLD) return 'Critical';
  if (score >= MEDIUM_THRESHOLD) return 'High';
  if (score >= 0.2) return 'Medium';
  return 'Low';
}

export function setRiskThresholds(medium, high) {
  localStorage.setItem('riskMediumThreshold', medium.toString());
  localStorage.setItem('riskHighThreshold', high.toString());
}
