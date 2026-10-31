// ===== 상태 =====
// 할 일 목록 (LocalStorage에 저장되어 새로고침해도 유지됨)
// 각 항목: { id: 숫자, text: 내용, completed: 완료 여부 }
let todos = [];

// 보관함: 정리된 완료 항목 (영구 삭제 전까지 따로 보관)
// 각 항목: { id: 숫자, text: 내용, completed: true, archivedAt: 보관한 시각(ISO 문자열) }
let archived = [];

let nextId = 1;

// 현재 선택된 필터: 'all'(전체) / 'active'(진행중) / 'completed'(완료)
let currentFilter = 'all';

// LocalStorage에 저장할 때 사용하는 키 이름
const STORAGE_KEY = 'todos';
const ARCHIVE_KEY = 'archivedTodos';

// 필터별 표시 조건
const FILTERS = {
  all: () => true,
  active: (t) => !t.completed,
  completed: (t) => t.completed,
};

// 목록이 비었을 때 필터별 안내 문구
const EMPTY_MESSAGES = {
  all: '아직 할 일이 없습니다.',
  active: '진행중인 할 일이 없습니다.',
  completed: '완료된 할 일이 없습니다.',
};

// ===== 화면 요소 가져오기 =====
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const totalCount = document.getElementById('total-count');
const doneCount = document.getElementById('done-count');
const filterBtns = document.querySelectorAll('.filter-btn');
const archiveCompletedBtn = document.getElementById('archive-completed-btn');
const todayEl = document.getElementById('today');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// 보관함 카드 요소
const archiveList = document.getElementById('archive-list');
const archiveCount = document.getElementById('archive-count');
const clearArchiveBtn = document.getElementById('clear-archive-btn');

// ===== 저장 / 불러오기 =====

// 목록 하나를 LocalStorage에 저장
function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    // 저장 공간이 꽉 찼거나 브라우저가 저장을 막은 경우 — 앱은 계속 동작
    console.warn('데이터를 저장하지 못했습니다.', error);
  }
}

// LocalStorage에서 목록 하나 불러오기 (없거나 손상된 경우 빈 배열)
function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (t) => t && typeof t.id === 'number' && typeof t.text === 'string'
    );
  } catch (error) {
    console.warn('저장된 데이터를 불러오지 못했습니다.', error);
    return [];
  }
}

// 할 일 목록과 보관함을 모두 저장
function saveAll() {
  saveList(STORAGE_KEY, todos);
  saveList(ARCHIVE_KEY, archived);
}

// 할 일 목록과 보관함을 모두 불러오기
function loadAll() {
  todos = loadList(STORAGE_KEY);
  archived = loadList(ARCHIVE_KEY);

  // 다음 id는 두 목록의 id 중 가장 큰 값 + 1 (보관함으로 옮겨도 id가 겹치지 않도록)
  nextId = [...todos, ...archived].reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

// 변경 사항을 저장하고 화면을 다시 그리기 (추가/삭제/완료/보관 시 호출)
function update() {
  saveAll();
  render();
}

// ===== 화면 그리기 =====

// 삭제(×) 버튼 만들기
function createDeleteButton(label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'delete-btn';
  btn.setAttribute('aria-label', label);
  btn.textContent = '×';
  return btn;
}

// 할 일 하나를 <li> 요소로 만들기
function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = todo.id;
  if (todo.completed) li.classList.add('completed');

  // 완료 체크박스
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'todo-check';
  check.checked = todo.completed;
  check.setAttribute('aria-label', '완료 표시');

  // 할 일 내용 (textContent 사용 — 입력값이 HTML로 해석되지 않도록)
  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;

  li.append(check, text, createDeleteButton('삭제'));
  return li;
}

// 보관 시각을 "10. 29. 오후 02:30" 형태로 표시
function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 보관된 항목 하나를 <li> 요소로 만들기
function createArchiveItem(item) {
  const li = document.createElement('li');
  li.className = 'todo-item archive-item';
  li.dataset.id = item.id;

  // 완료 표시 아이콘
  const mark = document.createElement('span');
  mark.className = 'archive-mark';
  mark.textContent = '✓';

  // 내용 + 보관 시각
  const body = document.createElement('div');
  body.className = 'archive-body';

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = item.text;

  const date = document.createElement('span');
  date.className = 'archive-date';
  date.textContent = formatDate(item.archivedAt);

  body.append(text, date);

  // 복원 버튼 (할 일 목록으로 되돌리기)
  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.className = 'restore-btn';
  restoreBtn.textContent = '복원';

  li.append(mark, body, restoreBtn, createDeleteButton('영구 삭제'));
  return li;
}

