/**
 * GameOver View: ゲーム終了のリザルト
 */
export function GameOver(state) {
    const loser = state.players[state.currentIdx];
    
    // スコア順（降順）にソート
    const sortedPlayers = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <!-- pb-32を追加して全体を上にずらし、プレイ画面の下部ボタンと被らないようにする -->
            <div class="text-center w-full pb-32">
                <div class="mb-4 drop-shadow-2xl">
                    <img src="./src/img/dog_angry.png" class="h-40 max-h-[25vh] w-auto object-contain mx-auto animate-bounce" alt="Angry Dog">
                </div>
                <h2 class="text-5xl font-black text-white mb-2 italic tracking-tighter shadow-orange-900">ガオガオッ！！</h2>
                <p class="text-xl text-orange-100 mb-6">
                    <span class="font-black px-4 py-1 rounded-lg bg-white/10" style="color: ${loser.color}">${loser.name}</span> が噛まれました...
                </p>

                <!-- 結果発表（ランキング） -->
                <div class="bg-black/30 rounded-2xl p-3 mb-8 mx-auto max-w-xs border border-white/10">
                    <div class="space-y-1">
                        ${sortedPlayers.map((p, i) => `
                            <div class="flex items-center justify-between px-3 py-2 rounded-lg ${p.id === loser.id ? 'bg-red-500/20' : 'bg-transparent'}">
                                <span class="text-sm font-bold text-white/70 w-4">#${i + 1}</span>
                                <span class="text-base font-bold text-white flex-1 text-left px-2" style="color: ${p.color}">${p.name}</span>
                                <span class="text-lg font-black text-white">${p.score || 0}<span class="text-xs font-normal opacity-60 ml-1">pt</span></span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="space-y-3 max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 1.2s; animation-fill-mode: both;">
                    <button onclick="window.game.startGame()" disabled
                        class="game-over-btn w-full py-5 bg-white text-red-900 font-black text-xl rounded-3xl shadow-2xl active:scale-95 transition-all opacity-50 cursor-not-allowed">
                        もういちど！
                    </button>
                    <button onclick="window.game.changeView('INIT')" disabled
                        class="game-over-btn w-full py-3 bg-transparent border-2 border-white/20 text-white/50 font-bold rounded-2xl opacity-50 cursor-not-allowed">
                        タイトルへもどる
                    </button>
                </div>
            </div>
        </div>
    `;
}