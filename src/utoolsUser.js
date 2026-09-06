const FALLBACK_USER = Object.freeze({
  avatar: '',
  handle: '',
  name: ''
})

function firstString (...values) {
  return values.find(value => typeof value === 'string' && value.trim())?.trim() || ''
}

export function normalizeUtoolsUser (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return FALLBACK_USER
  const name = firstString(value.nickname, value.nickName, value.username, value.userName, value.name)
  const handle = firstString(value.username, value.userName, value.account, value.email)
  const avatar = firstString(value.avatar, value.avatarUrl, value.avatarURL, value.headimgurl, value.photo, value.photoUrl)
  return { avatar, handle, name }
}

export function readUtoolsUser () {
  try {
    const result = window.utools?.getUser?.()
    if (result && typeof result.then === 'function') return result.then(normalizeUtoolsUser).catch(() => FALLBACK_USER)
    return normalizeUtoolsUser(result)
  } catch {
    return FALLBACK_USER
  }
}

