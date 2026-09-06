export function getExternalText (action, featureCode) {
  if (action?.code !== featureCode || action.type !== 'over') return null
  return typeof action.payload === 'string' ? action.payload : null
}
