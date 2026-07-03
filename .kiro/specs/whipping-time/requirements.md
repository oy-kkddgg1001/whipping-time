# Requirements Document

## Introduction

Whipping Time은 프론트엔드 챕터에서 활용하는 주제 선정 도구입니다. 각 챕터 세션(1회, 2회, 3회...)마다 발표/토론 주제를 제안하고, 투표를 통해 다음 챕터의 주제를 선정합니다. React 기반 SPA로 개발되며, GitHub Discussions API를 통해 데이터를 관리하고, GitHub Pages로 배포됩니다. 읽기는 비로그인 상태에서 가능하며, 주제 생성 및 투표는 GitHub OAuth 로그인이 필요합니다.

## Glossary

- **App**: Whipping Time React 애플리케이션 전체 시스템
- **Chapter**: 프론트엔드 챕터의 한 회차 세션 (예: 1회, 2회, 3회)
- **Topic**: 챕터에서 다룰 주제 제안 항목 (GitHub Discussion으로 저장)
- **Topic_Type**: 주제의 유형 분류 (고민상담, 떠먹여 드림, 떠먹여 주세요)
- **Author**: 주제를 제출하는 사람 (GitHub 로그인 사용자, 익명 표시 선택 가능)
- **Assignee**: "떠먹여 주세요" 유형에서 지목된 발표 대상자
- **Vote**: 주제에 대한 떰업(👍) 투표 (GitHub Reaction으로 관리)
- **Topic_Form**: 주제를 작성하고 제출하는 폼 인터페이스
- **Topic_List**: 특정 챕터의 주제 목록을 표시하는 화면
- **Vote_Button**: 주제에 투표하기 위한 인터페이스 요소
- **Data_Store**: GitHub Discussions API 기반 데이터 저장소
- **GitHub_Auth**: GitHub OAuth를 통한 사용자 인증 시스템
- **Discussion_Category**: GitHub Discussions에서 챕터를 구분하기 위한 카테고리 또는 라벨

## Requirements

### Requirement 1: 챕터 관리

**User Story:** As a 챕터 운영자, I want 챕터 세션을 생성하고 관리할 수 있도록, so that 회차별로 주제를 분리하여 관리할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 챕터 목록을 회차 번호 기준 내림차순으로 표시한다
2. WHEN 새로운 챕터가 생성되면, THE App SHALL 기존 최대 챕터 번호에 1을 더한 번호를 자동 부여하고, 챕터 번호, 제목, 생성일을 포함한 챕터 데이터를 Data_Store에 저장한다
3. WHEN 사용자가 특정 챕터를 선택하면, THE App SHALL 해당 챕터에 속한 Topic_List를 표시한다
4. THE App SHALL 가장 높은 회차 번호를 가진 챕터를 활성 챕터로 지정하고, 챕터 목록에서 활성 챕터에 구별 가능한 라벨을 표시한다
5. IF 챕터 생성 시 제목이 비어 있으면, THEN THE App SHALL 챕터를 생성하지 않고 제목 입력이 필요하다는 안내 메시지를 표시한다
6. IF 챕터 생성 시 제목이 50자를 초과하면, THEN THE App SHALL 챕터를 생성하지 않고 제목 길이 초과를 알리는 안내 메시지를 표시한다

### Requirement 2: 주제 제출

**User Story:** As a 프론트엔드 챕터 멤버, I want 다음 챕터에서 다룰 주제를 제안할 수 있도록, so that 관심 있는 주제를 공유하고 논의할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 Topic_Form을 제출하면, THE App SHALL 타이틀(최대 100자), Topic_Type, 설명(description, 최대 500자)을 포함한 Topic 데이터를 생성한다
2. WHEN 사용자가 Topic_Form을 작성할 때, THE Topic_Form SHALL Topic_Type 선택 필드를 필수 입력으로 표시한다
3. THE Topic_Form SHALL 타이틀 필드를 필수 입력으로, 이유(reason) 필드를 선택 입력으로 제공한다
4. WHEN Topic_Type이 "떠먹여 주세요"로 선택되면, THE Topic_Form SHALL Assignee 입력 필드를 필수 입력으로 표시한다
5. WHEN Topic_Type이 "고민상담" 또는 "떠먹여 드림"으로 선택되면, THE Topic_Form SHALL Assignee 입력 필드를 숨긴다
6. WHEN 사용자가 Topic을 제출하면, THE App SHALL 해당 Topic을 현재 활성 챕터의 Topic_List에 추가한다
7. IF 필수 입력 필드가 비어 있는 상태로 제출을 시도하면, THEN THE App SHALL 제출을 차단하고 해당 필드에 유효성 검증 실패 메시지를 표시한다
8. WHEN Topic 제출이 성공하면, THE Topic_Form SHALL 모든 입력 필드를 초기화하고 제출 완료 피드백을 표시한다
9. IF 현재 활성 챕터가 존재하지 않으면, THEN THE App SHALL 주제 제출 버튼을 비활성화하고 챕터를 먼저 생성하라는 안내 메시지를 표시한다

