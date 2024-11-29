# ShareNote - 원터치 노트 공유 플랫폼
Visit https://sharenote.kr/

- PIN을 통한 일회성 로그인
- 원터치 복사/붙혀넣기
- URL 자동 인식 및 연결


## Update Log
v1.0.0
베타테스트 오픈

v1.1.0
로직 변경 : Value 대신 ID 기반 동작 구현
노트 삭제 시 내용 동일한 노트 일괄 삭제되는 이슈 해결

v1.1.1
로그인 토큰 저장 세션 기한 변경

v1.1.2
클립보드 로직 변경
노트 중복 추가되는 현상 해결

v1.1.3
모바일 레이아웃에서 노트 수 화면 범위 초과 시 UI 망가지는 이슈 해결
노트 드래그 금지

v1.1.4
CSS 수정, Deprecated 코드 제거

v1.1.5
버튼 레이아웃 Inconsistency 이슈 해결

v1.1.6
removeButton 잘리는 이슈 해결

v1.1.7
User-Agent 분기 및 floatingButton 제거

v1.2.0
Redirect 분기 및 모달 팝업 추가
UI 이슈 해결, 기본 폰트 설정

v1.2.1
1세션 1계정 원칙 설정 : 로그인/로그아웃 기능 구현

v1.3.0
async 로직 추가
NoteID 데이터를 SetAttribute로 설정
클립보드 추가 시 Delay되는 이슈 수정

v1.3.1
모달 팝업 Fade 속성 추가
로그아웃 버튼 Fixed된 이슈 수정
입력값 Padding 제거

v1.3.2
세션당 최대 메모 수 제한 : 200개

v1.4.0
사이드바 메뉴 추가

v1.4.1
사이드바 외부 영역 탭 시 메인 화면 노출되도록 수정
사진 탭 시 새로고침 되는 이슈 수정

v1.4.2
메모 일괄삭제 기능 추가

v1.5.0
프론트엔드/백엔드 서버 변경
로고 변경
연락처 추가

v1.5.1
Line-Breaking된 텍스트 한 줄로 입출력되는 이슈 수정

v1.5.2
PIN 길이 제한 변경

v1.5.3
Textarea Grabber 삭제
모바일 메뉴 위치 변경

v1.6.0
timetable 테이블 추가, 로그인 시 timestamp 저장

v1.6.1
Parameter Manipulation 대응 보안패치

v1.6.2
SessionStorage 조작 대응 보안패치

v1.6.3
verify-pin 함수 비동기 처리

v1.6.4
Cloudflare 프록시 활성화

v1.7.0
IP 블랙리스트 추가

v1.7.1
IP 블랙리스트 파일로 저장

v1.7.2
PIN/노트 내용 조작 백엔드 대응

v1.8.0
1시간 단위 세션 만료 기능 추가

v1.9.0
URL 감지 기능 추가

v1.9.1
페이지 URI 변경

v1.9.2
전체삭제 기능 Delay 설정

v1.9.3
자바스크립트 통한 화면 크기 감지 기능 추가

v1.9.4
모바일/데스크탑 팝업 내용 분기

v1.10.0
SQL 인젝션 대응 변수 타입 설정

v1.10.1
Shift와 Enter 동시 입력 시 줄바꿈되도록 수정

v1.10.2
server_log 파일로 저장

v1.10.3
로그인 페이지 Enter키로 입력되도록 수정
노트 길이 제한 추가

v1.10.4
TextArea 늘릴 시 CSS 깨지는 이슈 수정

v1.11.0
튜토리얼 추가

v1.11.1
PIN 마스킹
