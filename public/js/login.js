import { supabase } from './supabase.js';

// 일반 로그인
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('로그인 실패: ' + error.message);
    return;
  }

  // 로그인 성공 → 토큰 저장 + 페이지 이동
  localStorage.setItem('supabase_token', data.session.access_token);
  location.href = 'dashboard.html';
});

// 테스트 계정 로그인
document.getElementById('test-login-btn').addEventListener('click', async () => {
  const testEmail = 'test@test.com';
  const testPassword = 'test1234';

  // 로딩 표시
  const btn = document.getElementById('test-login-btn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>⏳</span><span>로그인 중...</span></span>';
  btn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      alert('테스트 계정 로그인 실패: ' + error.message);
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      return;
    }

    // 로그인 성공
    localStorage.setItem('supabase_token', data.session.access_token);

    // 성공 피드백
    btn.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>✅</span><span>로그인 성공!</span></span>';

    // 대시보드로 이동
    setTimeout(() => {
      location.href = 'dashboard.html';
    }, 500);
  } catch (err) {
    alert('오류가 발생했습니다: ' + err.message);
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
});
