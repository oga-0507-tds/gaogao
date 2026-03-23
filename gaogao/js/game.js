import { GameService } from './gameService.js';
import { Init } from './components/init.js';
import { NameInput } from './components/name-input.js';
import { Playing } from './components/playing.js';
import { GameOver } from './components/game-over.js';

/**
 * GameController: 全体の状態管理と画面遷移を担当
 */
class GameController {
    constructor() {
        this.service = new GameService();
        this.state = {
            view: 'INIT',
            playerCount: 4,
            players: [],
            bones: [],
            currentIdx: 0,
            gameOver: false,
            trapIdx: -1,
            angerLevel: 0, // 0:静か, 1:揺れる, 2:激しい
            anger: 0,      // 怒りゲージ用 (0-100)
            timeLeft: 10,       // 制限時間
            selectedBoneType: null, // 現在のターンで選択中の骨の色
            lastMessage: "準備ができたらスタート！"
        };
        this.timerInterval = null;
        
        // HTMLのonclick等からアクセスできるようにグローバルに公開
        window.game = this;

        // iPhone対応: 振動の代わりに画面を揺らすスタイルを定義
        this.setupStyles();
    }

    // 画面のレンダリング
    render() {
        const app = document.getElementById('app');
        if (!app) return;
        
        app.innerHTML = '';

        switch (this.state.view) {
            case 'INIT':
                app.innerHTML = Init(this.state);
                break;
            case 'NAME_INPUT':
                app.innerHTML = NameInput(this.state);
                break;
            case 'PLAYING':
                app.innerHTML = Playing(this.state);
                break;
            case 'GAME_OVER':
                // プレイ画面を背景に、ゲームオーバー画面を重ねる
                app.innerHTML = Playing(this.state) + GameOver(this.state);
                // 誤操作防止のため、少し待ってからボタンを有効化
                setTimeout(() => {
                    const btns = document.querySelectorAll('.game-over-btn');
                    btns.forEach(btn => {
                        btn.disabled = false;
                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                        btn.classList.add('animate-pulse'); // 押せるようになったことを強調
                    });
                }, 2000); // 2秒間ロック
                this.triggerExplosionEffects();
                break;
        }
    }

    // プレイヤー人数の変更
    updatePlayerCount(n) {
        this.state.playerCount = parseInt(n);
        this.render();
    }

    // 画面切り替え
    changeView(view) {
        this.state.view = view;
        this.render();
    }

    // プレイヤー名の保存
    savePlayerName(idx, name) {
        if (!this.state.players[idx]) {
            this.state.players[idx] = { id: idx, color: this.service.getColor(idx) };
        }
        this.state.players[idx].name = name || `プレイヤー ${idx + 1}`;
    }

    // ゲーム開始処理
    startGame() {
        this.stopTimer();
        // 名前未入力のプレイヤーを自動生成
        for (let i = 0; i < this.state.playerCount; i++) {
            if (!this.state.players[i]) this.savePlayerName(i, "");
            this.state.players[i].score = 0;
        }
        
        const board = this.service.generateInitialBoard();
        this.state.bones = board.bones;
        this.state.trapIdx = board.trapIdx;
        this.state.currentIdx = 0;
        this.state.gameOver = false;
        this.state.angerLevel = 0;
        this.state.anger = 0;
        this.state.selectedBoneType = null;
        this.state.view = 'PLAYING';
        this.state.lastMessage = `${this.state.players[0].name} の番です！`;
        this.startTimer();
        this.render();
    }

