-- 더미 데이터 삽입
-- Supabase SQL Editor에서 실행 (service_role → RLS 우회)
-- 사전 조건: 사민재(ykm123432@gmail.com), 사소장(ykm12@gmail.com) 계정이 존재해야 합니다.

DO $$
DECLARE
  manager1_id UUID;  -- 사민재
  manager2_id UUID;  -- 사소장
BEGIN
  SELECT p.id INTO manager1_id FROM profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = 'ykm123432@gmail.com';
  SELECT p.id INTO manager2_id FROM profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = 'ykm12@gmail.com';

  IF manager1_id IS NULL THEN
    RAISE EXCEPTION '사민재 계정(ykm123432@gmail.com)이 없습니다. 먼저 회원가입을 완료해주세요.';
  END IF;
  IF manager2_id IS NULL THEN
    RAISE EXCEPTION '사소장 계정(ykm12@gmail.com)이 없습니다. 먼저 회원가입을 완료해주세요.';
  END IF;

  -- 두 소장 프로필 업데이트
  UPDATE profiles
  SET role = 'manager', rating_avg = 4.8, is_certified = true
  WHERE id = manager1_id;

  UPDATE profiles
  SET role = 'manager', rating_avg = 4.6, is_certified = false
  WHERE id = manager2_id;

  -- 기존 더미 데이터 정리
  DELETE FROM jobs WHERE title LIKE '[더미]%';

  -- ── 모집중(open) 일감 — 사민재 소장 ────────────────────────────
  INSERT INTO jobs (
    manager_id, title, job_type, equipment_code,
    description, location, latitude, longitude,
    pay_amount, work_date, pay_due_type, status
  ) VALUES
    (
      manager1_id, '[더미] 논현동 신축 현장 기초 굴착', 'civil', '035',
      '신축 빌라 기초 굴착 작업입니다. 암반 없는 일반 토질입니다.',
      '서울 강남구 논현동', 37.5115, 127.0307,
      450000, CURRENT_DATE + 3, 'd7', 'open'
    ),
    (
      manager1_id, '[더미] 하남 물류센터 토목 공사', 'civil', '10t',
      '물류센터 부지 정지 작업. 대형 장비 진입 가능.',
      '경기 하남시 풍산동', 37.5393, 127.2069,
      650000, CURRENT_DATE + 2, 'same_day', 'open'
    ),
    (
      manager1_id, '[더미] 용인 택지개발 구역 도로 절토', 'civil', '3w',
      '택지개발 지구 내 도로 절토 및 운반 작업입니다.',
      '경기 용인시 기흥구', 37.2752, 127.1146,
      520000, CURRENT_DATE + 1, 'd7', 'open'
    ),
    (
      manager1_id, '[더미] 화성 산업단지 대형 굴착', 'civil', '8w',
      '산업단지 신규 부지 정지 및 굴착. 장거리 운반 포함.',
      '경기 화성시 봉담읍', 37.2142, 126.9815,
      750000, CURRENT_DATE + 10, 'd30', 'open'
    ),
    (
      manager1_id, '[더미] 송파구 재건축 구역 터파기', 'civil', '035',
      '재건축 단지 내 지하주차장 굴착 작업.',
      '서울 송파구 잠실동', 37.5125, 127.1025,
      480000, CURRENT_DATE + 8, 'd7', 'open'
    ),
    (
      manager1_id, '[더미] 수원 아파트 단지 철거', 'demolition', '035',
      '구 아파트 단지 철거. 뿌레카 장착 필요.',
      '경기 수원시 팔달구', 37.2636, 127.0286,
      560000, CURRENT_DATE + 14, 'd7', 'open'
    ),
    (
      manager1_id, '[더미] 평택 반도체 단지 부지 조성', 'civil', '10t',
      '대규모 부지 성토 및 정지 작업. 2일 연속 작업.',
      '경기 평택시 고덕동', 37.0141, 127.0726,
      820000, CURRENT_DATE + 6, 'd14', 'open'
    ),
    (
      manager1_id, '[더미] 구리 아파트 단지 조경 터파기', 'civil', '017',
      '조경 식재를 위한 소형 굴착. 협소 구간 다수.',
      '경기 구리시 교문동', 37.5943, 127.1296,
      240000, CURRENT_DATE + 4, 'same_day', 'open'
    ),

  -- ── 모집중(open) 일감 — 사소장 ──────────────────────────────────
    (
      manager2_id, '[더미] 성수동 공장 철거 작업', 'demolition', '008',
      '3층 규모 공장 철거입니다. 유리섬유 주의 구역 포함.',
      '서울 성동구 성수동', 37.5447, 127.0562,
      380000, CURRENT_DATE + 5, 'd14', 'open'
    ),
    (
      manager2_id, '[더미] 마포구 다세대 신축 터파기', 'civil', '017',
      '협소 골목 진입. 미니 장비 우선.',
      '서울 마포구 망원동', 37.5566, 126.9066,
      280000, CURRENT_DATE + 7, 'd3', 'open'
    ),
    (
      manager2_id, '[더미] 인천 주상복합 기초 공사', 'civil', '02',
      '지하 2층 규모 기초 굴착. 암반 구간 포함 가능성 있음.',
      '인천 남동구 논현동', 37.4152, 126.7378,
      430000, CURRENT_DATE + 4, 'd14', 'open'
    ),
    (
      manager2_id, '[더미] 부천 공동주택 부지 조성', 'civil', '6w',
      '연립주택 부지 성토 및 정지 작업.',
      '경기 부천시 원미구', 37.5034, 126.7660,
      390000, CURRENT_DATE + 3, 'd14', 'open'
    ),
    (
      manager2_id, '[더미] 동작구 재개발 구역 건물 철거', 'demolition', '008',
      '5층 구 상가건물 철거. 인접 주택 보양 필수.',
      '서울 동작구 상도동', 37.4980, 126.9421,
      470000, CURRENT_DATE + 9, 'd7', 'open'
    ),
    (
      manager2_id, '[더미] 시흥 스마트허브 도로 절토', 'civil', '6w',
      '산업단지 내 도로 절토 및 성토 작업. 휠 장비 필수.',
      '경기 시흥시 정왕동', 37.3486, 126.7336,
      580000, CURRENT_DATE + 11, 'd7', 'open'
    ),
    (
      manager2_id, '[더미] 양주 전원주택 단지 기초 굴착', 'civil', '035',
      '전원주택 10세대 기초 굴착. 총 3일 작업 예정.',
      '경기 양주시 은현면', 37.8612, 126.9893,
      510000, CURRENT_DATE + 13, 'd7', 'open'
    ),
    (
      manager2_id, '[더미] 강서구 물류창고 신축 터파기', 'civil', '8w',
      '대형 물류창고 지하 1층 굴착. 토사 반출 포함.',
      '서울 강서구 마곡동', 37.5604, 126.8321,
      690000, CURRENT_DATE + 2, 'd14', 'open'
    ),
    (
      manager2_id, '[더미] 고양 일산 상업지구 철거', 'demolition', '035',
      '구 상업건물 철거 및 잔재물 정리.',
      '경기 고양시 일산서구', 37.6756, 126.7753,
      420000, CURRENT_DATE + 16, 'same_day', 'open'
    ),
    (
      manager2_id, '[더미] 의왕 물류단지 부지 정지', 'civil', '10t',
      '신규 물류단지 조성을 위한 대규모 정지 작업.',
      '경기 의왕시 청계동', 37.3457, 126.9981,
      770000, CURRENT_DATE + 5, 'd30', 'open'
    ),

  -- ── 마감(closed) 일감 — 혼합 ────────────────────────────────────
    (
      manager1_id, '[더미] 은평구 단독주택 철거', 'demolition', '008',
      '2층 단독주택 철거. 인접 건물 보양 필수.',
      '서울 은평구 불광동', 37.6094, 126.9296,
      320000, CURRENT_DATE - 3, 'd3', 'closed'
    ),
    (
      manager1_id, '[더미] 광진구 상가 리모델링 터파기', 'civil', '017',
      '지하 1층 추가 굴착. 협소 도심 현장.',
      '서울 광진구 구의동', 37.5479, 127.0913,
      260000, CURRENT_DATE - 5, 'same_day', 'closed'
    ),
    (
      manager2_id, '[더미] 의정부 근린공원 조성 토공', 'civil', '3w',
      '공원 부지 성토 작업. 일반 토질.',
      '경기 의정부시 가능동', 37.7386, 127.0439,
      310000, CURRENT_DATE - 7, 'd7', 'closed'
    ),
    (
      manager2_id, '[더미] 강동구 노후 건물 철거', 'demolition', '035',
      '4층 노후 상가 건물 철거. 석면 조사 완료.',
      '서울 강동구 천호동', 37.5382, 127.1238,
      490000, CURRENT_DATE - 2, 'd14', 'closed'
    ),
    (
      manager1_id, '[더미] 성남 판교 오피스 기초 굴착', 'civil', '02',
      '중규모 오피스 기초 굴착. 암반 있음.',
      '경기 성남시 분당구 삼평동', 37.4018, 127.1076,
      540000, CURRENT_DATE - 4, 'd7', 'closed'
    ),
    (
      manager2_id, '[더미] 중랑구 소형 창고 철거', 'demolition', '008',
      '단층 소형 창고 철거. 협소 진입로.',
      '서울 중랑구 면목동', 37.5834, 127.0826,
      190000, CURRENT_DATE - 1, 'same_day', 'closed'
    );

  RAISE NOTICE '더미 일감 28개 삽입 완료 (사민재 14개 / 사소장 14개)';
END $$;
