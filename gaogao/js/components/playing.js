export function Playing(state) {
    const activePlayer = state.players[state.currentIdx];
    // ゲームオーバー状態なら怒った画像、それ以外なら寝ている画像
    const dogImage = state.gameOver ? './src/img/dog_angry.png' : './src/img/dog_sleeping.png';
    
    // 怒りレベルに応じたアニメーション設定
    // Lv0: 通常の呼吸
    // Lv1: 少し揺れる/速い呼吸 (animate-pulse)
    // Lv2: 激しく揺れる/拡大 (scale-110 + animate-bounceの代用としてpulseを高速に見せるなど)
    let dogAnimClass = 'dog-breathing';
    if (state.angerLevel === 1) {
        dogAnimClass = 'animate-pulse scale-105 duration-700'; // ドキドキ
    } else if (state.angerLevel >= 2) {
        dogAnimClass = 'animate-pulse scale-110 duration-100'; // ビクビク（高速）
    }

    // 怒りゲージの色設定
    let angerColor = 'bg-green-500';
    if (state.anger > 75) angerColor = 'bg-red-600 animate-pulse';
    else if (state.anger > 40) angerColor = 'bg-yellow-500';

    // 残りの本数をカウント
    const counts = {
        white: state.bones.filter(b => b.type === 'white' && !b.isTaken).length,
        blue: state.bones.filter(b => b.type === 'blue' && !b.isTaken).length,
        red: state.bones.filter(b => b.type === 'red' && !b.isTaken).length
    };

    // 骨のビジュアルを生成するヘルパー
    const renderBone = (color, sizeClass = "w-2.5 h-7", dotSize = "w-2 h-2") => `
        <div class="relative ${sizeClass} mx-auto" style="background: ${color}; border-radius: 4px; transition: all 0.3s ease;">
            <!-- 骨の上側の関節 -->
            <div class="absolute -top-1 -left-1 ${dotSize} rounded-full" style="background: ${color};"></div>
            <div class="absolute -top-1 -right-1 ${dotSize} rounded-full" style="background: ${color};"></div>
            <!-- 骨の下側の関節 -->
            <div class="absolute -bottom-1 -left-1 ${dotSize} rounded-full" style="background: ${color};"></div>
            <div class="absolute -bottom-1 -right-1 ${dotSize} rounded-full" style="background: ${color};"></div>
        </div>
    `;

    return `
        <div class="w-full flex flex-col items-center animate-in fade-in h-dvh justify-between py-1 overflow-hidden">
            <!-- 1. 犬のステージ（中央） -->
            <div id="stage" class="relative w-full flex-1 min-h-0 bg-amber-900/5 rounded-[2rem] flex flex-col items-center justify-center p-1 mb-1 overflow-hidden">
                <!-- 残り時間（左上） -->
                <div class="absolute top-2 left-4 bg-black/60 px-3 py-1 rounded-xl border border-white/20 z-20">
                     <span class="text-[10px] text-white/70 font-bold uppercase block leading-none">LIMIT</span>
                     <span class="text-xl font-black text-white font-mono" id="timer-display">${state.timeLeft}</span>
                     <span class="text-[10px] text-white/50">sec</span>
                </div>

                <!-- 現在のターンプレイヤーのポイント表示 -->
                <div class="absolute top-2 right-4 bg-black/60 px-4 py-1 rounded-xl border border-yellow-500/50 text-right z-20">
                    <span class="text-[10px] text-yellow-500 font-bold uppercase block leading-none">${activePlayer.name}'s Score</span>
                    <span class="text-xl font-black text-white" id="current-active-score">${activePlayer.score || 0}<span class="text-xs ml-1">pt</span></span>
                </div>

                <!-- 犬のグラフィック -->
                <div class="dog-container ${state.gameOver ? '' : dogAnimClass} mb-0 relative z-10 transition-all shrink-0">
                    <img src="${dogImage}" alt="番犬" class="h-20 max-h-[15vh] w-auto object-contain drop-shadow-xl" />
                </div>

                <!-- 丸いお皿 -->
                <div class="relative w-full max-w-[160px] aspect-square shrink bg-[#1a0f08] rounded-full p-4 flex flex-wrap gap-2 justify-center items-center border-4 border-amber-900/40 border-t-8 border-t-black shadow-2xl overflow-hidden">
                    <div class="flex flex-wrap justify-center items-center gap-1 w-full h-full">
                        ${state.bones.filter(b => !b.isTaken).map((b, i) => {
                            const rotation = (i * 137.5) % 360;
                            const color = b.type === 'white' ? '#f5f5f5' : b.type === 'blue' ? '#3b82f6' : '#ef4444';
                            
                            return `
                                <div style="transform: rotate(${rotation}deg); flex-shrink: 0; margin: 2px;">
                                    ${renderBone(color)}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 怒りゲージ（ステージ下部） -->
                <div class="absolute bottom-4 w-48 h-2 bg-black/40 rounded-full overflow-hidden z-20 backdrop-blur-sm border border-white/5">
                    <div class="h-full ${angerColor} transition-all duration-300 ease-out shadow-[0_0_10px_currentColor]" style="width: ${state.anger}%"></div>
                </div>
                <div class="absolute bottom-1 text-[8px] font-black text-white/30 uppercase tracking-[0.2em] z-20">Danger Level</div>
            </div>

            <!-- 2. 状態メッセージ -->
            <div class="mb-2 text-center">
                <div class="inline-block px-6 py-1.5 rounded-full bg-black/40 border font-bold text-base mb-1" 
                     style="color: ${activePlayer.color}; border-color: ${activePlayer.color}44">
                    ${state.lastMessage}
                </div>
            </div>

            <!-- 3. 骨の選択ボタン（ポイント設定の明示） -->
            <div class="grid grid-cols-3 gap-1 w-full max-sm mb-1 px-2 shrink-0">
                <!-- White (1pt) -->
                <button onclick="window.game.handleBoneSelect('white', 1)" ${counts.white === 0 ? 'disabled' : ''}
                    class="group flex flex-col items-center p-1 bg-white/5 rounded-xl border-2 border-white/10 disabled:opacity-10 active:scale-95 transition-all">
                    <div class="mb-2">
                        ${renderBone('#f5f5f5', 'w-3 h-8', 'w-2.5 h-2.5')}
                    </div>
                    <div class="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black text-white mb-1">1 pt</div>
                    <span class="text-xs font-black uppercase text-white">White</span>
                    <span class="text-[9px] text-white/50">あと${counts.white}本</span>
                </button>

                <!-- Blue (3pt) -->
                <button onclick="window.game.handleBoneSelect('blue', 3)" ${counts.blue === 0 ? 'disabled' : ''}
                    class="group flex flex-col items-center p-1 bg-blue-900/10 rounded-xl border-2 border-blue-500/20 disabled:opacity-10 active:scale-95 transition-all">
                    <div class="mb-2">
                        ${renderBone('#3b82f6', 'w-3 h-8', 'w-2.5 h-2.5')}
                    </div>
                    <div class="bg-blue-500/20 px-2 py-0.5 rounded text-[10px] font-black text-blue-400 mb-1">3 pt</div>
                    <span class="text-xs font-black uppercase text-blue-400">Blue</span>
                    <span class="text-[9px] text-blue-400/50">あと${counts.blue}本</span>
                </button>

                <!-- Red (5pt) -->
                <button onclick="window.game.handleBoneSelect('red', 5)" ${counts.red === 0 ? 'disabled' : ''}
                    class="group flex flex-col items-center p-1 bg-red-900/10 rounded-xl border-2 border-red-500/20 disabled:opacity-10 active:scale-95 transition-all">
                    <div class="mb-2">
                        ${renderBone('#ef4444', 'w-3 h-8', 'w-2.5 h-2.5')}
                    </div>
                    <div class="bg-red-500/20 px-2 py-0.5 rounded text-[10px] font-black text-red-400 mb-1">5 pt</div>
                    <span class="text-xs font-black uppercase text-red-400">Red</span>
                    <span class="text-[9px] text-red-400/50">あと${counts.red}本</span>
                </button>
            </div>

            <!-- 4. 全プレイヤーの現在のポイント（リアルタイムランキング表示） -->
            <div class="w-full max-w-sm bg-black/20 rounded-xl p-1 border border-white/5 shrink-0">
                <div class="flex flex-wrap justify-center gap-2">
                    ${state.players.map((p, i) => {
                        const currentScore = p.score || 0;
                        const isActive = i === state.currentIdx;
                        
                        return `
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isActive ? 'bg-white/10 scale-105 border-white/40 ring-1 ring-white/20' : 'bg-transparent opacity-60 border-transparent'}" 
                             style="${isActive ? '' : `border-color: ${p.color}22`}">
                            <div class="w-5 h-5 rounded flex items-center justify-center font-black text-[10px]" style="background: ${p.color}; color: #000">
                                ${p.name[0]}
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold text-white/80 leading-none">${p.name}</span>
                                <span class="text-xs font-black" style="color: ${p.color}">${currentScore} <span class="text-[8px] opacity-70">pt</span></span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}