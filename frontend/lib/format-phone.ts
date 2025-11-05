/**
 * 전화번호를 포맷팅합니다 (010-0000-0000 형식)
 * @param value 입력된 전화번호 (숫자만 또는 하이픈 포함)
 * @returns 포맷팅된 전화번호
 */
export function formatPhoneNumber(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '')

  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  // 11자리를 초과하면 11자리까지만
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

/**
 * 포맷팅된 전화번호에서 숫자만 추출합니다
 * @param formattedPhone 포맷팅된 전화번호
 * @returns 숫자만 있는 전화번호
 */
export function unformatPhoneNumber(formattedPhone: string): string {
  return formattedPhone.replace(/[^\d]/g, '')
}

/**
 * 전화번호 유효성 검사
 * @param phone 전화번호
 * @returns 유효한 전화번호인지 여부
 */
export function isValidPhoneNumber(phone: string): boolean {
  const numbers = phone.replace(/[^\d]/g, '')
  // 한국 휴대폰: 010, 011, 016, 017, 018, 019로 시작하는 10-11자리
  return /^01[0-9]{8,9}$/.test(numbers)
}
