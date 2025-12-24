/* =========================================
   1. Optimized Matrix Background
   ========================================= */
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');
let w, h;
const resizeCanvas = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    // 최적화: 모바일에서 너무 많은 열이 생기지 않도록 폰트 크기 조절
    ctx.font = window.innerWidth < 600 ? '20px monospace' : '16px monospace';
};
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 최적화: 열(Column) 개수 줄임 (폰트 크기에 비례)
const fontSize = window.innerWidth < 600 ? 20 : 16;
const cols = Math.floor(w / fontSize) + 1;
const ypos = Array(cols).fill(0);

function drawMatrix() {
    // 꼬리 잔상 효과를 위해 불투명도 조절
    ctx.fillStyle = 'rgba(0, 5, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f0'; // 텍스트 색상

    ypos.forEach((y, i) => {
        // 최적화: 복잡한 문자 대신 단순한 숫자/가타카나 소량 사용
        const char = Math.random() > 0.9 ? String.fromCharCode(0x30A0 + Math.random() * 16) : Math.floor(Math.random()*10);
        const x = i * fontSize;
        ctx.fillText(char, x, y);
        
        // 비가 내리는 속도 및 랜덤 리셋
        if (y > h && Math.random() > 0.975) ypos[i] = 0;
        else ypos[i] = y + (fontSize * 0.7); // 떨어지는 속도 조절
    });
    requestAnimationFrame(drawMatrix);
}
drawMatrix();


/* =========================================
   2. Highly Optimized Sparse Voxel Tree
   ========================================= */
const treePivot = document.getElementById('treePivot');
const voxelCounter = document.getElementById('voxel-counter');
const VOXEL_SIZE = 28; // CSS와 일치해야 함

function createVoxel(x, y, z, type) {
    const cube = document.createElement('div');
    cube.className = `cube ${type}`;
    cube.style.transform = `translate3d(${x * VOXEL_SIZE}px, ${-y * VOXEL_SIZE}px, ${z * VOXEL_SIZE}px)`;
    
    // 최적화: 꼭 필요한 면 6개만 생성
    ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach(side => {
        const face = document.createElement('div');
        face.className = `face ${side}`;
        cube.appendChild(face);
    });
    return cube;
}

function generateSparseTree() {
    const fragment = document.createDocumentFragment();
    let count = 0;
    const height = 14; // 트리 높이

    // A. Trunk (기둥)
    for (let y = 0; y < 12; y++) {
        fragment.appendChild(createVoxel(0, y, 0, 'trunk'));
        count++;
    }

    // B. Foliage (나뭇잎) - 희소(Sparse) 배치 알고리즘
    for (let y = 4; y < height; y++) {
        const progress = y / height; // 0 (바닥) ~ 1 (꼭대기)
        // 위로 갈수록 반지름이 줄어듦
        const maxRadiusAtHeight = Math.floor(7 * (1 - progress)) + 1;

        // 각 층마다 랜덤하게 몇 개의 큐브만 뿌림 (핵심 최적화)
        // 아래층은 많이, 위층은 적게
        const density = Math.floor(12 * (1 - progress * 0.8)) + 4;

        for (let i = 0; i < density; i++) {
            // 랜덤 위치 선택 (원형 분포)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * maxRadiusAtHeight;
            const x = Math.round(Math.cos(angle) * radius);
            const z = Math.round(Math.sin(angle) * radius);

            // 중심 기둥 위치 제외
            if (x === 0 && z === 0) continue;

            let type = 'leaf';
            // 15% 확률로 장식
            if (Math.random() > 0.75) type = 'ornament';

            // 중복 위치 체크 없이 그냥 덮어씌움 (성능상 이득)
            fragment.appendChild(createVoxel(x, y, z, type));
            count++;
        }
    }

    // C. Top Star
    fragment.appendChild(createVoxel(0, height, 0, 'star'));
    // fragment.appendChild(createVoxel(0, height+1, 0, 'star'));
    count += 1;

    treePivot.appendChild(fragment);
    voxelCounter.innerText = `VOXELS: ${count}`; // 약 150~180개 예상
}

generateSparseTree();


/* =========================================
   3. Mobile & Desktop Controls
   ========================================= */
const scene = document.getElementById('scene');
let isDragging = false;
let lastX = 0, lastY = 0;
let rotX = -15, rotY = 25;
let targetRotX = -15, targetRotY = 15;

function handleStart(clientX, clientY) {
    isDragging = true;
    lastX = clientX;
    lastY = clientY;
}

function handleMove(clientX, clientY) {
    if (!isDragging) return;
    const dx = clientX - lastX;
    const dy = clientY - lastY;
    
    // 회전 속도 조절 (모바일에서는 쪼~~꼼 느리게)
    targetRotY += dx * 0.3;
    targetRotX -= dy * 0.3;
    targetRotX = Math.max(-60, Math.min(20, targetRotX)); // X축 제한

    lastX = clientX;
    lastY = clientY;
}

// Mouse Events
document.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));

// Touch Events (모바일 지원 추가)
document.addEventListener('touchstart', e => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
document.addEventListener('touchend', () => isDragging = false);
document.addEventListener('touchmove', e => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault(); // 스크롤 방지
}, { passive: false });


// 부드러운 회전 애니메이션 루프
function animateScene() {
    // 선형 보간 (Lerp)으로 부드럽게 따라가기
    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;

    // 값이 거의 같으면 업데이트 중지 (성능 최적화)
    if (Math.abs(targetRotX - rotX) > 0.01 || Math.abs(targetRotY - rotY) > 0.01) {
        scene.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    }
    
    requestAnimationFrame(animateScene);
}
animateScene();


/* =========================================
   4. Audio Control System
   ========================================= */
const bgm = document.getElementById('bgm');
const soundToggle = document.getElementById('soundToggle');
const soundStatus = document.getElementById('soundStatus');
let isMuted = true;

// 오디오 볼륨 설정
bgm.volume = 0.4;

soundToggle.addEventListener('click', () => {
    if (isMuted) {
        // 재생 시도 (사용자 상호작용 후)
        bgm.play().then(() => {
            isMuted = false;
            soundStatus.innerText = "ON";
            soundStatus.className = "status-on";
        }).catch(err => {
            console.error("Audio play failed:", err);
        });
    } else {
        bgm.pause();
        isMuted = true;
        soundStatus.innerText = "OFF";
        soundStatus.className = "status-off";
    }
});

// 모바일 환경에서 터치 시 오디오 컨텍스트 활성화를 위한 리스너
document.addEventListener('touchstart', () => {
    if (!isMuted && bgm.paused) {
        bgm.play();
    }
}, { once: true });