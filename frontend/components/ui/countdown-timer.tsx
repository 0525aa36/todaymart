'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endTime: string | Date
  onExpire?: () => void
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ endTime, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const onExpireCalledRef = useRef(false)
  const onExpireRef = useRef(onExpire)

  // onExpire를 ref로 저장하여 useEffect dependency에서 제외
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const difference = new Date(endTime).getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsExpired(true)
        // onExpire는 한 번만 호출
        if (!onExpireCalledRef.current && onExpireRef.current) {
          onExpireCalledRef.current = true
          onExpireRef.current()
        }
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    // 초기 계산
    setTimeLeft(calculateTimeLeft())

    // 1초마다 업데이트
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime]) // onExpire를 dependency에서 제거

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">종료됨</span>
      </div>
    )
  }

  if (!timeLeft) {
    return null
  }

  const timeUnits = [
    { value: timeLeft.days, label: '일', show: timeLeft.days > 0 },
    { value: timeLeft.hours, label: '시간', show: true },
    { value: timeLeft.minutes, label: '분', show: true },
    { value: timeLeft.seconds, label: '초', show: true }
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-primary" />
      <div className="flex items-center gap-1">
        {timeUnits
          .filter(unit => unit.show)
          .map((unit, index) => (
            <span key={unit.label} className="flex items-center">
              <span className="min-w-[2ch] text-center font-bold text-lg tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-sm text-muted-foreground ml-0.5">{unit.label}</span>
              {index < timeUnits.filter(u => u.show).length - 1 && (
                <span className="mx-1 text-muted-foreground">:</span>
              )}
            </span>
          ))}
      </div>
    </div>
  )
}
