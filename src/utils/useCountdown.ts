import { ref, onUnmounted } from 'vue'

export function useCountdown(initialCount = 60, storageKey?: string) {
  const count = ref(initialCount)
  const isActive = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  // 计算剩余时间
  const calculateRemainingTime = (): number => {
    if (!storageKey) return initialCount
    
    const savedEnd = localStorage.getItem(storageKey)
    if (!savedEnd) return initialCount
    
    const endTime = parseInt(savedEnd)
    const now = Date.now()
    const remainingMs = endTime - now
    
    if (remainingMs <= 0) {
      localStorage.removeItem(storageKey)
      return initialCount
    }
    
    // 返回实际剩余秒数（向上取整）
    return Math.ceil(remainingMs / 1000)
  }

  const startTimer = () => {
    if (timer) clearInterval(timer)
    
    timer = setInterval(() => {
      count.value--
      
      if (count.value <= 0) {
        stop()
        if (storageKey) {
          localStorage.removeItem(storageKey)
        }
      }
    }, 1000)
  }

  // 初始化时恢复状态
  const remainingTime = calculateRemainingTime()
  if (remainingTime < initialCount && remainingTime > 0) {
    count.value = remainingTime
    isActive.value = true
    startTimer()
  }

  const start = () => {
    if (isActive.value) return

    count.value = initialCount
    isActive.value = true
    
    // 存储结束时间（当前时间 + 60秒）
    if (storageKey) {
      const endTime = Date.now() + initialCount * 1000
      localStorage.setItem(storageKey, endTime.toString())
    }
    
    startTimer()
  }

  const stop = () => {
    isActive.value = false
    count.value = initialCount
    
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    if (storageKey) {
      localStorage.removeItem(storageKey)
    }
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    count,
    isActive,
    start,
    stop,
    calculateRemainingTime // 导出用于调试
  }
}