### Requirement 3: 작성자 식별

**User Story:** As a 주제 제출자, I want 익명 또는 실명으로 주제를 제출할 수 있도록, so that 상황에 따라 신원 공개 여부를 선택할 수 있다.

#### Acceptance Criteria

1. THE Topic_Form SHALL "익명으로 표시" 체크박스를 제공하며, 기본값은 체크 해제(실명 표시) 상태이다
2. WHEN "익명으로 표시" 체크박스가 체크된 상태로 제출되면, THE App SHALL Author를 "익명"으로 표시하고 GitHub 사용자 정보를 화면에 노출하지 않는다
3. WHEN "익명으로 표시" 체크박스가 체크 해제된 상태로 제출되면, THE App SHALL 로그인된 GitHub 사용자의 닉네임을 Author로 표시한다
4. THE App SHALL 투표(Reaction)에 대해서는 익명 옵션을 제공하지 않으며, GitHub 계정 단위로 투표자가 자동 식별된다

### Requirement 4: 주제 유형 분류

**User Story:** As a 챕터 멤버, I want 주제의 유형을 분류할 수 있도록, so that 주제의 성격을 빠르게 파악할 수 있다.

#### Acceptance Criteria

1. THE App SHALL "고민상담", "떠먹여 드림", "떠먹여 주세요" 세 가지 Topic_Type을 제공한다
2. THE Topic_List SHALL 각 Topic에 Topic_Type을 시각적으로 구별 가능한 라벨(색상 또는 아이콘 차별화)로 표시한다
3. IF Topic_Type이 "떠먹여 주세요"인 경우, THEN THE Topic_List SHALL Assignee 정보를 함께 표시한다

### Requirement 5: 투표 기능

**User Story:** As a 챕터 멤버, I want 관심 있는 주제에 투표할 수 있도록, so that 다음 챕터에서 다룰 주제를 민주적으로 선정할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 각 Topic에 Vote_Button을 표시한다
2. WHEN 로그인된 사용자가 Vote_Button을 클릭하면, THE App SHALL GitHub Reaction API를 통해 해당 Topic(Discussion)에 👍 Reaction을 추가하고, 투표 수를 1 증가시키며, Vote_Button을 투표 완료 상태로 변경한다
3. WHEN 로그인된 사용자가 이미 투표한 Topic의 Vote_Button을 다시 클릭하면, THE App SHALL GitHub Reaction API를 통해 해당 👍 Reaction을 제거하고, 투표 수를 1 감소시키며, Vote_Button을 투표 전 상태로 변경한다
4. THE App SHALL GitHub 계정 단위로 하나의 Topic당 최대 1회 투표로 제한하며, 중복 투표 여부는 GitHub Reaction API 응답을 기준으로 판별한다
5. THE Topic_List SHALL Topic을 투표 수 기준 내림차순으로 정렬하는 옵션을 제공하며, 동일 투표 수인 경우 Topic 생성 시간 기준 오름차순으로 정렬한다
6. THE App SHALL 각 Topic의 현재 투표 수를 0 이상의 정수로 표시한다
7. IF 비로그인 사용자가 Vote_Button을 클릭하면, THEN THE App SHALL 투표를 수행하지 않고 GitHub 로그인이 필요하다는 안내 메시지를 표시한다

### Requirement 6: 데이터 저장

**User Story:** As a 시스템 운영자, I want GitHub Discussions API 기반으로 데이터를 관리할 수 있도록, so that 별도 서버 없이 GitHub 인프라를 활용하여 데이터를 저장하고 서비스할 수 있다.

#### Acceptance Criteria

1. THE Data_Store SHALL 챕터를 Discussion_Category 또는 Label로 구분하고, 각 Topic을 해당 챕터에 속하는 Discussion으로 저장한다
2. WHEN App이 로드되면, THE App SHALL GitHub Discussions API를 통해 챕터 및 Topic 데이터를 3초 이내에 읽어와 화면에 표시한다
3. THE Data_Store SHALL 각 Topic(Discussion)에 타이틀, Topic_Type, 설명, Author 정보, 익명 여부, 생성일을 포함하여 저장한다
4. IF App 로드 시 GitHub Discussions API 호출에 실패하면, THEN THE App SHALL 사용자에게 데이터 로드 실패를 알리는 에러 메시지를 표시하고, 재시도 수단을 제공한다
5. WHILE App이 GitHub Discussions API에서 데이터를 로드하는 중이면, THE App SHALL 로딩 상태 표시를 화면에 나타낸다
6. THE Data_Store SHALL 투표 데이터를 각 Discussion의 👍 Reaction 수로 관리하며, 별도의 투표 저장소를 사용하지 않는다

### Requirement 7: GitHub Pages 배포