// 배열 내용대로 화면 전체를 다시 그리기
// (표시할 항목이 없으면 목록이 비어 CSS가 data-empty 안내 문구를 표시함)
function render() {
  // --- 할 일 카드 (현재 필터에 맞는 항목만) ---
  const visible = todos.filter(FILTERS[currentFilter]);
  todoList.replaceChildren(...visible.map(createTodoItem));
  todoList.dataset.empty = EMPTY_MESSAGES[currentFilter];

  // 현재 선택된 필터 버튼 강조
  filterBtns.forEach((btn) => {
    const selected = btn.dataset.filter === currentFilter;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-pressed', selected);
  });

  // 할 일 개수 표시
  const completedCount = todos.filter((t) => t.completed).length;
  totalCount.textContent = todos.length;
  doneCount.textContent = completedCount;

  // 진행률 (완료 비율) 표시
  const percent = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;

  // 완료된 항목이 없으면 보관 버튼 비활성화
  archiveCompletedBtn.disabled = completedCount === 0;

  // --- 보관함 카드 (최근에 보관한 항목이 위로) ---
  const sorted = [...archived].sort((a, b) =>
    String(b.archivedAt).localeCompare(String(a.archivedAt))
  );
  archiveList.replaceChildren(...sorted.map(createArchiveItem));
  archiveCount.textContent = archived.length;
  clearArchiveBtn.disabled = archived.length === 0;
}

// ===== 기능 =====

// 할 일 추가
function addTodo() {
  const text = todoInput.value.trim();

  // 빈 값(공백만 입력한 경우 포함)이면 알림
  if (text === '') {
    alert('할 일을 입력하세요');
    todoInput.focus();
    return;
  }

  // 이미 같은 내용의 할 일이 있으면 알림 (보관함에 있는 항목은 제외)
  if (todos.some((t) => t.text === text)) {
    alert('이미 등록된 할 일입니다');
    todoInput.focus();
    return;
  }

  todos.push({ id: nextId++, text, completed: false });

  // 입력창을 비우고 바로 다음 할 일을 입력할 수 있게 포커스 유지
  todoInput.value = '';
  todoInput.focus();
  update();
}

// 완료 / 미완료 토글
function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  update();
}

// 할 일 삭제 (× 버튼 — 보관함을 거치지 않고 바로 삭제)
function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  update();
}

// 완료된 항목을 보관함으로 옮기기
function archiveCompleted() {
  const now = new Date().toISOString();
  const done = todos.filter((t) => t.completed);

  archived.push(...done.map((t) => ({ ...t, archivedAt: now })));
  todos = todos.filter((t) => !t.completed);
  update();
}

// 보관된 항목을 할 일 목록으로 복원 (진행중 상태로 되돌림)
function restoreTodo(id) {
  const item = archived.find((t) => t.id === id);
  if (!item) return;

  // 같은 내용의 할 일이 이미 목록에 있으면 복원하지 않음
  if (todos.some((t) => t.text === item.text)) {
    alert('이미 등록된 할 일입니다');
    return;
  }

  archived = archived.filter((t) => t.id !== id);
  todos.push({ id: item.id, text: item.text, completed: false });
  update();
}

// 보관된 항목 하나를 영구 삭제
function deleteArchived(id) {
  archived = archived.filter((t) => t.id !== id);
  update();
}

// 보관함 비우기 (되돌릴 수 없으므로 한 번 더 확인)
function clearArchive() {
  if (archived.length === 0) return;
  if (!confirm(`보관된 항목 ${archived.length}개를 영구 삭제할까요?`)) return;
  archived = [];
  update();
}

// 필터 변경 (필터는 보기 방식일 뿐이므로 저장하지 않고 화면만 다시 그림)
function setFilter(filter) {
  if (!FILTERS[filter]) return;
  currentFilter = filter;
  render();
}

// 이벤트가 발생한 요소가 속한 항목의 id 구하기
function getTodoId(element) {
  const li = element.closest('.todo-item');
  return li ? Number(li.dataset.id) : null;
}

// ===== 앱 초기화 =====
function initApp() {
  // 추가 버튼 클릭 시 추가
  addBtn.addEventListener('click', addTodo);

  // Enter 키로도 추가
  // (한글 입력 중 Enter는 글자 조합 확정용이므로 isComposing 일 때는 무시 — 중복 추가 방지)
  todoInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) {
      addTodo();
    }
  });

  // 체크박스 변경 → 완료 토글 (목록에 한 번만 등록하는 이벤트 위임)
  todoList.addEventListener('change', (event) => {
    if (!event.target.classList.contains('todo-check')) return;
    const id = getTodoId(event.target);
    if (id !== null) toggleTodo(id);
  });

  // 삭제 버튼 클릭 → 항목 제거
  todoList.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.delete-btn');
    if (!deleteBtn) return;
    const id = getTodoId(deleteBtn);
    if (id !== null) deleteTodo(id);
  });

  // 필터 버튼 클릭 → 해당 항목만 표시
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // 완료 항목 보관 버튼
  archiveCompletedBtn.addEventListener('click', archiveCompleted);

  // 보관함: 복원 / 영구 삭제 (이벤트 위임)
  archiveList.addEventListener('click', (event) => {
    const id = getTodoId(event.target);
    if (id === null) return;
    if (event.target.closest('.restore-btn')) restoreTodo(id);
    else if (event.target.closest('.delete-btn')) deleteArchived(id);
  });

  // 보관함 비우기 버튼
  clearArchiveBtn.addEventListener('click', clearArchive);

  // 오늘 날짜 표시 (예: "10월 29일 목요일")
  todayEl.textContent = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 저장된 할 일과 보관함을 불러와서 화면에 표시
  loadAll();
  render();
}

// 페이지가 로드되면 앱 초기화
initApp();
