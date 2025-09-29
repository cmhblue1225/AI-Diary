// Phase 2: 멀티모달 일기 작성 및 AI 분석 기능

export class MultimodalDiary {
  constructor(supabase) {
    this.supabase = supabase;
    this.attachments = [];
    this.analysis = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    this.initializeMediaCapture();
    this.setupEventListeners();
  }

  initializeMediaCapture() {
    // 카메라 및 마이크 권한 확인
    this.checkMediaPermissions();
  }

  async checkMediaPermissions() {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      const micPermission = await navigator.permissions.query({ name: 'microphone' });

      this.updatePermissionStatus('camera', cameraPermission.state);
      this.updatePermissionStatus('microphone', micPermission.state);
    } catch (error) {
      console.warn('권한 확인 불가:', error);
    }
  }

  updatePermissionStatus(type, status) {
    const statusElement = document.getElementById(`${type}-status`);
    if (statusElement) {
      statusElement.textContent = status === 'granted' ? '사용 가능' : '권한 필요';
      statusElement.className = `permission-status ${status}`;
    }
  }

  setupEventListeners() {
    // 이미지 업로드 버튼
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
      imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
    }

    // 카메라 촬영 버튼
    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', this.takePicture.bind(this));
    }

    // 음성 녹음 버튼
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      recordBtn.addEventListener('click', this.toggleRecording.bind(this));
    }

    // 멀티모달 분석 버튼
    const analyzeBtn = document.getElementById('multimodal-analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', this.performMultimodalAnalysis.bind(this));
    }

    // 첨부파일 제거 버튼들
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-attachment')) {
        this.removeAttachment(e.target.dataset.index);
      }
    });
  }

  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > this.maxFileSize) {
      this.showNotification('파일 크기가 10MB를 초과합니다.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showNotification('이미지 파일만 업로드 가능합니다.', 'error');
      return;
    }

    try {
      const base64 = await this.fileToBase64(file);
      const attachment = {
        type: 'image',
        file: file,
        base64: base64.split(',')[1], // data: 부분 제거
        preview: base64,
        name: file.name,
        size: file.size
      };

      this.attachments.push(attachment);
      this.renderAttachments();
      this.showNotification('이미지가 추가되었습니다.', 'success');
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      this.showNotification('이미지 업로드에 실패했습니다.', 'error');
    }
  }

  async takePicture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // 카메라 모달 표시
      this.showCameraModal(stream);
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      this.showNotification('카메라에 접근할 수 없습니다. 권한을 확인해주세요.', 'error');
    }
  }

  showCameraModal(stream) {
    const modal = document.createElement('div');
    modal.className = 'modal camera-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>📸 사진 촬영</h3>
          <button class="close-btn" id="camera-close">&times;</button>
        </div>
        <div class="camera-container">
          <video id="camera-video" autoplay playsinline></video>
          <canvas id="camera-canvas" style="display: none;"></canvas>
        </div>
        <div class="camera-controls">
          <button id="capture-btn" class="btn btn-primary">📷 촬영</button>
          <button id="camera-cancel" class="btn btn-secondary">취소</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const video = modal.querySelector('#camera-video');
    const canvas = modal.querySelector('#camera-canvas');
    const captureBtn = modal.querySelector('#capture-btn');
    const closeBtn = modal.querySelector('#camera-close');
    const cancelBtn = modal.querySelector('#camera-cancel');

    video.srcObject = stream;

    captureBtn.addEventListener('click', () => {
      this.captureImage(video, canvas, stream);
      modal.remove();
    });

    [closeBtn, cancelBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        modal.remove();
      });
    });
  }

  captureImage(video, canvas, stream) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      canvas.toDataURL('image/jpeg', 0.8).then((base64) => {
        const attachment = {
          type: 'image',
          file: file,
          base64: base64.split(',')[1],
          preview: base64,
          name: file.name,
          size: file.size
        };

        this.attachments.push(attachment);
        this.renderAttachments();
        this.showNotification('사진이 촬영되었습니다.', 'success');
      });

      stream.getTracks().forEach(track => track.stop());
    }, 'image/jpeg', 0.8);
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.updateRecordingUI(true);
      this.showNotification('음성 녹음이 시작되었습니다.', 'info');

      // 최대 2분 녹음 제한
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, 120000);

    } catch (error) {
      console.error('녹음 시작 오류:', error);
      this.showNotification('마이크에 접근할 수 없습니다. 권한을 확인해주세요.', 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateRecordingUI(false);
      this.showNotification('음성 녹음이 완료되었습니다.', 'success');
    }
  }

  updateRecordingUI(isRecording) {
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      if (isRecording) {
        recordBtn.innerHTML = '⏹️ 녹음 중지';
        recordBtn.classList.add('recording');
      } else {
        recordBtn.innerHTML = '🎤 음성 녹음';
        recordBtn.classList.remove('recording');
      }
    }

    // 녹음 상태 표시
    const recordingStatus = document.getElementById('recording-status');
    if (recordingStatus) {
      recordingStatus.style.display = isRecording ? 'block' : 'none';
    }
  }

  async processRecording() {
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const base64 = await this.blobToBase64(audioBlob);

      const attachment = {
        type: 'voice',
        file: audioBlob,
        base64: base64.split(',')[1],
        name: `voice_${Date.now()}.webm`,
        size: audioBlob.size,
        duration: '녹음됨'
      };

      this.attachments.push(attachment);
      this.renderAttachments();
    } catch (error) {
      console.error('녹음 처리 오류:', error);
      this.showNotification('녹음 처리에 실패했습니다.', 'error');
    }
  }

  renderAttachments() {
    const container = document.getElementById('attachments-container');
    if (!container) return;

    container.innerHTML = this.attachments.map((attachment, index) => {
      if (attachment.type === 'image') {
        return `
          <div class="attachment-item image-attachment">
            <img src="${attachment.preview}" alt="첨부 이미지" class="attachment-preview">
            <div class="attachment-info">
              <span class="attachment-name">${attachment.name}</span>
              <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
            </div>
            <button class="remove-attachment" data-index="${index}">❌</button>
          </div>
        `;
      } else if (attachment.type === 'voice') {
        return `
          <div class="attachment-item voice-attachment">
            <div class="voice-icon">🎤</div>
            <div class="attachment-info">
              <span class="attachment-name">${attachment.name}</span>
              <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
            </div>
            <button class="remove-attachment" data-index="${index}">❌</button>
          </div>
        `;
      }
    }).join('');
  }

  removeAttachment(index) {
    this.attachments.splice(index, 1);
    this.renderAttachments();
    this.showNotification('첨부파일이 제거되었습니다.', 'info');
  }

  async performMultimodalAnalysis() {
    const content = document.getElementById('diary-content')?.value;
    if (!content && this.attachments.length === 0) {
      this.showNotification('분석할 내용이나 첨부파일을 추가해주세요.', 'warning');
      return;
    }

    const analyzeBtn = document.getElementById('multimodal-analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = '🧠 AI 분석 중...';
    }

    try {
      // 로컬 개발 환경 감지
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        // 로컬 환경에서는 모의 분석 결과 반환
        this.analysis = this.generateMockMultimodalAnalysis();
        this.displayMultimodalResults(this.analysis);
        this.showNotification('AI 분석이 완료되었습니다. (로컬 모드)', 'success');
        return;
      }

      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인이 필요합니다.');
      }
      const token = session.access_token;

      // 먼저 텍스트 감정 분석 수행
      let textAnalysis = null;
      if (content) {
        const textResponse = await fetch('/.netlify/functions/advanced-emotion-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: content,
            analysisType: 'comprehensive'
          })
        });

        if (textResponse.ok) {
          textAnalysis = await textResponse.json();
        }
      }

      // 멀티모달 분석 요청
      const imageAttachment = this.attachments.find(a => a.type === 'image');
      const voiceAttachment = this.attachments.find(a => a.type === 'voice');

      const analysisData = {
        textContent: content,
        textAnalysis: textAnalysis,
        imageData: imageAttachment?.base64,
        audioData: voiceAttachment?.base64,
        audioMetadata: voiceAttachment ? {
          size: voiceAttachment.size,
          type: 'audio/webm'
        } : null,
        analysisType: 'multimodal'
      };

      const response = await fetch('/.netlify/functions/multimodal-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error('멀티모달 분석 요청 실패');
      }

      this.analysis = await response.json();
      this.displayMultimodalResults(this.analysis);
      this.showNotification('멀티모달 AI 분석이 완료되었습니다!', 'success');

    } catch (error) {
      console.error('멀티모달 분석 오류:', error);
      this.showNotification('AI 분석 중 오류가 발생했습니다.', 'error');
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '🧠 멀티모달 AI 분석';
      }
    }
  }

  generateMockMultimodalAnalysis() {
    return {
      success: true,
      individual_analyses: {
        text: {
          emotions: [{ type: 'happy', intensity: 75, confidence: 0.9 }],
          overall_mood_score: 35,
          keywords: ['평온', '만족', '일상'],
          ai_insights: '전반적으로 안정적인 감정 상태를 보입니다.',
          personalized_advice: '현재의 평온함을 유지하며 자신만의 시간을 즐겨보세요.'
        },
        image: this.attachments.find(a => a.type === 'image') ? {
          visual_emotions: [{ type: 'neutral', intensity: 70, confidence: 0.85 }],
          visual_elements: {
            dominant_colors: ['파란색', '흰색'],
            composition: '안정적인 구도',
            key_objects: ['하늘', '구름'],
            lighting: '자연광'
          },
          ai_insights: '평온하고 차분한 시각적 요소들이 감지됩니다.'
        } : null,
        voice: this.attachments.find(a => a.type === 'voice') ? {
          voice_emotions: [{ type: 'neutral', intensity: 65, confidence: 0.8 }],
          speech_characteristics: {
            estimated_tone: '차분함',
            speech_pace: '보통',
            emotional_intensity: '낮음'
          },
          voice_insights: '안정적이고 차분한 음성 톤이 감지됩니다.'
        } : null
      },
      final_analysis: {
        final_emotions: [{ type: 'happy', intensity: 72, confidence: 0.88, sources: ['text', 'image', 'voice'] }],
        consistency_analysis: {
          overall_consistency: 0.85,
          conflicting_signals: [],
          dominant_modality: 'text'
        },
        comprehensive_insights: '모든 모달리티에서 일관된 평온한 감정이 감지됩니다.',
        multimodal_recommendations: '현재의 안정적인 상태를 유지하며 새로운 경험을 시도해보세요.'
      },
      processing_time: 2500
    };
  }

  displayMultimodalResults(analysis) {
    const resultsContainer = document.getElementById('multimodal-results');
    if (!resultsContainer) return;

    const hasMultipleModalities = Object.keys(analysis.individual_analyses || {}).length > 1;

    resultsContainer.innerHTML = `
      <div class="analysis-results multimodal-results">
        <h3>🧠 멀티모달 AI 분석 결과</h3>

        ${hasMultipleModalities ? `
          <div class="final-analysis">
            <h4>🎯 종합 분석</h4>
            <div class="emotion-summary">
              ${analysis.final_analysis?.final_emotions?.map(emotion => `
                <div class="emotion-result">
                  <span class="emotion-name">${this.getEmotionLabel(emotion.type)}</span>
                  <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${emotion.intensity}%"></div>
                  </div>
                  <span class="emotion-score">${emotion.intensity}%</span>
                </div>
              `).join('') || ''}
            </div>
            <div class="comprehensive-insights">
              <p><strong>종합 인사이트:</strong> ${analysis.final_analysis?.comprehensive_insights || ''}</p>
              <p><strong>일관성 점수:</strong> ${Math.round((analysis.final_analysis?.consistency_analysis?.overall_consistency || 0) * 100)}%</p>
            </div>
          </div>
        ` : ''}

        <div class="individual-analyses">
          ${analysis.individual_analyses?.text ? `
            <div class="analysis-section text-analysis">
              <h4>📝 텍스트 분석</h4>
              <div class="analysis-content">
                <p><strong>주요 감정:</strong> ${analysis.individual_analyses.text.emotions?.[0]?.type || ''}</p>
                <p><strong>기분 점수:</strong> ${analysis.individual_analyses.text.overall_mood_score || 0}</p>
                <p><strong>키워드:</strong> ${analysis.individual_analyses.text.keywords?.join(', ') || ''}</p>
                <p><strong>AI 인사이트:</strong> ${analysis.individual_analyses.text.ai_insights || ''}</p>
              </div>
            </div>
          ` : ''}

          ${analysis.individual_analyses?.image ? `
            <div class="analysis-section image-analysis">
              <h4>🖼️ 이미지 분석</h4>
              <div class="analysis-content">
                <p><strong>시각적 감정:</strong> ${analysis.individual_analyses.image.visual_emotions?.[0]?.type || ''}</p>
                <p><strong>주요 색상:</strong> ${analysis.individual_analyses.image.visual_elements?.dominant_colors?.join(', ') || ''}</p>
                <p><strong>핵심 객체:</strong> ${analysis.individual_analyses.image.visual_elements?.key_objects?.join(', ') || ''}</p>
                <p><strong>시각적 인사이트:</strong> ${analysis.individual_analyses.image.ai_insights || ''}</p>
              </div>
            </div>
          ` : ''}

          ${analysis.individual_analyses?.voice ? `
            <div class="analysis-section voice-analysis">
              <h4>🎤 음성 분석</h4>
              <div class="analysis-content">
                <p><strong>음성 감정:</strong> ${analysis.individual_analyses.voice.voice_emotions?.[0]?.type || ''}</p>
                <p><strong>음성 톤:</strong> ${analysis.individual_analyses.voice.speech_characteristics?.estimated_tone || ''}</p>
                <p><strong>말하기 속도:</strong> ${analysis.individual_analyses.voice.speech_characteristics?.speech_pace || ''}</p>
                <p><strong>음성 인사이트:</strong> ${analysis.individual_analyses.voice.voice_insights || ''}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="recommendations">
          <h4>💡 맞춤형 추천</h4>
          <p>${analysis.final_analysis?.multimodal_recommendations || analysis.individual_analyses?.text?.personalized_advice || ''}</p>
        </div>

        <div class="processing-info">
          <small>⏱️ 처리 시간: ${analysis.processing_time || 0}ms</small>
        </div>
      </div>
    `;

    resultsContainer.style.display = 'block';
  }

  getEmotionLabel(emotionKey) {
    const emotions = {
      joy: '😄 기쁨',
      contentment: '😊 만족',
      gratitude: '🙏 감사',
      love: '❤️ 사랑',
      excitement: '🤩 흥분/설렘',
      pride: '😤 자부심',
      hope: '🌟 희망',
      relief: '😮‍💨 안도',
      sadness: '😢 슬픔',
      grief: '😭 비탄',
      anger: '😠 분노',
      frustration: '😤 좌절',
      anxiety: '😰 불안',
      fear: '😨 두려움',
      guilt: '😔 죄책감',
      shame: '😳 수치심',
      loneliness: '😞 외로움',
      disappointment: '😕 실망',
      calm: '😌 평온',
      contemplative: '🤔 사색적',
      curious: '🧐 호기심',
      nostalgic: '😊 그리움',
      confused: '😕 혼란',
      indifferent: '😐 무관심'
    };
    return emotions[emotionKey] || emotionKey;
  }

  // 유틸리티 메서드들
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
window.MultimodalDiary = MultimodalDiary;