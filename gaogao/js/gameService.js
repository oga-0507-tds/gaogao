export class GameService {
    constructor() {
        this.hpMap = { white: 1, blue: 3, red: 5 };
        this.colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
        this.anger = 0;        // 犬の怒りゲージ (0-100)
        this.lastClickTime = 0; // 前回のクリック時間
    }

    getColor(idx) {
        return this.colors[idx % this.colors.length];
    }

    // game.js に合わせてメソッド名を変更し、返り値を { bones, trapIdx } に修正
    generateInitialBoard() {
        // ゲーム開始時に怒りと時間をリセット
        this.anger = 0;
        this.lastClickTime = 0;

        const types = ['white', 'blue', 'red'];
        const bones = [];
        for (let i = 0; i < 24; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            bones.push({
                id: i,
                type: type,
                maxHp: this.hpMap[type],
                currentHp: this.hpMap[type],
                isTaken: false,
                isTrap: false
            });
        }
        
        // トラップを1つ設定
        const trapIdx = Math.floor(Math.random() * 24);
        bones[trapIdx].isTrap = true;
        
        return { bones, trapIdx };
    }

    // game.js に合わせて引数と処理を修正
    processClick(bone, id, trapIdx) {
        const now = Date.now();
        // 初回クリック時は経過時間を無視（長い時間とみなす）
        const timeDiff = this.lastClickTime === 0 ? 2000 : now - this.lastClickTime;
        this.lastClickTime = now;

        // --- 連打判定ロジック ---
        if (timeDiff < 500) { 
            // 0.5秒未満の連打：怒りが急上昇
            this.anger += 15;
        } else if (timeDiff < 1000) {
            // 1秒未満：少し怒る
            this.anger += 5;
        } else {
            // 時間を置くと少し落ち着く
            this.anger = Math.max(0, this.anger - 10);
        }

        bone.currentHp--;
        let isGameOver = false;
        
        // 怒りが頂点(100)に達すると、トラップ関係なく強制的に起きる
        if (this.anger >= 100) {
            isGameOver = true;
        }

        if (bone.isTrap) {
            // 怒っているほど起きる確率が上がる (基本20% + 怒り補正)
            const wakeChance = 0.2 + (this.anger / 200); 
            if (bone.currentHp <= 0 || Math.random() < wakeChance) {
                isGameOver = true;
            }
        }

        // View表示用の怒りレベル (0:通常, 1:イライラ, 2:激怒)
        let angerLevel = 0;
        if (this.anger > 75) angerLevel = 2;
        else if (this.anger > 30) angerLevel = 1;

        return { isWaking: isGameOver, angerLevel, anger: this.anger };
    }
}