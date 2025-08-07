
class SubwayTracker {
    constructor() {
        this.baseUrl = 'http://swopenapi.seoul.go.kr/api/subway/sample/xml/realtimePosition/0/5/';
        this.currentLine = '7호선';
        this.autoRefresh = null;
        
        this.initEventListeners();
        this.loadInitialData();
    }

    initEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const lineSelect = document.getElementById('lineSelect');

        searchBtn.addEventListener('click', () => this.searchTrains());
        refreshBtn.addEventListener('click', () => this.refreshData());
        lineSelect.addEventListener('change', (e) => {
            this.currentLine = e.target.value;
        });
    }

    loadInitialData() {
        this.setStatus('7호선을 선택하고 검색 버튼을 눌러주세요.', 'info');
    }

    async searchTrains() {
        this.currentLine = document.getElementById('lineSelect').value;
        await this.fetchTrainData();
    }

    async refreshData() {
        if (this.currentLine) {
            await this.fetchTrainData();
        }
    }

    async fetchTrainData() {
        try {
            this.setStatus(`${this.currentLine} 실시간 위치 정보를 가져오는 중...`, 'loading');
            
            const encodedLine = encodeURIComponent(this.currentLine);
            const url = `${this.baseUrl}${encodedLine}`;
            
            // CORS 문제를 피하기 위해 프록시 서버를 사용하거나 직접 요청
            const response = await this.makeRequest(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const trains = this.parseXMLData(xmlText);
            
            this.displayTrains(trains);
            this.setStatus(`${this.currentLine} 실시간 위치 정보 (${trains.length}개 열차)`, 'success');
            
        } catch (error) {
            console.error('Error fetching train data:', error);
            this.setStatus('데이터를 가져오는 중 오류가 발생했습니다. CORS 정책으로 인해 브라우저에서 직접 접근이 제한될 수 있습니다.', 'error');
            this.showSampleData();
        }
    }

    async makeRequest(url) {
        // 실제 환경에서는 CORS 프록시나 백엔드 서버를 통해 요청해야 합니다.
        // 여기서는 시연을 위해 fetch를 시도하고, 실패시 샘플 데이터를 표시합니다.
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            return await fetch(proxyUrl);
        } catch (error) {
            // 프록시도 실패하면 직접 시도
            return await fetch(url);
        }
    }

    parseXMLData(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const rows = xmlDoc.getElementsByTagName('row');
            const trains = [];
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const train = {
                    trainNo: this.getElementText(row, 'trainNo') || `열차${i + 1}`,
                    statnNm: this.getElementText(row, 'statnNm') || '정보없음',
                    trainSttus: this.getElementText(row, 'trainSttus') || '운행중',
                    directAt: this.getElementText(row, 'directAt') || '상행',
                    lstcarAt: this.getElementText(row, 'lstcarAt') || '일반',
                    recptnDt: this.getElementText(row, 'recptnDt') || new Date().toLocaleString()
                };
                trains.push(train);
            }
            
            return trains;
        } catch (error) {
            console.error('XML parsing error:', error);
            return [];
        }
    }

    getElementText(parent, tagName) {
        const element = parent.getElementsByTagName(tagName)[0];
        return element ? element.textContent : '';
    }

    displayTrains(trains) {
        const trainList = document.getElementById('trainList');
        
        if (trains.length === 0) {
            trainList.innerHTML = `
                <div class="no-data">
                    <p>현재 운행중인 열차 정보가 없습니다.</p>
                </div>
            `;
            return;
        }

        const trainHtml = trains.map(train => `
            <div class="train-item">
                <div class="train-header">
                    <div class="train-number">🚇 ${train.trainNo}</div>
                    <div class="train-direction">${this.getDirectionText(train.directAt)}</div>
                </div>
                <div class="train-details">
                    <div class="detail-item">
                        <span class="detail-label">📍 현재 위치</span>
                        <span class="detail-value">${train.statnNm}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🚦 운행 상태</span>
                        <span class="detail-value">${this.getStatusText(train.trainSttus)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🚃 차량 타입</span>
                        <span class="detail-value">${this.getCarTypeText(train.lstcarAt)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">⏰ 업데이트 시간</span>
                        <span class="detail-value">${this.formatTime(train.recptnDt)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        trainList.innerHTML = trainHtml;
    }

    showSampleData() {
        // API 접근이 안될 때 보여줄 샘플 데이터
        const sampleTrains = [
            {
                trainNo: '7001',
                statnNm: '강남구청역',
                trainSttus: '0',
                directAt: '1',
                lstcarAt: '1',
                recptnDt: new Date().toLocaleString()
            },
            {
                trainNo: '7002',
                statnNm: '논현역',
                trainSttus: '1',
                directAt: '0',
                lstcarAt: '0',
                recptnDt: new Date().toLocaleString()
            },
            {
                trainNo: '7003',
                statnNm: '반포역',
                trainSttus: '0',
                directAt: '1',
                lstcarAt: '1',
                recptnDt: new Date().toLocaleString()
            }
        ];
        
        this.displayTrains(sampleTrains);
        this.setStatus(`${this.currentLine} 샘플 데이터 (실제 API 접근 제한으로 인한 데모)`, 'info');
    }

    getDirectionText(directAt) {
        const directions = {
            '0': '하행 ⬇️',
            '1': '상행 ⬆️'
        };
        return directions[directAt] || directAt || '미정';
    }

    getStatusText(trainSttus) {
        const statuses = {
            '0': '운행중 🟢',
            '1': '진입중 🟡',
            '2': '출발대기 🔵',
            '3': '종료 🔴'
        };
        return statuses[trainSttus] || trainSttus || '알 수 없음';
    }

    getCarTypeText(lstcarAt) {
        const types = {
            '0': '막차아님 🚇',
            '1': '막차 🌙'
        };
        return types[lstcarAt] || lstcarAt || '일반';
    }

    formatTime(timeString) {
        try {
            if (!timeString) return '정보없음';
            
            // API에서 오는 시간 형식에 따라 조정 필요
            if (timeString.includes('-') || timeString.includes(':')) {
                return timeString;
            }
            
            return new Date().toLocaleString();
        } catch (error) {
            return timeString || '정보없음';
        }
    }

    setStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = 'status';
        
        if (type !== 'info') {
            status.classList.add(type);
        }
    }

    startAutoRefresh(interval = 30000) {
        this.stopAutoRefresh();
        this.autoRefresh = setInterval(() => {
            if (this.currentLine) {
                this.refreshData();
            }
        }, interval);
    }

    stopAutoRefresh() {
        if (this.autoRefresh) {
            clearInterval(this.autoRefresh);
            this.autoRefresh = null;
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new SubwayTracker();
    
    // 선택적으로 자동 새로고침 활성화 (30초마다)
    // app.startAutoRefresh(30000);
});
