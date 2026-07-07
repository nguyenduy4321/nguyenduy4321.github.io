// Khởi tạo các module Matter.js
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Events = Matter.Events,
      Query = Matter.Query;

async function init() {
    let repos = [];
    try {
        const response = await fetch('https://api.github.com/users/nguyenduy4321/repos');
        const data = await response.json();
        repos = data.map(repo => ({ 
            name: repo.name, 
            url: repo.html_url,
            description: repo.description || 'Dự án này chưa có mô tả (No description available)'
        }));
    } catch (e) {
        console.error("Lỗi khi tải repos", e);
        repos = [{name: 'Lỗi tải dữ liệu', url: '#', description: 'Có lỗi xảy ra khi gọi API.'}];
    }

    if (repos.length === 0) return;

    const engine = Engine.create();
    const world = engine.world;

    const isMobile = window.innerWidth <= 768;
    const FONT_SIZE = isMobile ? 12 : 20;
    const STAR_COUNT = isMobile ? 40 : 200;
    const MAX_BODIES = isMobile ? 35 : 120;

    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: 1 // Ép pixel ratio = 1 để chống giật lag trên máy cấu hình yếu/màn hình DPI cao
        }
    });

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    const wallOptions = { 
        isStatic: true, 
        render: { visible: false } 
    };
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth * 2, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, window.innerHeight, 100, window.innerHeight * 2, wallOptions);
    const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight, 100, window.innerHeight * 2, wallOptions);
    
    // Gắn tag ground để nhận biết va chạm sàn
    ground.label = 'ground';

    Composite.add(world, [ground, leftWall, rightWall]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.1, 
            render: { visible: false }
        }
    });
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    window.addEventListener('resize', () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 50 });
        Matter.Body.setPosition(leftWall, { x: -50, y: window.innerHeight });
        Matter.Body.setPosition(rightWall, { x: window.innerWidth + 50, y: window.innerHeight });
    });

    let lastTapTime = 0;
    render.canvas.addEventListener('pointerdown', (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 400 && tapLength > 0) {
            // Double click / Double tap
            const mousePosition = mouse.position;
            const hovered = Query.point(bodiesWithText, mousePosition);
            if (hovered.length > 0) {
                let targetUrl = hovered[0].plugin.url;
                let newWindow = window.open(targetUrl, '_blank');
                // Fallback cho Safari iOS chặn popup
                if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                    window.location.href = targetUrl;
                }
            }
        }
        lastTapTime = currentTime;
    });

    let bodiesWithText = [];
    let currentHoveredBody = null;
    let repoIndex = 0; 
    let isGameOver = false;
    const bgTextDiv = document.getElementById('bg-text');
    let currentShowingDesc = "";
    let typingInterval = null;
    
    // --- STATE CHO ACTIVE TEXT VÀ GLOW TÀNG HÌNH ---
    let activeBody = null;
    let isTyping = false;
    let isFadingOut = false;
    let fadeStartTime = 0;
    const FADE_DURATION = 10000; // 10 giây
    
    // --- GAME STATE ---
    let currentHue = null;
    let glowingColor = '#00f3ff'; 
    let isWarping = false;
    let warpStars = [];
    let currentGravity = 1; 
    let shakeAmount = 0;
    
    for (let i = 0; i < STAR_COUNT; i++) {
        warpStars.push({
            x: (Math.random() - 0.5) * window.innerWidth * 2,
            y: (Math.random() - 0.5) * window.innerHeight * 2,
            z: Math.random() * 1000
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    shuffleArray(repos);

    function changeUniverseColor(isInitial = false) {
        if (currentHue === null) {
            currentHue = Math.floor(Math.random() * 360);
        } else {
            let nextHue;
            let diff;
            do {
                nextHue = Math.floor(Math.random() * 360);
                diff = Math.abs(nextHue - currentHue);
                if (diff > 180) diff = 360 - diff;
            } while (diff < 90); 
            currentHue = nextHue;
        }
        
        glowingColor = `hsl(${currentHue}, 100%, 60%)`;
        
        if (isInitial) {
            document.body.style.transition = 'none';
        } else {
            document.body.style.transition = 'background 2s ease-in-out';
        }
        document.body.style.background = `radial-gradient(circle at center, hsla(${currentHue}, 100%, 15%, 1) 0%, #090a0f 100%)`;
    }

    changeUniverseColor(true);

    function startWarpSequence() {
        isWarping = true;
        
        changeUniverseColor(false);
        
        currentGravity = 0.2 + Math.random() * 2.3;
        engine.gravity.y = currentGravity;

        if (bgTextDiv) {
            bgTextDiv.style.transition = 'transform 2.5s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 1s';
            bgTextDiv.style.transform = 'translate(-50%, -50%) scale(15)';
            bgTextDiv.style.opacity = '0';
        }

        setTimeout(() => {
            isWarping = false;
            repoIndex = 0;       
            isGameOver = false;  
            shuffleArray(repos); 
            
            if (bgTextDiv) {
                bgTextDiv.style.transition = 'opacity 0.3s ease-in-out';
                bgTextDiv.style.transform = 'translate(-50%, -50%) scale(1)';
                currentShowingDesc = "";
                bgTextDiv.textContent = "";
                activeBody = null;
                isFadingOut = false;
            }

            spawnWord();         
        }, 3000); 
    }

    function typeDescription(desc) {
        if (!desc || isWarping) return;
        if (currentShowingDesc === desc && bgTextDiv.textContent === desc) return;

        currentShowingDesc = desc;
        isTyping = true;
        isFadingOut = false;
        
        bgTextDiv.style.transition = 'opacity 0.3s ease-out';
        bgTextDiv.textContent = ""; 
        bgTextDiv.style.opacity = '1';
        
        if (typingInterval) clearInterval(typingInterval);
        
        let charIndex = 0;
        typingInterval = setInterval(() => {
            if (charIndex < desc.length) {
                bgTextDiv.textContent += desc.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typingInterval);
                isTyping = false;
                
                // Kích hoạt tàng hình ngay lập tức nếu gõ xong mà người dùng ĐÃ BUÔNG chuột ra
                if (!mouseConstraint.body) {
                    isFadingOut = true;
                    fadeStartTime = Date.now();
                    bgTextDiv.style.transition = 'opacity 10s ease-in-out';
                    bgTextDiv.style.opacity = '0';
                }
            }
        }, 30); 
    }

    function spawnWord() {
        if (repoIndex >= repos.length) return;

        // Tối ưu hóa: Không spawn thêm nếu đã có quá nhiều chữ (đặc biệt trên mobile máy yếu)
        if (bodiesWithText.length >= MAX_BODIES) {
            setTimeout(spawnWord, 1500); // Tạm nghỉ 1.5s rồi thử lại
            return;
        }

        const repo = repos[repoIndex];
        repoIndex++; 
        
        const ctx = render.context;
        ctx.font = `bold ${FONT_SIZE}px "Segoe UI", sans-serif`;
        
        const paddingX = FONT_SIZE * 0.4;
        const paddingY = FONT_SIZE * 1.2;
        const width = ctx.measureText(repo.name).width + paddingX; 
        const height = paddingY; 
        
        const x = Math.random() * (window.innerWidth - width) + width / 2;
        const y = -100; 

        let bodyOptions = {
            restitution: 0.2, 
            friction: 0.8,    
            frictionAir: 0.02, 
            chamfer: { radius: height * 0.4 }, 
            render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 }
        };

        const body = Bodies.rectangle(x, y, width, height, bodyOptions);
        
        body.plugin = {
            text: repo.name,
            url: repo.url,
            description: repo.description,
            width: width,
            height: height
        };
        
        Composite.add(world, body);
        bodiesWithText.push(body);

        const ratio = (currentGravity - 0.2) / 2.3; 
        let baseDelay = 100 + ratio * 900; 
        let randomRange = 300 + ratio * 700;
        
        const nextDuration = baseDelay + Math.random() * randomRange;
        setTimeout(spawnWord, nextDuration);
    }
    
    setTimeout(spawnWord, 500);

    Events.on(engine, 'beforeUpdate', function() {
        for (let i = bodiesWithText.length - 1; i >= 0; i--) {
            let body = bodiesWithText[i];
            if (body.position.y > window.innerHeight + 100 || 
                body.position.x < -100 || 
                body.position.x > window.innerWidth + 100 ||
                body.position.y < -2000) {
                Composite.remove(world, body);
                bodiesWithText.splice(i, 1);
            }
        }

        if (!isGameOver && repoIndex > 0 && bodiesWithText.length === 0) {
            isGameOver = true;
            startWarpSequence();
        }
    });

    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            let momentum = Math.max(
                bodyA.mass * bodyA.speed,
                bodyB.mass * bodyB.speed
            );
            
            if (momentum > 15) {
                let impactShake = Math.min(momentum * 0.5, 25);
                if (impactShake > shakeAmount) {
                    shakeAmount = impactShake;
                }
            }
        }
    });

    Events.on(engine, 'afterUpdate', function() {
        const mousePosition = mouse.position;
        const hovered = Query.point(bodiesWithText, mousePosition);
        
        if (hovered.length > 0) {
            currentHoveredBody = hovered[0];
            document.body.style.cursor = 'pointer';
        } else {
            currentHoveredBody = null;
            if (!mouseConstraint.body) {
                document.body.style.cursor = 'default';
            } else {
                document.body.style.cursor = 'grabbing';
            }
        }

        // Logic xử lý khi Đang Hold vs Vừa Buông ra
        if (mouseConstraint.body && mouseConstraint.body.plugin) {
            if (activeBody !== mouseConstraint.body) {
                activeBody = mouseConstraint.body;
                isFadingOut = false;
                typeDescription(activeBody.plugin.description);
            } else {
                // Đang hold tiếp tục (chưa buông) -> giữ mờ đi
                isFadingOut = false;
                bgTextDiv.style.opacity = '1';
                bgTextDiv.style.transition = 'none'; 
            }
        } else if (activeBody) {
            // Người dùng ĐÃ BUÔNG chuột
            if (!isTyping && !isFadingOut) {
                // Đã gõ xong thì mới bắt đầu tính giờ mờ dần
                isFadingOut = true;
                fadeStartTime = Date.now();
                bgTextDiv.style.transition = 'opacity 10s ease-in-out';
                bgTextDiv.style.opacity = '0';
            }
        }

        // Reset bộ nhớ nếu mờ xong
        if (isFadingOut) {
            let elapsed = Date.now() - fadeStartTime;
            if (elapsed >= FADE_DURATION) {
                isFadingOut = false;
                activeBody = null;
                currentShowingDesc = "";
                bgTextDiv.textContent = "";
            }
        }
    });

    Events.on(render, 'afterRender', function() {
        const ctx = render.context;
        
        if (shakeAmount > 0) {
            let dx = (Math.random() - 0.5) * shakeAmount;
            let dy = (Math.random() - 0.5) * shakeAmount;
            
            document.body.style.transform = `translate(${dx}px, ${dy}px)`;
            
            shakeAmount *= 0.85; 
            if (shakeAmount < 0.5) {
                shakeAmount = 0;
                document.body.style.transform = 'translate(0px, 0px)';
            }
        }

        if (isWarping) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            ctx.shadowColor = glowingColor;
            ctx.shadowBlur = 15;
            
            for(let star of warpStars) {
                star.z -= 30; 
                if(star.z <= 0) {
                    star.z = 1000;
                    star.x = (Math.random() - 0.5) * window.innerWidth * 2;
                    star.y = (Math.random() - 0.5) * window.innerHeight * 2;
                }
                
                let sx = centerX + (star.x / star.z) * 800;
                let sy = centerY + (star.y / star.z) * 800;
                
                let size = (1 - star.z / 1000) * 4;
                let tailLength = (1 - star.z / 1000) * 100; 
                
                ctx.beginPath();
                let angle = Math.atan2(sy - centerY, sx - centerX);
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx - Math.cos(angle) * tailLength, sy - Math.sin(angle) * tailLength);
                ctx.lineWidth = size;
                ctx.strokeStyle = glowingColor;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${FONT_SIZE}px "Segoe UI", sans-serif`;

        for (let body of bodiesWithText) {
            let isHovered = (body === currentHoveredBody);
            let isActive = (body === activeBody);
            
            // Tính toán Glow Opacity
            let glowOpacity = 0;
            if (isActive) {
                if (isFadingOut) {
                    let elapsed = Date.now() - fadeStartTime;
                    glowOpacity = Math.max(0, 1 - (elapsed / FADE_DURATION));
                } else {
                    glowOpacity = 1; // Đang hold hoặc đang typing
                }
            }
            // Hover cứng luôn ưu tiên = 1
            if (isHovered) {
                glowOpacity = 1;
            }

            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            
            // Vẽ lớp cơ bản (Xám, không phát sáng)
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#dcdde1';
            ctx.fillText(body.plugin.text, 0, 0); // Vẽ ngay tâm (0,0) vì đã bỏ setCentre
            
            // Vẽ đè lớp Glow (tàng hình dần theo glowOpacity)
            if (glowOpacity > 0) {
                // Tăng độ sáng (lightness) lên 75% thay vì 60% để chữ nổi bật hơn
                ctx.shadowColor = `hsla(${currentHue}, 100%, 75%, ${glowOpacity})`;
                ctx.shadowBlur = 25 * glowOpacity;
                ctx.fillStyle = `rgba(255, 255, 255, ${glowOpacity})`;
                ctx.fillText(body.plugin.text, 0, 0);
            }
            
            ctx.rotate(-body.angle);
            ctx.translate(-body.position.x, -body.position.y);
            
            ctx.shadowBlur = 0;
        }
    });
}

init();
