// Phase 2: 익명 감정 커뮤니티 클라이언트

import { supabase } from './supabase.js';

export class AnonymousCommunity {
  constructor() {
    this.posts = [];
    this.myPosts = [];
    this.currentFilter = '';
    this.selectedEmotion = '';
    this.myAnonymousId = '';
    this.isLoading = false;

    this.initializeUI();
    this.loadPosts();
  }

  initializeUI() {
    this.setupTabNavigation();
    this.setupEventListeners();
    this.setupEmotionFilters();
  }

  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 활성 탭 변경
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // 탭별 데이터 로드
        if (targetTab === 'explore') {
          this.loadPosts();
        } else if (targetTab === 'my-posts') {
          this.loadMyPosts();
        }
      });
    });
  }

  setupEventListeners() {
    // 글 작성 버튼
    const submitBtn = document.getElementById('post-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', this.createPost.bind(this));
    }

    // 플로팅 작성 버튼
    const floatingBtn = document.getElementById('floating-compose');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', () => {
        this.switchToTab('compose');
      });
    }

    // 감정 선택 버튼들
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    emotionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        emotionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedEmotion = btn.dataset.emotion;
      });
    });

    // 더 보기 버튼
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', this.loadMorePosts.bind(this));
    }

    // 게시물 액션 이벤트 위임
    document.addEventListener('click', this.handlePostActions.bind(this));
  }

  setupEmotionFilters() {
    const filterBtns = document.querySelectorAll('.emotion-filter');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.emotion;
        this.loadPosts();
      });
    });
  }

  switchToTab(tabName) {
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabBtn) {
      tabBtn.click();
    }
  }

  async loadPosts() {
    if (this.isLoading) return;

    this.isLoading = true;
    const container = document.getElementById('posts-container');
    if (container) {
      container.innerHTML = '<div class="loading"><p>게시물을 불러오는 중...</p></div>';
    }

    try {
      // 로그인 상태 확인 (옵셔널)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 로컬 개발 환경 감지 또는 로그인하지 않은 상태
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:' ||
                     !token; // 로그인하지 않은 경우 로컬 모드 사용

      if (isLocal) {
        this.posts = this.generateMockPosts();
        this.myAnonymousId = token ? 'anon_demo_user' : 'anon_guest_' + Math.random().toString(36).substr(2, 8);
        this.displayPosts();
        this.updateAnonymousId();
        return;
      }

      const params = new URLSearchParams({
        action: 'posts',
        limit: '10'
      });

      if (this.currentFilter) {
        params.append('emotion', this.currentFilter);
      }

      const response = await fetch(`/.netlify/functions/anonymous-community?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('게시물 로드 실패');
      }

      const data = await response.json();
      this.posts = data.posts || [];
      this.myAnonymousId = data.user_anonymous_id || '';
      this.displayPosts();
      this.updateAnonymousId();

    } catch (error) {
      console.error('게시물 로드 오류:', error);
      this.showNotification('게시물을 불러오는데 실패했습니다.', 'error');
      this.displayError('게시물을 불러올 수 없습니다.');
    } finally {
      this.isLoading = false;
    }
  }

  generateMockPosts() {
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
    const contents = [
      '오늘 정말 좋은 일이 있었어요. 힘든 시기를 보내고 있는 분들도 희망을 잃지 마세요.',
      '요즘 너무 외로워요. 비슷한 감정을 느끼는 분들이 계실까요?',
      '불안한 마음이 들 때 어떻게 대처하시나요? 좋은 방법이 있다면 공유해주세요.',
      '작은 것에도 감사함을 느끼는 요즘입니다. 여러분은 어떤 것에 감사하시나요?',
      '힘든 하루였지만 내일은 더 나아질 거라고 믿어요.',
      '스트레스가 너무 많아서 잠을 못 자고 있어요. 어떻게 해야 할까요?'
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: `mock_${i}`,
      anonymous_id: i % 3 === 0 ? 'anon_demo_user' : `anon_user_${i}`,
      emotion_category: emotions[i % emotions.length],
      content: contents[i % contents.length],
      tags: ['일상', '감정', '공감'],
      is_seeking_advice: i % 3 === 0,
      like_count: Math.floor(Math.random() * 20),
      comment_count: Math.floor(Math.random() * 10),
      view_count: Math.floor(Math.random() * 100) + 20,
      created_at: new Date(Date.now() - i * 3600000).toISOString()
    }));
  }

  updateAnonymousId() {
    const idElement = document.getElementById('my-anonymous-id');
    if (idElement) {
      idElement.textContent = this.myAnonymousId || '알 수 없음';
    }
  }

  displayPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>표시할 게시물이 없습니다.</p>
          <p>첫 번째 글을 작성해보세요!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
  }

  renderPostCard(post) {
    const timeAgo = this.getTimeAgo(post.created_at);
    const isMyPost = post.anonymous_id === this.myAnonymousId;
    const emotionInfo = this.getEmotionInfo(post.emotion_category);

    return `
      <div class="post-card ${post.is_seeking_advice ? 'seeking-advice' : ''}" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-author">
            <div class="anonymous-avatar">${post.anonymous_id.slice(-2).toUpperCase()}</div>
            <div>
              <div style="font-weight: bold; color: ${isMyPost ? '#667eea' : '#333'};">
                ${isMyPost ? '나' : post.anonymous_id}
              </div>
              <div class="post-emotion" style="background-color: ${emotionInfo.color}20; color: ${emotionInfo.color};">
                ${emotionInfo.icon} ${emotionInfo.name}
              </div>
            </div>
          </div>
          <div class="post-meta">
            <div>${timeAgo}</div>
            ${post.is_seeking_advice ? '<div style="color: #ff9f40;">💡 조언 구함</div>' : ''}
          </div>
        </div>

        <div class="post-content">${post.content}</div>

        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}

        <div class="post-actions">
          <div class="post-stats">
            <div class="stat-item">
              <span>👁️</span>
              <span>${post.view_count || 0}</span>
            </div>
            <div class="stat-item">
              <span>❤️</span>
              <span>${post.like_count || 0}</span>
            </div>
            <div class="stat-item">
              <span>💬</span>
              <span>${post.comment_count || 0}</span>
            </div>
          </div>

          <div class="post-buttons">
            <button class="action-btn like-btn" data-action="like" data-post-id="${post.id}">
              ❤️ 좋아요
            </button>
            <button class="action-btn comment-btn" data-action="comment" data-post-id="${post.id}">
              💬 댓글
            </button>
          </div>
        </div>

        <div class="comments-section" id="comments-${post.id}">
          <textarea class="comment-input" placeholder="따뜻한 댓글을 남겨주세요..." data-post-id="${post.id}"></textarea>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
            <button class="btn btn-sm btn-primary comment-submit-btn" data-post-id="${post.id}">댓글 작성</button>
          </div>
          <div class="comments-list" id="comments-list-${post.id}">
            <!-- 댓글들이 여기에 로드됩니다 -->
          </div>
        </div>
      </div>
    `;
  }

  getEmotionInfo(emotionKey) {
    const emotions = {
      joy: { name: '기쁨', icon: '😄', color: '#74c0fc' },
      sadness: { name: '슬픔', icon: '😢', color: '#91a7ff' },
      anxiety: { name: '불안', icon: '😰', color: '#ffa8a8' },
      anger: { name: '분노', icon: '😠', color: '#ff8787' },
      contentment: { name: '만족', icon: '😊', color: '#69db7c' },
      loneliness: { name: '외로움', icon: '😞', color: '#c2c2f0' },
      hope: { name: '희망', icon: '🌟', color: '#ffd43b' },
      frustration: { name: '좌절', icon: '😤', color: '#ffb366' },
      calm: { name: '평온', icon: '😌', color: '#91c7f2' },
      confused: { name: '혼란', icon: '😕', color: '#d6a7ff' }
    };
    return emotions[emotionKey] || { name: emotionKey, icon: '😐', color: '#868e96' };
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '방금 전';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}분 전`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}시간 전`;
    } else {
      return `${Math.floor(diff / day)}일 전`;
    }
  }

  async handlePostActions(event) {
    const action = event.target.dataset.action;
    const postId = event.target.dataset.postId;

    if (!action || !postId) return;

    if (action === 'like') {
      await this.likePost(postId);
    } else if (action === 'comment') {
      this.toggleComments(postId);
    }

    // 댓글 작성 버튼
    if (event.target.classList.contains('comment-submit-btn')) {
      await this.submitComment(postId);
    }
  }

  async likePost(postId) {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        // 로컬에서는 UI만 업데이트
        const likeBtn = document.querySelector(`[data-action="like"][data-post-id="${postId}"]`);
        if (likeBtn) {
          likeBtn.classList.toggle('liked');
          const statElement = likeBtn.closest('.post-card').querySelector('.stat-item:nth-child(2) span:last-child');
          if (statElement) {
            const currentLikes = parseInt(statElement.textContent) || 0;
            statElement.textContent = currentLikes + 1;
          }
        }
        this.showNotification('좋아요를 눌렀습니다!', 'success');
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'like_post',
          postId: postId
        })
      });

      if (!response.ok) {
        throw new Error('좋아요 실패');
      }

      const data = await response.json();

      // UI 업데이트
      const likeBtn = document.querySelector(`[data-action="like"][data-post-id="${postId}"]`);
      if (likeBtn) {
        likeBtn.classList.add('liked');
        const statElement = likeBtn.closest('.post-card').querySelector('.stat-item:nth-child(2) span:last-child');
        if (statElement) {
          statElement.textContent = data.new_like_count;
        }
      }

      this.showNotification('좋아요를 눌렀습니다!', 'success');

    } catch (error) {
      console.error('좋아요 오류:', error);
      this.showNotification('좋아요에 실패했습니다.', 'error');
    }
  }

  toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
      commentsSection.classList.toggle('show');

      if (commentsSection.classList.contains('show')) {
        this.loadComments(postId);
      }
    }
  }

  async loadComments(postId) {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      // 로컬 환경에서는 모의 댓글 표시
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        const mockComments = [
          {
            id: '1',
            anonymous_id: 'anon_user_1',
            content: '정말 공감됩니다. 함께 힘내요!',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        this.displayComments(postId, mockComments);
        return;
      }

      const response = await fetch(`/.netlify/functions/anonymous-community?action=comments&postId=${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('댓글 로드 실패');
      }

      const data = await response.json();
      this.displayComments(postId, data.comments || []);

    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  }

  displayComments(postId, comments) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;

    if (comments.length === 0) {
      commentsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">첫 번째 댓글을 남겨주세요!</p>';
      return;
    }

    commentsList.innerHTML = comments.map(comment => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${comment.anonymous_id === this.myAnonymousId ? '나' : comment.anonymous_id}</span>
          <span class="comment-time">${this.getTimeAgo(comment.created_at)}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
      </div>
    `).join('');
  }

  async submitComment(postId) {
    const commentInput = document.querySelector(`textarea[data-post-id="${postId}"]`);
    if (!commentInput) return;

    const content = commentInput.value.trim();
    if (!content) {
      this.showNotification('댓글 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        commentInput.value = '';
        this.showNotification('댓글이 작성되었습니다!', 'success');
        // 댓글 목록 새로고침
        setTimeout(() => this.loadComments(postId), 500);
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_comment',
          postId: postId,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error('댓글 작성 실패');
      }

      commentInput.value = '';
      this.showNotification('댓글이 작성되었습니다!', 'success');
      this.loadComments(postId);

    } catch (error) {
      console.error('댓글 작성 오류:', error);
      this.showNotification('댓글 작성에 실패했습니다.', 'error');
    }
  }

  async createPost() {
    // 로그인 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      this.showNotification('글 작성은 로그인 후 이용할 수 있습니다.', 'warning');
      window.location.href = 'login.html';
      return;
    }

    const content = document.getElementById('new-post-content').value.trim();
    const seekingAdvice = document.getElementById('seeking-advice').checked;

    if (!content) {
      this.showNotification('글 내용을 입력해주세요.', 'warning');
      return;
    }

    if (!this.selectedEmotion) {
      this.showNotification('현재 감정을 선택해주세요.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('post-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '게시 중...';
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        // 입력 필드 초기화
        document.getElementById('new-post-content').value = '';
        document.getElementById('seeking-advice').checked = false;
        document.querySelectorAll('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
        this.selectedEmotion = '';

        this.showNotification('글이 성공적으로 게시되었습니다!', 'success');
        this.switchToTab('explore');
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_post',
          content: content,
          emotion_category: this.selectedEmotion,
          is_seeking_advice: seekingAdvice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시 실패');
      }

      // 성공 처리
      document.getElementById('new-post-content').value = '';
      document.getElementById('seeking-advice').checked = false;
      document.querySelectorAll('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
      this.selectedEmotion = '';

      this.showNotification('글이 성공적으로 게시되었습니다!', 'success');
      this.switchToTab('explore');
      this.loadPosts(); // 새 글 포함하여 목록 새로고침

    } catch (error) {
      console.error('게시물 작성 오류:', error);
      this.showNotification(error.message || '게시에 실패했습니다.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '게시하기';
      }
    }
  }

  async loadMyPosts() {
    const container = document.getElementById('my-posts-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><p>내 글을 불러오는 중...</p></div>';

    try {
      // 로그인 상태 확인 (옵셔널)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 로컬 환경이거나 로그인하지 않은 경우 모의 데이터 사용
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:' ||
                     !token;

      if (isLocal) {
        this.myPosts = this.generateMockPosts().filter(post =>
          post.anonymous_id === (this.myAnonymousId || 'anon_demo_user'));
        this.displayMyPosts();
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community?action=my_posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('내 글 로드 실패');
      }

      const data = await response.json();
      this.myPosts = data.posts || [];
      this.displayMyPosts();

    } catch (error) {
      console.error('내 글 로드 오류:', error);
      this.showNotification('내 글을 불러오는데 실패했습니다.', 'error');
      this.displayError('내 글을 불러올 수 없습니다.', 'my-posts-container');
    }
  }

  displayMyPosts() {
    const container = document.getElementById('my-posts-container');
    if (!container) return;

    if (this.myPosts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>아직 작성한 글이 없습니다.</p>
          <p>첫 번째 글을 작성해보세요!</p>
          <button class="btn btn-primary" onclick="anonymousCommunity.switchToTab('compose')">글 작성하기</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.myPosts.map(post => this.renderPostCard(post)).join('');
  }

  displayError(message, containerId = 'posts-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="no-posts">
          <p>${message}</p>
          <button class="btn btn-outline" onclick="location.reload()">새로고침</button>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async loadMorePosts() {
    if (this.isLoading) return;

    this.isLoading = true;
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.textContent = '로딩 중...';
      loadMoreBtn.disabled = true;
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 더 보기 기능 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        // 추가 모의 데이터 생성
        const moreMockPosts = this.generateMockPosts().slice(5, 10);
        this.posts.push(...moreMockPosts);
        this.displayPosts();

        // 더 이상 로드할 데이터가 없다고 가정
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
          loadMoreContainer.style.display = 'none';
        }
        return;
      }

      const offset = this.posts.length;
      const url = `/.netlify/functions/anonymous-community?action=get_posts&offset=${offset}&limit=10${this.currentFilter ? `&emotion=${this.currentFilter}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('게시물 로딩에 실패했습니다.');
      }

      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        this.posts.push(...data.posts);
        this.displayPosts();

        // 더 이상 로드할 데이터가 없으면 버튼 숨기기
        if (data.posts.length < 10) {
          const loadMoreContainer = document.getElementById('load-more-container');
          if (loadMoreContainer) {
            loadMoreContainer.style.display = 'none';
          }
        }
      } else {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
          loadMoreContainer.style.display = 'none';
        }
        this.showNotification('더 이상 게시물이 없습니다.', 'info');
      }

    } catch (error) {
      console.error('더 보기 로딩 오류:', error);
      this.showNotification('게시물 로딩에 실패했습니다.', 'error');
    } finally {
      this.isLoading = false;
      if (loadMoreBtn) {
        loadMoreBtn.textContent = '더 보기';
        loadMoreBtn.disabled = false;
      }
    }
  }
}

// 전역으로 내보내기
window.AnonymousCommunity = AnonymousCommunity;