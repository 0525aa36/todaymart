/**
 * 택배사 코드 및 정보 (스마트택배 API 기준)
 */

export interface CourierCompany {
  code: string;
  name: string;
}

// 전체 택배사 목록 (스마트택배 API 기준)
export const COURIER_COMPANIES: CourierCompany[] = [
  { code: "04", name: "CJ대한통운" },
  { code: "05", name: "한진택배" },
  { code: "06", name: "로젠택배" },
  { code: "08", name: "롯데택배" },
  { code: "01", name: "우체국택배" },
  { code: "11", name: "일양로지스" },
  { code: "46", name: "CU 편의점택배" },
  { code: "22", name: "대신택배" },
  { code: "23", name: "경동택배" },
  { code: "24", name: "합동택배" },
  { code: "45", name: "호남택배" },
  { code: "53", name: "농협택배" },
  { code: "32", name: "홈픽" },
  { code: "16", name: "한의사랑택배" },
  { code: "17", name: "천일택배" },
  { code: "18", name: "건영택배" },
  { code: "40", name: "굿투럭" },
  { code: "54", name: "홈이노베이션로지스" },
  { code: "55", name: "큐런택배" },
  { code: "56", name: "SLX택배" },
];

// 주요 택배사 목록 (자주 사용되는 상위 5개)
export const MAJOR_COURIER_COMPANIES: CourierCompany[] = [
  { code: "04", name: "CJ대한통운" },
  { code: "05", name: "한진택배" },
  { code: "06", name: "로젠택배" },
  { code: "08", name: "롯데택배" },
  { code: "01", name: "우체국택배" },
];

// 코드로 택배사 이름 조회
export function getCourierNameByCode(code: string | null | undefined): string {
  if (!code) return "";
  const courier = COURIER_COMPANIES.find((c) => c.code === code);
  return courier?.name || code;
}

// 이름으로 택배사 코드 조회
export function getCourierCodeByName(name: string | null | undefined): string {
  if (!name) return "";
  const courier = COURIER_COMPANIES.find((c) => c.name === name);
  return courier?.code || "";
}

// 배송 상태 레벨 설명
export const DELIVERY_LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: "배송준비중",
  2: "집하완료",
  3: "배송중",
  4: "지점도착",
  5: "배송출발",
  6: "배송완료",
};

export function getDeliveryLevelDescription(level: number): string {
  return DELIVERY_LEVEL_DESCRIPTIONS[level] || "알 수 없음";
}

// 배송 조회 응답 타입
export interface DeliveryTrackingResponse {
  success: boolean;
  complete: boolean;
  level: number;
  levelDescription: string;
  itemName: string | null;
  invoiceNo: string | null;
  receiverName: string | null;
  receiverAddr: string | null;
  senderName: string | null;
  courierCode: string | null;
  courierName: string | null;
  trackingDetails: TrackingDetail[];
  errorMessage: string | null;
}

export interface TrackingDetail {
  timeString: string | null;
  time: string | null;
  location: string | null;
  status: string | null;
  telNo: string | null;
  telno: string | null;  // 백엔드 응답 필드명
  code: string | null;
  where: string | null;  // 백엔드 응답 필드명
  kind: string | null;   // 백엔드 응답 필드명
}
