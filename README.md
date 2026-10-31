# 나의 할 일 목록 (My Todo App)

HTML, CSS, JavaScript만으로 만든 할 일 관리 웹 앱입니다. 설치나 빌드 없이 브라우저에서 바로 실행됩니다.

## 주요 기능

- **할 일 추가** — 입력 후 `추가` 버튼 또는 Enter 키로 등록 (빈 값·중복 항목은 등록되지 않음)
- **완료 체크** — 체크박스로 완료 / 미완료 전환
- **삭제** — `×` 버튼으로 바로 삭제
- **필터** — 전체 / 진행중 / 완료 항목만 골라 보기
- **진행률 표시** — 오늘 날짜와 함께 완료 비율을 퍼센트와 진행률 바로 표시
- **보관함** — 완료된 항목을 보관함으로 옮기고, 필요하면 다시 복원하거나 영구 삭제
- **자동 저장** — LocalStorage에 저장되어 새로고침해도 목록이 유지됨
- **다크 모드 · 반응형** — 시스템 다크 모드 설정과 모바일 화면에 맞춰 자동 조정

## 실행 방법

```bash
git clone https://github.com/hmban-web/my-todo-app.git
cd my-todo-app
```

`index.html` 파일을 브라우저로 열면 됩니다.

## 파일 구성

| 파일 | 설명 |
| --- | --- |
| `index.html` | 화면 구조 (할 일 카드, 보관함 카드) |
| `style.css` | 스타일 (라이트/다크 모드, 반응형 레이아웃) |
| `main.js` | 동작 (추가·완료·삭제·필터·보관함, LocalStorage 저장) |

## 사용 기술

- HTML5 / CSS3 / Vanilla JavaScript
- [Pretendard](https://github.com/orioncactus/pretendard) 폰트 (인터넷 연결이 없으면 시스템 폰트로 대체)
