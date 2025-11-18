/**
 * 날짜 포맷팅 유틸리티 함수
 * UTC 시간을 한국 시간으로 변환하여 표시
 */

/**
 * ISO 8601 형식의 날짜 문자열을 한국 시간으로 포맷팅
 * @param dateString - ISO 8601 날짜 문자열 (예: "2025-11-18T17:29:34")
 * @param includeTime - 시간 포함 여부 (기본값: true)
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(dateString: string | null | undefined, includeTime: boolean = true): string {
  if (!dateString) return '-'

  try {
    // 입력 문자열이 타임존 정보가 없으면 UTC로 간주
    let date: Date

    if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('T')) {
      // ISO 8601 형식
      date = new Date(dateString)
    } else if (dateString.includes(' ')) {
      // "YYYY-MM-DD HH:mm:ss" 형식 - UTC로 간주
      date = new Date(dateString.replace(' ', 'T') + 'Z')
    } else {
      // 기타 형식
      date = new Date(dateString)
    }

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return dateString // 원본 문자열 반환
    }

    // 한국 시간으로 포맷팅
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }

    if (includeTime) {
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.second = '2-digit'
      options.hour12 = false
    }

    const formatted = new Intl.DateTimeFormat('ko-KR', options).format(date)

    // "YYYY. MM. DD. HH:mm:ss" 형식을 "YYYY-MM-DD HH:mm:ss"로 변경
    return formatted
      .replace(/\. /g, '-')
      .replace(/\./g, '')
      .replace(/오전|오후/g, '')
      .trim()

  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString)
    return dateString // 에러 시 원본 반환
  }
}

/**
 * 날짜를 상대적인 시간으로 표시 (예: 2시간 전, 3일 전)
 * @param dateString - ISO 8601 날짜 문자열
 * @returns 상대적인 시간 문자열
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInSec = Math.floor(diffInMs / 1000)
    const diffInMin = Math.floor(diffInSec / 60)
    const diffInHour = Math.floor(diffInMin / 60)
    const diffInDay = Math.floor(diffInHour / 24)

    if (diffInSec < 60) {
      return '방금 전'
    } else if (diffInMin < 60) {
      return `${diffInMin}분 전`
    } else if (diffInHour < 24) {
      return `${diffInHour}시간 전`
    } else if (diffInDay < 30) {
      return `${diffInDay}일 전`
    } else {
      return formatDate(dateString, false)
    }
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return formatDate(dateString, false)
  }
}

/**
 * 주문 날짜를 위한 특별한 포맷터
 * @param dateString - 날짜 문자열
 * @returns 포맷된 주문 날짜
 */
export function formatOrderDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'

  // 서버에서 "YYYY-MM-DD HH:mm:ss" 형식으로 온 경우 UTC로 처리
  if (!dateString.includes('T') && !dateString.includes('Z')) {
    // UTC 시간으로 간주하고 9시간 더함 (한국시간)
    const utcDate = new Date(dateString.replace(' ', 'T') + 'Z')
    return formatDate(utcDate.toISOString(), true)
  }

  return formatDate(dateString, true)
}