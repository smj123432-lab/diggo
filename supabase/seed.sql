-- 더미 데이터 삽입
-- Supabase SQL Editor에서 실행 (service_role → RLS 우회)
-- 실행 전: profiles 테이블에 계정이 최소 1개 이상 있어야 합니다.

DO $$
DECLARE
  manager_id UUID;
BEGIN
  SELECT id INTO manager_id FROM profiles LIMIT 1;

  IF manager_id IS NULL THEN
    RAISE EXCEPTION '먼저 회원가입을 완료해주세요.';
  END IF;

  -- 현재 계정을 소장(인증) 으로 업데이트
  -- 평점 4.5 이상 → is_certified = true
  UPDATE profiles
  SET role = 'manager',
      rating_avg = 4.8,
      is_certified = true
  WHERE id = manager_id;

  -- 기존 더미 데이터 정리
  DELETE FROM jobs WHERE title LIKE '[더미]%';

  -- ── 모집중(open) 일감 ──────────────────────────────────────
  INSERT INTO jobs (
    manager_id, title, job_type, equipment_code,
    description, location, latitude, longitude,
    pay_amount, work_date, pay_due_type, status
  ) VALUES
    (
      manager_id, '[더미] 논현동 신축 현장 기초 굴착', 'civil', '035',
      '신축 빌라 기초 굴착 작업입니다. 암반 없는 일반 토질입니다.',
      '서울 강남구 논현동', 37.5115, 127.0307,
      450000, CURRENT_DATE + 3, 'd7', 'open'
    ),
    (
      manager_id, '[더미] 성수동 공장 철거 작업', 'demolition', '008',
      '3층 규모 공장 철거입니다. 유리섬유 주의 구역 포함.',
      '서울 성동구 성수동', 37.5447, 127.0562,
      380000, CURRENT_DATE + 5, 'd14', 'open'
    ),
    (
      manager_id, '[더미] 하남 물류센터 토목 공사', 'civil', '10t',
      '물류센터 부지 정지 작업. 대형 장비 진입 가능.',
      '경기 하남시 풍산동', 37.5393, 127.2069,
      650000, CURRENT_DATE + 2, 'same_day', 'open'
    ),
    (
      manager_id, '[더미] 마포구 다세대 신축 터파기', 'civil', '017',
      '협소 골목 진입. 미니 장비 우선.',
      '서울 마포구 망원동', 37.5566, 126.9066,
      280000, CURRENT_DATE + 7, 'd3', 'open'
    ),
    (
      manager_id, '[더미] 용인 택지개발 구역 도로 절토', 'civil', '3w',
      '택지개발 지구 내 도로 절토 및 운반 작업입니다.',
      '경기 용인시 기흥구', 37.2752, 127.1146,
      520000, CURRENT_DATE + 1, 'd7', 'open'
    ),
    (
      manager_id, '[더미] 인천 주상복합 기초 공사', 'civil', '02',
      '지하 2층 규모 기초 굴착. 암반 구간 포함 가능성 있음.',
      '인천 남동구 논현동', 37.4152, 126.7378,
      430000, CURRENT_DATE + 4, 'd14', 'open'
    ),
    (
      manager_id, '[더미] 화성 산업단지 대형 굴착', 'civil', '8w',
      '산업단지 신규 부지 정지 및 굴착. 장거리 운반 포함.',
      '경기 화성시 봉담읍', 37.2142, 126.9815,
      750000, CURRENT_DATE + 10, 'd30', 'open'
    ),
    (
      manager_id, '[더미] 송파구 재건축 구역 터파기', 'civil', '035',
      '재건축 단지 내 지하주차장 굴착 작업.',
      '서울 송파구 잠실동', 37.5125, 127.1025,
      480000, CURRENT_DATE + 8, 'd7', 'open'
    ),
    (
      manager_id, '[더미] 부천 공동주택 부지 조성', 'civil', '6w',
      '연립주택 부지 성토 및 정지 작업.',
      '경기 부천시 원미구', 37.5034, 126.7660,
      390000, CURRENT_DATE + 3, 'd14', 'open'
    ),
    (
      manager_id, '[더미] 수원 아파트 단지 철거', 'demolition', '035',
      '구 아파트 단지 철거. 뿌레카 장착 필요.',
      '경기 수원시 팔달구', 37.2636, 127.0286,
      560000, CURRENT_DATE + 14, 'd7', 'open'
    ),

  -- ── 마감(closed) 일감 ──────────────────────────────────────
    (
      manager_id, '[더미] 은평구 단독주택 철거', 'demolition', '008',
      '2층 단독주택 철거. 인접 건물 보양 필수.',
      '서울 은평구 불광동', 37.6094, 126.9296,
      320000, CURRENT_DATE - 3, 'd3', 'closed'
    ),
    (
      manager_id, '[더미] 광진구 상가 리모델링 터파기', 'civil', '017',
      '지하 1층 추가 굴착. 협소 도심 현장.',
      '서울 광진구 구의동', 37.5479, 127.0913,
      260000, CURRENT_DATE - 5, 'same_day', 'closed'
    ),
    (
      manager_id, '[더미] 의정부 근린공원 조성 토공', 'civil', '3w',
      '공원 부지 성토 작업. 일반 토질.',
      '경기 의정부시 가능동', 37.7386, 127.0439,
      310000, CURRENT_DATE - 7, 'd7', 'closed'
    ),
    (
      manager_id, '[더미] 강동구 노후 건물 철거', 'demolition', '035',
      '4층 노후 상가 건물 철거. 석면 조사 완료.',
      '서울 강동구 천호동', 37.5382, 127.1238,
      490000, CURRENT_DATE - 2, 'd14', 'closed'
    );

  RAISE NOTICE '더미 일감 14개 삽입 완료 (소장 인증 업데이트 완료, manager_id: %)', manager_id;
END $$;