**User Story:** As a 개발자, I want GitHub Pages로 앱을 배포할 수 있도록, so that 별도 인프라 비용 없이 서비스를 운영할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 정적 빌드 결과물(HTML, CSS, JS)을 단일 디렉토리에 생성하여 GitHub Pages에 배포 가능한 형태로 빌드된다
2. THE App SHALL GitHub Pages의 base path `/whipping-time/`을 모든 라우팅 및 정적 자원 참조 경로에 올바르게 적용한다
3. WHEN App이 GitHub Pages에서 로드되면, THE App SHALL 404.html 폴백 메커니즘을 통해 클라이언트 사이드 라우팅을 지원한다
4. WHEN 사용자가 브라우저에서 앱 내부 경로를 직접 입력하여 접근하면, THE App SHALL 해당 경로에 맞는 화면을 정상적으로 렌더링한다

### Requirement 8: 주제 목록 표시

**User Story:** As a 챕터 멤버, I want 제안된 주제 목록을 확인할 수 있도록, so that 어떤 주제들이 제안되었는지 한눈에 파악할 수 있다.

#### Acceptance Criteria

1. THE Topic_List SHALL 각 Topic의 타이틀, Topic_Type, Author, 투표 수를 최신 등록순으로 표시한다
2. WHEN 사용자가 Topic을 선택하면, THE App SHALL 해당 Topic의 상세 정보(설명, 이유, Assignee)를 표시하고 돌아가기 수단을 제공한다
3. THE Topic_List SHALL Topic_Type별 필터링 기능을 제공하며, "전체" 옵션 선택 시 모든 Topic을 표시한다
4. IF 선택한 챕터에 Topic이 없으면, THEN THE App SHALL 빈 상태 안내 메시지를 표시한다
5. IF 필터 적용 결과에 해당하는 Topic이 없으면, THEN THE App SHALL 필터 결과 없음 안내 메시지를 표시한다

### Requirement 9: 사용자 인터페이스 품질

**User Story:** As a 프론트엔드 개발자, I want 잘 갖춰진 UI/UX를 가진 서비스를 사용할 수 있도록, so that 프론트엔드 챕터의 도구답게 높은 완성도를 느낄 수 있다.

#### Acceptance Criteria

1. THE App SHALL 반응형 레이아웃을 제공하여 뷰포트 너비 360px 이상 768px 미만에서는 모바일 레이아웃으로, 768px 이상에서는 데스크톱 레이아웃으로 콘텐츠 잘림이나 가로 스크롤 없이 표시한다
2. THE App SHALL 정의된 디자인 토큰 세트(색상, 타이포그래피, 간격)를 모든 화면에 동일하게 적용하여, 화면 간 스타일 불일치가 없도록 한다
3. WHILE 데이터 요청이 300ms 이상 소요되는 동안, THE App SHALL 로딩 인디케이터를 표시한다
4. IF 데이터 요청이 실패하면, THEN THE App SHALL 실패 원인을 나타내는 에러 메시지와 재시도 옵션을 표시한다
5. THE App SHALL 모든 인터랙티브 요소에 대해 키보드만으로 접근 및 조작이 가능하도록 하고, 포커스 순서가 시각적 레이아웃 순서와 일치하도록 한다
6. THE App SHALL 모든 인터랙티브 요소에 스크린 리더가 인식할 수 있는 접근성 레이블을 제공하며, WCAG 2.1 Level AA 기준을 충족한다

### Requirement 10: GitHub OAuth 인증

**User Story:** As a 챕터 멤버, I want GitHub 계정으로 로그인할 수 있도록, so that 별도 회원가입 없이 기존 GitHub 계정을 활용하여 주제 생성 및 투표에 참여할 수 있다.

#### Acceptance Criteria

1. THE App SHALL GitHub OAuth를 통한 로그인 버튼을 제공하며, 로그인 성공 시 사용자의 GitHub 닉네임과 아바타를 헤더에 표시한다
2. THE App SHALL 비로그인 상태에서 챕터 목록 조회, Topic_List 조회, Topic 상세 조회를 허용한다
3. WHEN 비로그인 사용자가 주제 생성 또는 투표를 시도하면, THE App SHALL 해당 동작을 차단하고 GitHub 로그인이 필요하다는 안내와 로그인 버튼을 표시한다
4. WHEN 사용자가 로그인 버튼을 클릭하면, THE App SHALL GitHub OAuth 인증 플로우를 시작하고, 인증 완료 후 원래 페이지로 리다이렉트한다
5. THE App SHALL 로그인 상태를 세션 동안 유지하며, 로그아웃 버튼을 제공한다
6. WHEN 사용자가 로그아웃 버튼을 클릭하면, THE App SHALL 인증 토큰을 삭제하고 비로그인 상태로 전환한다
7. IF GitHub OAuth 인증 과정에서 오류가 발생하면, THEN THE App SHALL 인증 실패를 알리는 에러 메시지를 표시하고 재시도 수단을 제공한다
