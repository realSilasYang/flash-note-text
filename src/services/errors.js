export function serviceError (i18nKey, i18nParams = {}, cause) {
  const error = new Error(i18nKey)
  error.i18nKey = i18nKey
  error.i18nParams = i18nParams
  if (cause !== undefined) error.cause = cause
  return error
}
