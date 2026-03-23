/**
 * NameInput View: 各プレイヤーの名前設定
 */
export function NameInput(state) {
    let inputs = "";
    for (let i = 0; i < state.playerCount; i++) {
        const p = state.players[i] || { name: `プレイヤー ${i+1}`, color: '#fff' };
        inputs += `
            <div class="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                <div class="w-4 h-4 rounded-full" style="background:${p.color}"></div>
                <input type="text" placeholder="なまえ..." value="${p.name}"
                    class="bg-transparent border-none outline-none text-white w-full font-black text-lg"
                    onchange="window.game.savePlayerName(${i}, this.value)">
            </div>
        `;
    }

    return `
        <div class="w-full max-w-sm animate-in slide-in-from-right duration-300">
            <h2 class="text-2xl font-black text-center mb-8 text-orange-100 italic">だれがプレイする？</h2>
            <div class="space-y-4 mb-10 max-h-[50vh] overflow-y-auto pr-3 custom-scroll">
                ${inputs}
            </div>
            <div class="flex gap-4">
                <button onclick="window.game.changeView('INIT')" class="flex-1 py-5 bg-zinc-800 rounded-2xl font-bold">もどる</button>
                <button onclick="window.game.startGame()" 
                    class="flex-[2] py-5 bg-orange-600 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none">
                    ゲーム開始！
                </button>
            </div>
        </div>
    `;
}