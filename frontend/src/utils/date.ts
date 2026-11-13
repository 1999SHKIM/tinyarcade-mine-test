// [참고] 서버가 주는 시각(UTC, 끝에 Z)을 한국 날짜 "2026-11-13"으로 바꾼다.
// - 앞 10글자만 자르면 UTC 날짜라서 한국 00~09시에 만든 건 전날로 보인다.
// - 9시간을 더한 뒤 자르면 한국 날짜가 된다(주차 배지와 같은 방식).
export function formatKstDate(iso?: string | null) {
  if (!iso) return '-'
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}
