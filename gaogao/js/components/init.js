/**
 * Init View: タイトルと人数設定
 */
export function Init(state) {
    return `
        <div class="text-center animate-in fade-in duration-500">
            <h1 class="text-6xl font-black text-orange-500 mb-2 italic drop-shadow-[0_5px_0_#9a3412]">番犬モコモコ</h1>
            <p class="text-orange-200/50 text-xs mb-12 tracking-[0.5em] font-bold">SURVIVAL EDITION</p>
            
            <div class="bg-amber-950/40 p-10 rounded-[3.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
                <p class="text-orange-100 font-bold mb-4">
                    プレイ人数: <span class="text-3xl text-orange-500 font-black">${state.playerCount}</span>
                </p>
                <input type="range" min="2" max="6" value="${state.playerCount}" 
                    class="w-full h-3 bg-amber-900 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-10"
                    oninput="window.game.updatePlayerCount(this.value)">
                
                <button onclick="window.game.changeView('NAME_INPUT')" 
                    class="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white font-black text-2xl rounded-3xl shadow-[0_8px_0_#9a3412] active:translate-y-2 active:shadow-none transition-all">
                    なまえ入力へ
                </button>
            </div>
        </div>
    `;
}