    // タイマー開始
    startTimer() {
        this.stopTimer();
        this.state.timeLeft = 10;
        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            // 画面の数字だけ更新（全体再描画は重いため）
            const timerEl = document.getElementById('timer-display');
            if (timerEl) timerEl.innerText = this.state.timeLeft;

            if (this.state.timeLeft <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }

    // タイマー停止
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // 時間切れ処理
    handleTimeUp() {
        this.stopTimer();
        this.state.lastMessage = "時間切れ！犬が目を覚ました！";
        
        // 強制ゲームオーバー演出
        if (navigator.vibrate) navigator.vibrate(1000);
        this.triggerVisualShake('hard');
        
        this.state.gameOver = true;
        this.state.view = 'GAME_OVER';
        this.render();
    }

    // 骨をクリックした時の処理
    handleBoneSelect(type, points) {
    if (this.state.gameOver) return;
    
    // すでに他の色を叩き始めている場合は、その色以外タップ不可
    if (this.state.selectedBoneType && this.state.selectedBoneType !== type) {
        return;
    }
    // まだ色が未定なら、この色で固定する
    if (!this.state.selectedBoneType) {
        this.state.selectedBoneType = type;
    }

    // 1人あたりの制限時間にするため、ここではタイマーを止めない（継続）

    // 指定された色の「まだ取られていない骨」を1つ探す
    const targetBone = this.state.bones.find(b => b.type === type && !b.isTaken);
    
    if (targetBone) {
        // Serviceの判定処理を呼び出し（以前と同じロジックが使えます）
        const result = this.service.processClick(targetBone, targetBone.id, this.state.trapIdx);

        // 怒りレベルを更新
        this.state.angerLevel = result.angerLevel;
        this.state.anger = result.anger;

        // 1. Android等向けのバイブレーション
        if (navigator.vibrate) {
            if (result.isWaking) {
                navigator.vibrate(1000); // ガオガオ！（1秒間 長く震える）
            } else if (this.state.angerLevel >= 2) {
                navigator.vibrate([80, 50, 80]); // 激怒（短く2回 ドクン、ドクン）
            } else if (this.state.angerLevel === 1) {
                navigator.vibrate(40); // イライラ（一瞬だけ ブルッ）
            }
        }

        // 2. iPhone等向けの「画面揺れ」演出 (Visual Shake)
        if (result.isWaking) {
            this.triggerVisualShake('hard');
        } else if (this.state.angerLevel >= 2) {
            this.triggerVisualShake('hard');
        } else if (this.state.angerLevel === 1) {
            this.triggerVisualShake('gentle');
        }

        if (result.isWaking) {
            this.stopTimer();
            this.state.gameOver = true;
            this.state.view = 'GAME_OVER';
        } else {
            if (targetBone.currentHp <= 0) {
                // 骨ゲット処理
                targetBone.isTaken = true;
                const player = this.state.players[this.state.currentIdx];
                player.score = (player.score || 0) + points;
                
                // 骨が取れたら少し安心するので怒りレベルをリセット表示にする
                this.state.angerLevel = 0;
                this.state.anger = Math.max(0, this.state.anger - 10); // ゲージも少し下げる
                
                // 色のロックを解除
                this.state.selectedBoneType = null;

                // 交代
                this.state.currentIdx = (this.state.currentIdx + 1) % this.state.playerCount;
                this.state.lastMessage = `${this.state.players[this.state.currentIdx].name} の番です！`;
                
                // 次のターンへ（タイマー再開）
                this.startTimer();
            } else {
                // 連打継続中
                const angerMsg = this.state.angerLevel >= 2 ? "（起きそうだぞ！！）" : 
                               this.state.angerLevel === 1 ? "（うなっている...）" : "";
                this.state.lastMessage = `${type.toUpperCase()}をあと ${targetBone.currentHp} 回！${angerMsg}`;
                
                // 1人あたりの制限時間なので、リセットせず継続
            }
        }
        this.render();
    }
}

    // 画面揺れアニメーションの定義（CSS）
    setupStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes shake-gentle {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(-2px, 1px); }
                75% { transform: translate(2px, -1px); }
            }
            @keyframes shake-hard {
                0% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-4px, 4px) rotate(-2deg); }
                40% { transform: translate(4px, -4px) rotate(2deg); }
                60% { transform: translate(-4px, 4px) rotate(-2deg); }
                80% { transform: translate(4px, -4px) rotate(2deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
            .shake-gentle { animation: shake-gentle 0.3s ease-in-out; }
            .shake-hard { animation: shake-hard 0.4s ease-in-out; }
        `;
        document.head.appendChild(style);
    }

    // 実際に画面（ステージ）を揺らす処理
    triggerVisualShake(level) {
        const stage = document.getElementById('stage');
        if (!stage) return;
        
        // アニメーションをリセットして再生
        stage.classList.remove('shake-gentle', 'shake-hard');
        void stage.offsetWidth; // リフロー発生
        
        stage.classList.add(level === 'hard' ? 'shake-hard' : 'shake-gentle');
    }

    // ゲームオーバー時の演出
    triggerExplosionEffects() {
        setTimeout(() => {
            const dog = document.querySelector('.dog-container');
            const stage = document.querySelector('#stage');
            if (dog) {
                dog.classList.remove('dog-breathing');
                dog.classList.add('dog-jump');
            }
            if (stage) stage.classList.add('shake-screen');
        }, 50);
    }
}

// 起動
const controller = new GameController();
window.onload = () => controller.render();
