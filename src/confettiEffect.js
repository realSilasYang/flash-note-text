let confettiFrame = null
let confettiEnd = 0
let rectangleShape = null
let confettiLoader = null

function loadConfetti () {
  if (!confettiLoader) {
    confettiLoader = import('canvas-confetti').then(module => module.default || module)
  }
  return confettiLoader
}

export function triggerConfetti (options = {}) {
  loadConfetti().then(confetti => runConfetti(confetti, options)).catch(() => {})
}

export function preloadConfetti () {
  return loadConfetti()
}

function runConfetti (confetti, options) {
  const duration = 800
  const now = Date.now()

  if (confettiFrame !== null) {
    confettiEnd = Math.min(Math.max(confettiEnd, now + duration), now + 1200)
    return
  }
  confettiEnd = now + duration

  const colors = ['#fce18a', '#009688', '#f4306d', '#b48def', '#95FF82', '#FF9800']

  if (!rectangleShape) {
    rectangleShape = confetti.shapeFromPath({
      path: 'M0 0 L10 0 L10 2 L0 2 Z'
    })
  }

  const frame = () => {
    const frameTime = Date.now()
    if (frameTime > confettiEnd) {
      confettiFrame = null
      return
    }

    const shuffledColors = [...colors].sort(() => Math.random() - 0.5)
    const common = {
      particleCount: 2,
      decay: 0.9,
      colors: shuffledColors,
      shapes: ['square', 'circle', rectangleShape],
      scalar: 1,
      ticks: 70,
      ...(Number.isFinite(options.zIndex) ? { zIndex: options.zIndex } : {})
    }

    confetti({
      ...common,
      angle: 270,
      spread: 360,
      origin: { x: Math.random(), y: 0 },
      startVelocity: Math.random() * 15
    })

    confetti({
      ...common,
      angle: 45,
      spread: 60,
      origin: { x: 0, y: 1 },
      startVelocity: 20 + Math.random() * 20
    })

    confetti({
      ...common,
      angle: 135,
      spread: 60,
      origin: { x: 1, y: 1 },
      startVelocity: 20 + Math.random() * 20
    })

    confettiFrame = requestAnimationFrame(frame)
  }

  frame()
}
