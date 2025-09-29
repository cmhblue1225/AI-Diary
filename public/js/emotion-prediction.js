// Phase 2: 감정 예측 시스템 클라이언트

export class EmotionPrediction {
  constructor() {
    this.predictions = [];
    this.chart = null;
    this.isLoading = false;

    this.initializeUI();
    this.loadExistingPredictions();
  }

  initializeUI() {
    this.setupEventListeners();
    this.createPredictionChart();
  }

  setupEventListeners() {
    const generateBtn = document.getElementById('generate-predictions-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', this.generatePredictions.bind(this));
    }

    const validateBtn = document.getElementById('validate-accuracy-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', this.validateAccuracy.bind(this));
    }

    const refreshBtn = document.getElementById('refresh-predictions-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.loadExistingPredictions.bind(this));
    }
  }

  async loadExistingPredictions() {
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
        this.predictions = this.generateMockPredictions();
        this.displayPredictions();
        this.updatePredictionChart();
        return;
      }

      const response = await fetch('/.netlify/functions/emotion-prediction', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('예측 데이터 로드 실패');
      }

      const data = await response.json();
      this.predictions = data.predictions || [];
      this.displayPredictions();
      this.updatePredictionChart();

    } catch (error) {
      console.error('기존 예측 로드 오류:', error);
      this.showNotification('예측 데이터를 불러오는데 실패했습니다.', 'error');
    }
  }

  async generatePredictions() {
    if (this.isLoading) return;

    this.isLoading = true;
    const generateBtn = document.getElementById('generate-predictions-btn');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '🧠 AI 예측 생성 중...';
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
        // 로딩 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.predictions = this.generateMockPredictions();
        this.displayPredictions();
        this.updatePredictionChart();
        this.showNotification('AI 감정 예측이 완료되었습니다! (로컬 모드)', 'success');
        return;
      }

      const response = await fetch('/.netlify/functions/emotion-prediction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'predict',
          targetDays: 7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예측 생성 실패');
      }

      const data = await response.json();
      this.predictions = data.predictions || [];
      this.displayPredictions();
      this.updatePredictionChart();
      this.displayPatternAnalysis(data.pattern_analysis);
      this.displayRecommendations(data.recommendations);
      this.showNotification('AI 감정 예측이 완료되었습니다!', 'success');

    } catch (error) {
      console.error('예측 생성 오류:', error);
      this.showNotification(error.message || '예측 생성에 실패했습니다.', 'error');
    } finally {
      this.isLoading = false;
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🔮 7일 감정 예측 생성';
      }
    }
  }

  generateMockPredictions() {
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
    const predictions = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted_emotion: emotions[Math.floor(Math.random() * emotions.length)],
        predicted_mood_score: Math.round(Math.random() * 200 - 100), // -100 to 100
        confidence_level: 0.6 + Math.random() * 0.3, // 0.6 to 0.9
        factors: ['주간 패턴', '최근 감정 추세', '계절적 요인'],
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }

    return predictions;
  }

  displayPredictions() {
    const container = document.getElementById('predictions-container');
    if (!container) return;

    if (this.predictions.length === 0) {
      container.innerHTML = `
        <div class="no-predictions">
          <p>아직 생성된 예측이 없습니다.</p>
          <p>최소 3개 이상의 일기를 작성한 후 예측을 생성해보세요.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="predictions-grid">
        ${this.predictions.map((prediction, index) => this.renderPredictionCard(prediction, index)).join('')}
      </div>
    `;
  }

  renderPredictionCard(prediction, index) {
    const date = new Date(prediction.date);
    const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

    const emotionInfo = this.getEmotionInfo(prediction.predicted_emotion);
    const moodColor = this.getMoodColor(prediction.predicted_mood_score);
    const riskColor = this.getRiskColor(prediction.risk_level);

    return `
      <div class="prediction-card ${prediction.risk_level}-risk" data-index="${index}">
        <div class="prediction-header">
          <div class="prediction-date">
            <span class="day-name">${dayName}</span>
            <span class="date-str">${dateStr}</span>
          </div>
          <div class="risk-indicator ${prediction.risk_level}-risk">
            ${this.getRiskIcon(prediction.risk_level)}
          </div>
        </div>

        <div class="prediction-emotion">
          <div class="emotion-icon">${emotionInfo.icon}</div>
          <div class="emotion-details">
            <span class="emotion-name">${emotionInfo.name}</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${prediction.confidence_level * 100}%"></div>
            </div>
            <span class="confidence-text">${Math.round(prediction.confidence_level * 100)}% 신뢰도</span>
          </div>
        </div>

        <div class="mood-score" style="background-color: ${moodColor}20; border-left: 4px solid ${moodColor}">
          <span class="mood-label">기분 점수</span>
          <span class="mood-value">${prediction.predicted_mood_score}</span>
        </div>

        <div class="prediction-factors">
          <h5>영향 요인</h5>
          <div class="factors-list">
            ${prediction.factors?.map(factor => `<span class="factor-tag">${factor}</span>`).join('') || ''}
          </div>
        </div>

        <div class="prediction-actions">
          <button class="btn btn-sm btn-outline" onclick="emotionPrediction.showDetailedPrediction(${index})">
            자세히 보기
          </button>
        </div>
      </div>
    `;
  }

  getEmotionInfo(emotionKey) {
    const emotions = {
      joy: { name: '기쁨', icon: '😄' },
      contentment: { name: '만족', icon: '😊' },
      gratitude: { name: '감사', icon: '🙏' },
      love: { name: '사랑', icon: '❤️' },
      excitement: { name: '흥분', icon: '🤩' },
      pride: { name: '자부심', icon: '😤' },
      hope: { name: '희망', icon: '🌟' },
      relief: { name: '안도', icon: '😮‍💨' },
      sadness: { name: '슬픔', icon: '😢' },
      grief: { name: '비탄', icon: '😭' },
      anger: { name: '분노', icon: '😠' },
      frustration: { name: '좌절', icon: '😤' },
      anxiety: { name: '불안', icon: '😰' },
      fear: { name: '두려움', icon: '😨' },
      guilt: { name: '죄책감', icon: '😔' },
      shame: { name: '수치심', icon: '😳' },
      loneliness: { name: '외로움', icon: '😞' },
      disappointment: { name: '실망', icon: '😕' },
      calm: { name: '평온', icon: '😌' },
      contemplative: { name: '사색적', icon: '🤔' },
      curious: { name: '호기심', icon: '🧐' },
      nostalgic: { name: '그리움', icon: '😊' },
      confused: { name: '혼란', icon: '😕' },
      indifferent: { name: '무관심', icon: '😐' }
    };
    return emotions[emotionKey] || { name: emotionKey, icon: '😐' };
  }

  getMoodColor(score) {
    if (score >= 50) return '#51cf66';      // 매우 긍정적 - 밝은 녹색
    if (score >= 20) return '#8ce99a';      // 긍정적 - 연한 녹색
    if (score >= -20) return '#fab005';     // 중립 - 노란색
    if (score >= -50) return '#ff8787';     // 부정적 - 연한 빨간색
    return '#ff6b6b';                       // 매우 부정적 - 빨간색
  }

  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'low': return '#51cf66';
      case 'medium': return '#fab005';
      case 'high': return '#ff8787';
      case 'critical': return '#ff6b6b';
      default: return '#868e96';
    }
  }

  getRiskIcon(riskLevel) {
    switch (riskLevel) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  createPredictionChart() {
    const canvas = document.getElementById('prediction-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '예측 기분 점수',
          data: [],
          borderColor: '#339af0',
          backgroundColor: '#339af020',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#339af0',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: {
            display: true,
            text: '7일 감정 예측 차트'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: -100,
            max: 100,
            ticks: {
              callback: function(value) {
                if (value > 50) return '매우 긍정';
                if (value > 0) return '긍정';
                if (value === 0) return '중립';
                if (value > -50) return '부정';
                return '매우 부정';
              }
            },
            grid: {
              color: function(context) {
                if (context.tick.value === 0) {
                  return '#000';
                }
                return '#e0e0e0';
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  updatePredictionChart() {
    if (!this.chart || this.predictions.length === 0) return;

    const labels = this.predictions.map(p => {
      const date = new Date(p.date);
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    });

    const data = this.predictions.map(p => p.predicted_mood_score);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  showDetailedPrediction(index) {
    const prediction = this.predictions[index];
    if (!prediction) return;

    const modal = document.createElement('div');
    modal.className = 'modal prediction-detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>📊 상세 감정 예측</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="prediction-detail">
            <div class="detail-header">
              <h4>${new Date(prediction.date).toLocaleDateString('ko-KR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</h4>
            </div>

            <div class="detail-sections">
              <div class="detail-section">
                <h5>🎯 예측 감정</h5>
                <div class="emotion-detail">
                  <span class="emotion-large">${this.getEmotionInfo(prediction.predicted_emotion).icon}</span>
                  <span class="emotion-name-large">${this.getEmotionInfo(prediction.predicted_emotion).name}</span>
                </div>
              </div>

              <div class="detail-section">
                <h5>📈 기분 점수</h5>
                <div class="mood-detail">
                  <span class="mood-score-large" style="color: ${this.getMoodColor(prediction.predicted_mood_score)}">
                    ${prediction.predicted_mood_score}
                  </span>
                  <div class="mood-bar">
                    <div class="mood-fill" style="
                      width: ${(prediction.predicted_mood_score + 100) / 2}%;
                      background-color: ${this.getMoodColor(prediction.predicted_mood_score)}
                    "></div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h5>🎯 신뢰도</h5>
                <div class="confidence-detail">
                  <span class="confidence-percentage">${Math.round(prediction.confidence_level * 100)}%</span>
                  <div class="confidence-bar-large">
                    <div class="confidence-fill-large" style="width: ${prediction.confidence_level * 100}%"></div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h5>⚠️ 위험도</h5>
                <div class="risk-detail">
                  <span class="risk-icon-large">${this.getRiskIcon(prediction.risk_level)}</span>
                  <span class="risk-text">${this.getRiskText(prediction.risk_level)}</span>
                </div>
              </div>

              <div class="detail-section">
                <h5>🔍 영향 요인</h5>
                <div class="factors-detail">
                  ${prediction.factors?.map(factor => `<span class="factor-tag-large">${factor}</span>`).join('') || '정보 없음'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  getRiskText(riskLevel) {
    switch (riskLevel) {
      case 'low': return '낮음 - 안정적';
      case 'medium': return '보통 - 주의 필요';
      case 'high': return '높음 - 관리 필요';
      case 'critical': return '매우 높음 - 즉시 관리';
      default: return '알 수 없음';
    }
  }

  async validateAccuracy() {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        this.displayAccuracyResults({
          accuracy: 0.78,
          emotion_accuracy: 0.75,
          avg_mood_error: 12.5,
          sample_size: 15
        });
        return;
      }

      const response = await fetch('/.netlify/functions/emotion-prediction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'validate'
        })
      });

      if (!response.ok) {
        throw new Error('정확도 검증 실패');
      }

      const accuracy = await response.json();
      this.displayAccuracyResults(accuracy);

    } catch (error) {
      console.error('정확도 검증 오류:', error);
      this.showNotification('정확도 검증에 실패했습니다.', 'error');
    }
  }

  displayAccuracyResults(accuracy) {
    const container = document.getElementById('accuracy-results');
    if (!container) return;

    container.innerHTML = `
      <div class="accuracy-results">
        <h4>🎯 예측 정확도 검증</h4>
        <div class="accuracy-metrics">
          <div class="metric">
            <span class="metric-label">전체 정확도</span>
            <span class="metric-value">${Math.round(accuracy.accuracy * 100)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">감정 일치율</span>
            <span class="metric-value">${Math.round(accuracy.emotion_accuracy * 100)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">기분 점수 오차</span>
            <span class="metric-value">±${Math.round(accuracy.avg_mood_error)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">검증 샘플</span>
            <span class="metric-value">${accuracy.sample_size}개</span>
          </div>
        </div>
        <p class="accuracy-note">
          ${accuracy.sample_size < 10
            ? '더 정확한 검증을 위해 더 많은 일기를 작성해주세요.'
            : '충분한 데이터로 검증된 결과입니다.'}
        </p>
      </div>
    `;

    container.style.display = 'block';
  }

  displayPatternAnalysis(patternAnalysis) {
    if (!patternAnalysis) return;

    const container = document.getElementById('pattern-analysis');
    if (!container) return;

    container.innerHTML = `
      <div class="pattern-analysis">
        <h4>📊 감정 패턴 분석</h4>
        <div class="pattern-insights">
          <div class="insight-item">
            <span class="insight-label">주요 주기:</span>
            <span class="insight-value">${patternAnalysis.dominant_cycle}</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">감정 추세:</span>
            <span class="insight-value">${patternAnalysis.emotional_trend}</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">안정성 점수:</span>
            <span class="insight-value">${Math.round(patternAnalysis.stability_score * 100)}%</span>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'block';
  }

  displayRecommendations(recommendations) {
    if (!recommendations) return;

    const container = document.getElementById('prediction-recommendations');
    if (!container) return;

    container.innerHTML = `
      <div class="prediction-recommendations">
        <h4>💡 맞춤형 추천</h4>
        ${recommendations.high_risk_days?.length > 0 ? `
          <div class="recommendation-section">
            <h5>⚠️ 주의가 필요한 날</h5>
            <ul>
              ${recommendations.high_risk_days.map(day => `<li>${day}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${recommendations.preventive_actions?.length > 0 ? `
          <div class="recommendation-section">
            <h5>🛡️ 예방 조치</h5>
            <ul>
              ${recommendations.preventive_actions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${recommendations.positive_activities?.length > 0 ? `
          <div class="recommendation-section">
            <h5>✨ 추천 활동</h5>
            <ul>
              ${recommendations.positive_activities.map(activity => `<li>${activity}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    container.style.display = 'block';
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
window.EmotionPrediction = EmotionPrediction;