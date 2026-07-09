import { describe, expect, it } from 'vitest';

import { ko } from '../../src/i18n/locales/ko';

const remixPromptKeys = [
  'chat.example1Prompt',
  'chat.example2Prompt',
  'chat.example3Prompt',
  'chat.example4Prompt',
] as const;

describe('Korean remix starter prompts', () => {
  it('uses telecom-focused starter topics for headquarters, dealers, stores, and enterprise sales', () => {
    expect(ko['chat.example1Title']).toBe('본사 통합 운영 관제');
    expect(ko['chat.example1Tag']).toBe('본사');
    expect(ko['chat.example1Prompt']).toContain('통신사 본사 운영팀');
    expect(ko['chat.example1Prompt']).toContain('전국 서비스 품질');

    expect(ko['chat.example2Title']).toBe('대리점 영업 성과 관리');
    expect(ko['chat.example2Tag']).toBe('대리점');
    expect(ko['chat.example2Prompt']).toContain('통신사 대리점장');
    expect(ko['chat.example2Prompt']).toContain('매장별 판매 성과');

    expect(ko['chat.example3Title']).toBe('영업점 고객 응대 콘솔');
    expect(ko['chat.example3Tag']).toBe('영업점');
    expect(ko['chat.example3Prompt']).toContain('통신사 영업점 직원');
    expect(ko['chat.example3Prompt']).toContain('방문 고객');

    expect(ko['chat.example4Title']).toBe('법인 영업 파이프라인');
    expect(ko['chat.example4Tag']).toBe('법인');
    expect(ko['chat.example4Prompt']).toContain('통신사 본사와 법인 영업 조직');
    expect(ko['chat.example4Prompt']).toContain('기업 고객 제안');
  });

  it('strongly preserves the copied reference HTML styling for every starter prompt', () => {
    for (const key of remixPromptKeys) {
      const prompt = ko[key];

      expect(prompt).toContain('현재 프로젝트에 복사된 원본 index.html과 CSS를 먼저 읽고');
      expect(prompt).toContain('새 HTML을 처음부터 다시 만들지 마세요');
      expect(prompt).toContain('원본의 CSS 변수, 색상 팔레트, 배경, 타이포그래피');
      expect(prompt).toContain('폰트는 Pretend로 통일하고');
      expect(prompt).toContain('새 색상, 새 레이아웃, 새 디자인 시스템으로 갈아엎지 마세요');
      expect(prompt).toContain('현재 원본 html의 스타일과, 형태를 최대한 활용해서, 본문의 내용을 구성해주세요');
    }
  });
});
