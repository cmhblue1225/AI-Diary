// Phase 2: 전문가 상담 매칭 시스템 클라이언트

export class ExpertConsultation {
  constructor() {
    this.experts = [];
    this.myConsultations = [];
    this.userNeeds = null;
    this.selectedExpert = null;

    this.initializeUI();
    this.loadMyConsultations();
    this.loadExperts();
  }

  initializeUI() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 요구사항 분석 버튼
    const analyzeBtn = document.getElementById('analyze-needs-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', this.analyzeUserNeeds.bind(this));
    }

    // 모달 관련 이벤트
    const bookingModal = document.getElementById('booking-modal');
    const closeBtn = bookingModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-booking-btn');
    const confirmBtn = document.getElementById('confirm-booking-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.hideBookingModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideBookingModal());
    if (confirmBtn) confirmBtn.addEventListener('click', this.confirmBooking.bind(this));

    // 모달 외부 클릭 시 닫기
    if (bookingModal) {
      bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) this.hideBookingModal();
      });
    }

    // 전문가 카드 클릭 이벤트 위임
    document.addEventListener('click', this.handleExpertActions.bind(this));
  }

  async analyzeUserNeeds() {
    const analyzeBtn = document.getElementById('analyze-needs-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = '🧠 AI 분석 중...';
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 개발 환경 감지
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        this.userNeeds = this.generateMockUserNeeds();
        this.displayUserNeeds(this.userNeeds);
        this.loadMatchingExperts();
        this.showNotification('상담 요구사항 분석이 완료되었습니다! (로컬 모드)', 'success');
        return;
      }

      const response = await fetch('/.netlify/functions/expert-matching?action=analyze_needs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석 실패');
      }

      const data = await response.json();
      this.userNeeds = data.user_needs;
      this.experts = data.matching_experts || [];

      this.displayUserNeeds(this.userNeeds);
      this.displayExperts();
      this.showNotification('상담 요구사항 분석이 완료되었습니다!', 'success');

    } catch (error) {
      console.error('요구사항 분석 오류:', error);
      this.showNotification(error.message || '요구사항 분석에 실패했습니다.', 'error');
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '📊 내 상담 요구사항 분석하기';
      }
    }
  }

  generateMockUserNeeds() {
    return {
      urgency_level: 'medium',
      primary_concerns: ['불안', '스트레스', '대인관계'],
      recommended_specializations: ['불안장애', '인지행동치료', '스트레스 관리'],
      consultation_type: 'video_call',
      session_frequency: 'weekly',
      estimated_duration: '중기(3-6개월)',
      support_level_needed: 'moderate',
      personality_match: '공감적',
      preparation_notes: '최근 불안감이 증가하고 있으며, 대인관계에서 어려움을 겪고 있습니다.'
    };
  }

  displayUserNeeds(needs) {
    const container = document.getElementById('needs-analysis-result');
    if (!container) return;

    const urgencyColor = this.getUrgencyColor(needs.urgency_level);
    const urgencyText = this.getUrgencyText(needs.urgency_level);

    container.innerHTML = `
      <div class="needs-analysis">
        <h4>📋 분석 결과</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
          <div>
            <strong>🚨 긴급도:</strong>
            <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyText}</span>
          </div>
          <div>
            <strong>🎯 주요 관심사:</strong>
            <span>${needs.primary_concerns?.join(', ') || '없음'}</span>
          </div>
          <div>
            <strong>👨‍⚕️ 추천 전문분야:</strong>
            <span>${needs.recommended_specializations?.join(', ') || '일반상담'}</span>
          </div>
          <div>
            <strong>💬 권장 상담 방식:</strong>
            <span>${this.getConsultationTypeText(needs.consultation_type)}</span>
          </div>
          <div>
            <strong>📅 상담 주기:</strong>
            <span>${this.getFrequencyText(needs.session_frequency)}</span>
          </div>
          <div>
            <strong>⏳ 예상 기간:</strong>
            <span>${needs.estimated_duration || '상담 후 결정'}</span>
          </div>
        </div>

        <div style="margin-top: 15px; padding: 15px; background: #f1f3f4; border-radius: 8px;">
          <strong>📝 상담 준비 노트:</strong>
          <p style="margin: 8px 0 0 0; line-height: 1.5;">${needs.preparation_notes || '특별한 준비사항이 없습니다.'}</p>
        </div>
      </div>
    `;

    container.style.display = 'block';
  }

  getUrgencyColor(level) {
    switch (level) {
      case 'low': return '#51cf66';
      case 'medium': return '#ffd43b';
      case 'high': return '#ff8787';
      case 'critical': return '#ff6b6b';
      default: return '#868e96';
    }
  }

  getUrgencyText(level) {
    switch (level) {
      case 'low': return '낮음';
      case 'medium': return '보통';
      case 'high': return '높음';
      case 'critical': return '매우 높음';
      default: return '알 수 없음';
    }
  }

  getConsultationTypeText(type) {
    switch (type) {
      case 'text_chat': return '💬 텍스트 채팅';
      case 'voice_call': return '📞 음성 통화';
      case 'video_call': return '📹 화상 통화';
      default: return type;
    }
  }

  getFrequencyText(frequency) {
    switch (frequency) {
      case 'weekly': return '주 1회';
      case 'biweekly': return '2주 1회';
      case 'monthly': return '월 1회';
      default: return frequency;
    }
  }

  async loadMatchingExperts() {
    // 로컬 환경에서 모의 전문가 데이터 생성
    this.experts = this.generateMockExperts();
    this.displayExperts();
  }

  generateMockExperts() {
    return [
      {
        id: '1',
        expert_type: 'psychologist',
        specializations: ['불안장애', '인지행동치료', '스트레스 관리'],
        experience_years: 8,
        bio: '불안장애와 스트레스 관리 전문가로 8년간 임상경험을 가지고 있습니다. 인지행동치료를 통해 많은 내담자들이 일상에서의 불안을 극복할 수 있도록 도와드리고 있습니다.',
        consultation_fee: 80000,
        rating: 4.8,
        total_consultations: 156,
        is_active: true,
        match_score: 92,
        match_reasons: ['전문분야 일치', '풍부한 경험', '높은 평점']
      },
      {
        id: '2',
        expert_type: 'psychologist',
        specializations: ['대인관계', '자존감 향상', '감정조절'],
        experience_years: 5,
        bio: '대인관계와 자존감 문제에 특화된 상담사입니다. 따뜻하고 공감적인 접근으로 내담자가 자신의 감정을 이해하고 건강한 관계를 형성할 수 있도록 돕습니다.',
        consultation_fee: 70000,
        rating: 4.9,
        total_consultations: 89,
        is_active: true,
        match_score: 87,
        match_reasons: ['전문분야 일치', '높은 평점', '공감적 접근']
      },
      {
        id: '3',
        expert_type: 'psychologist',
        specializations: ['우울증', '트라우마', '심리치료'],
        experience_years: 12,
        bio: '우울증과 트라우마 치료에 오랜 경험을 가진 전문가입니다. 다양한 치료 기법을 활용하여 내담자의 마음의 상처를 치유하고 새로운 시작을 도와드립니다.',
        consultation_fee: 100000,
        rating: 4.7,
        total_consultations: 203,
        is_active: true,
        match_score: 75,
        match_reasons: ['풍부한 경험', '많은 상담 경험']
      }
    ];
  }

  async loadExperts() {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      // 로컬 환경에서는 모의 데이터 사용
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        this.experts = this.generateMockExperts();
        this.displayExperts();
        return;
      }

      const response = await fetch('/.netlify/functions/expert-matching?action=experts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('전문가 목록 로드 실패');
      }

      const data = await response.json();
      this.experts = data.experts || [];
      this.displayExperts();

    } catch (error) {
      console.error('전문가 목록 로드 오류:', error);
      this.displayError('전문가 목록을 불러올 수 없습니다.');
    }
  }

  displayExperts() {
    const container = document.getElementById('experts-list');
    if (!container) return;

    if (this.experts.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <p>표시할 전문가가 없습니다.</p>
          <p>상담 요구사항을 먼저 분석해보세요.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.experts.map(expert => this.renderExpertCard(expert)).join('');
  }

  renderExpertCard(expert) {
    const stars = '★'.repeat(Math.floor(expert.rating)) + '☆'.repeat(5 - Math.floor(expert.rating));

    return `
      <div class="expert-card" data-expert-id="${expert.id}">
        <div class="expert-header">
          <div class="expert-info">
            <div class="expert-avatar">${expert.expert_type === 'psychologist' ? '👨‍⚕️' : '👩‍⚕️'}</div>
            <div class="expert-details">
              <h3>전문 상담사</h3>
              <div class="expert-meta">
                <div class="rating">
                  <span class="stars">${stars}</span>
                  <span>${expert.rating}</span>
                </div>
                <div>경력 ${expert.experience_years}년</div>
                <div>상담 ${expert.total_consultations}회</div>
              </div>
            </div>
          </div>
          ${expert.match_score ? `<div class="match-score">${expert.match_score}% 매칭</div>` : ''}
        </div>

        <div class="specializations">
          ${expert.specializations?.map(spec => `<span class="specialization-tag">${spec}</span>`).join('') || ''}
        </div>

        <div class="expert-bio">${expert.bio || '상담사 소개가 없습니다.'}</div>

        ${expert.match_reasons ? `
          <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 10px 0;">
            <strong>🎯 매칭 이유:</strong> ${expert.match_reasons.join(', ')}
          </div>
        ` : ''}

        <div class="booking-section">
          <div class="consultation-options">
            <div class="consultation-type" data-type="text_chat">💬 채팅</div>
            <div class="consultation-type" data-type="voice_call">📞 음성</div>
            <div class="consultation-type" data-type="video_call">📹 화상</div>
          </div>

          <div class="price-info">
            <div class="price">${expert.consultation_fee?.toLocaleString() || '50,000'}원</div>
            <div>50분 기준</div>
          </div>

          <button class="book-btn" data-action="book" data-expert-id="${expert.id}">
            📅 예약하기
          </button>
        </div>
      </div>
    `;
  }

  async loadMyConsultations() {
    const container = document.getElementById('my-consultations-list');
    if (!container) return;

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        container.innerHTML = '<div class="no-data">로그인이 필요합니다.</div>';
        return;
      }

      // 로컬 환경에서는 모의 데이터
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        this.myConsultations = [
          {
            id: '1',
            consultation_type: 'video_call',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 50,
            status: 'scheduled',
            expert_profiles: {
              specializations: ['불안장애', '인지행동치료']
            }
          }
        ];
        this.displayMyConsultations();
        return;
      }

      const response = await fetch('/.netlify/functions/expert-matching?action=my_consultations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('상담 목록 로드 실패');
      }

      const data = await response.json();
      this.myConsultations = data.consultations || [];
      this.displayMyConsultations();

    } catch (error) {
      console.error('상담 목록 로드 오류:', error);
      container.innerHTML = '<div class="no-data">상담 목록을 불러올 수 없습니다.</div>';
    }
  }

  displayMyConsultations() {
    const container = document.getElementById('my-consultations-list');
    if (!container) return;

    if (this.myConsultations.length === 0) {
      container.innerHTML = '<div class="no-data">예약된 상담이 없습니다.</div>';
      return;
    }

    container.innerHTML = this.myConsultations.map(consultation => {
      const date = new Date(consultation.scheduled_at);
      const dateStr = date.toLocaleDateString('ko-KR');
      const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="consultation-item">
          <div>
            <div style="font-weight: bold;">${this.getConsultationTypeText(consultation.consultation_type)}</div>
            <div style="color: #6c757d; font-size: 14px;">
              ${dateStr} ${timeStr} (${consultation.duration_minutes}분)
            </div>
            <div style="font-size: 12px; color: #6c757d;">
              전문분야: ${consultation.expert_profiles?.specializations?.join(', ') || '일반상담'}
            </div>
          </div>
          <div>
            <span class="consultation-status status-${consultation.status}">
              ${this.getStatusText(consultation.status)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  getStatusText(status) {
    switch (status) {
      case 'scheduled': return '예약됨';
      case 'ongoing': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  }

  handleExpertActions(event) {
    const action = event.target.dataset.action;
    const expertId = event.target.dataset.expertId;

    if (action === 'book' && expertId) {
      this.showBookingModal(expertId);
    }

    // 상담 유형 선택
    if (event.target.classList.contains('consultation-type')) {
      const consultationTypes = event.target.parentElement.querySelectorAll('.consultation-type');
      consultationTypes.forEach(type => type.classList.remove('selected'));
      event.target.classList.add('selected');
    }
  }

  showBookingModal(expertId) {
    this.selectedExpert = this.experts.find(expert => expert.id === expertId);
    if (!this.selectedExpert) return;

    const modal = document.getElementById('booking-modal');
    if (modal) {
      // 최소 예약 시간을 내일로 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const datetimeInput = document.getElementById('scheduled-datetime');
      if (datetimeInput) {
        datetimeInput.min = tomorrow.toISOString().slice(0, 16);
        datetimeInput.value = tomorrow.toISOString().slice(0, 16);
      }

      // AI 준비 요약 생성
      const preparationSummary = document.getElementById('ai-preparation-summary');
      if (preparationSummary && this.userNeeds) {
        preparationSummary.innerHTML = `
          <p><strong>주요 관심사:</strong> ${this.userNeeds.primary_concerns?.join(', ') || '없음'}</p>
          <p><strong>권장 상담 유형:</strong> ${this.getConsultationTypeText(this.userNeeds.consultation_type)}</p>
          <p><strong>준비 노트:</strong> ${this.userNeeds.preparation_notes || '특별사항 없음'}</p>
        `;
      }

      modal.style.display = 'flex';
    }
  }

  hideBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async confirmBooking() {
    const consultationType = document.getElementById('consultation-type-select').value;
    const scheduledDateTime = document.getElementById('scheduled-datetime').value;
    const duration = document.getElementById('duration-select').value;

    if (!scheduledDateTime) {
      this.showNotification('예약 날짜와 시간을 선택해주세요.', 'warning');
      return;
    }

    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '예약 중...';
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
        this.hideBookingModal();
        this.showNotification('상담 예약이 완료되었습니다! (로컬 모드)', 'success');
        this.loadMyConsultations();
        return;
      }

      const response = await fetch('/.netlify/functions/expert-matching', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'book_consultation',
          expert_id: this.selectedExpert.id,
          consultation_type: consultationType,
          scheduled_at: scheduledDateTime,
          duration_minutes: parseInt(duration)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예약 실패');
      }

      this.hideBookingModal();
      this.showNotification('상담 예약이 완료되었습니다!', 'success');
      this.loadMyConsultations();

    } catch (error) {
      console.error('예약 오류:', error);
      this.showNotification(error.message || '예약에 실패했습니다.', 'error');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '예약 확정';
      }
    }
  }

  displayError(message) {
    const container = document.getElementById('experts-list');
    if (container) {
      container.innerHTML = `
        <div class="no-data">
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
}

// 전역으로 내보내기
window.ExpertConsultation = ExpertConsultation;