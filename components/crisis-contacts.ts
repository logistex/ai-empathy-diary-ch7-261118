// 2026-11-18 11:55 KST
// 위기 안내 문구와 상담 연락처. 번호와 문구는 이 상수 1개에서만 고침(docs/CONTRACT.md 4장).
export const CRISIS_NOTICE = {
  title: "혼자 견디지 않으셔도 괜찮아요",
  intro:
    "요즘 마음이 많이 힘드신 것 같아 걱정이 돼요. 이야기를 들어 줄 분들이 있으니, 편할 때 한번 연락해 보세요.",
  contacts: [
    {
      name: "자살예방상담전화",
      phone: "109",
      description: "24시간 상담해 드려요.",
    },
    {
      name: "청소년상담",
      phone: "1388",
      description:
        "365일 24시간 무료예요. 9~24세 청소년과 부모, 보호자가 이용할 수 있어요.",
    },
  ],
} as const;
