import { ref } from 'vue'

export function useCountdown(initialCount = 60) {
  const count = ref(initialCount)
  const isActive = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const cstart = () => {
    if (isActive.value) return

    isActive.value = true
    count.value = initialCount

    timer = setInterval(() => {
      count.value--
      if (count.value <= 0) {
        stop()
      }
    }, 1000)
  }

  const stop = () => {
    isActive.value = false
    count.value = initialCount
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    count,
    isActive,
    start: cstart,
    stop
  }
}
