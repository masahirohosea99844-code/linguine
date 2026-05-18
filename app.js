// 1. スプレッドシート（GAS）のURLを設定する
// 👇「」の中身を、あなたがメモしたURLに丸ごと書き換えてください！
const API_URL = "https://script.google.com/macros/s/AKfycbx6qxrxEHWjJOTzG8MmZWioE6MfS3IcNfKRY53StRPwfE-CNpaA848P8H8_KdhU7Iwh/exec";

// 2. データを保存しておくための空の箱（変数）
let wordsFirst = [];  // 前半の言葉を入れる箱
let wordsSecond = []; // 後半の言葉を入れる箱

//速度を変えるための変数
let speedFirst = 50;  // 前半のスロットの速度（ミリ秒）
let speedSecond = 50; // 後半のスロットの速度（ミリ秒）

// 👇【ここを追加！】回数を数えるための数字の箱
let spinCount = 0;

// 演出用のタイマーと状態を管理する変数
let effectTimer = null;

// 3. 画面が読み込まれたら、自動的にスプレッドシートのデータを取ってくる命令
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// 4. データをインターネット越しに取ってくる（fetch）関数
function fetchData() {
    console.log("データを読み込み中...");
    
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            wordsFirst = data.firstWords || [];
            wordsSecond = data.lastWords || [];
            
            console.log("データの読み込みが成功しました！", data);
            
            // データが届いたので、統合ボタンを活性化（有効化）する
            const btnSlot = document.getElementById('btnSlot');
            btnSlot.disabled = false;          // グレーアウトを解除
            btnSlot.textContent = "スタート！"; // 文字をスロット開始用に変更
            
            // 念のため、チェックボックスが最初から両方オンだった場合のガードも走らせる
            checkLockStatus();
        })
        .catch(error => {
            console.error("データの読み込みに失敗しました:", error);
            alert("データの読み込みに失敗しました。URLが正しいか確認してください。");
            
            // エラーで止まってしまった場合は、ボタンの文字をエラー表示に変える
            document.getElementById('btnSlot').textContent = "読み込み失敗";
        });
}

// 5. スロットの状態を管理する変数（タイマーの番号を入れておく場所）
let timerFirst = null;
let timerSecond = null;

// 👇【ここを追加！】スロットが動いているかどうかを記録するフラグ（false = 止まっている）
let isSpinning = false;

// 👇【ここを追加！】ボタンが押されたときに、スタートかストップかを自動で判断して切り替える関数
function toggleSlot() {
    const btnSlot = document.getElementById('btnSlot');

    if (!isSpinning) {
        // ① 止まっている時に押されたら 👉 スロットをスタートさせる！
        isSpinning = true;
        btnSlot.textContent = "ストップ！"; // ボタンの見た目をストップに変える
        btnSlot.classList.add('running');  // (お好みで)動いている時のCSSデザイン用
        
        startSlot(); // 今まで使っていたスタートの処理を呼び出す
    } else {
        // ② 動いている時に押されたら 👉 スロットをストップさせる！
        isSpinning = false;
        btnSlot.textContent = "スタート！"; // ボタンの見た目をスタートに戻す
        btnSlot.classList.remove('running');
        
        stopSlot(); // 今まで使っていたストップの処理を呼び出す
    }
}

// 6. 「スタート」の内部処理（ボタンの制御コードを削除しました）
function startSlot() {
    document.getElementById('displayFirst').classList.remove('win-effect');
    document.getElementById('displaySecond').classList.remove('win-effect');

    stopSlotFirst();
    stopSlotSecond();

    if (!document.getElementById('lockFirst').checked) {
        timerFirst = setInterval(() => {
            if (wordsFirst.length > 0) {
                const randomIndex = Math.floor(Math.random() * wordsFirst.length);
                document.getElementById('displayFirst').textContent = wordsFirst[randomIndex];
            }
        }, speedFirst);
    }

    if (!document.getElementById('lockSecond').checked) {
        timerSecond = setInterval(() => {
            if (wordsSecond.length > 0) {
                const randomIndex = Math.floor(Math.random() * wordsSecond.length);
                document.getElementById('displaySecond').textContent = wordsSecond[randomIndex];
            }
        }, speedSecond);
    }
}

// 7. 前半のスロットを止める命令
function stopSlotFirst() {
    clearInterval(timerFirst);
    timerFirst = null;
}

// 8. 後半のスロットを止める命令
function stopSlotSecond() {
    clearInterval(timerSecond);
    timerSecond = null;
}

// 9. 「ストップ」の内部処理（ボタンの制御コードを削除しました）
function stopSlot() {
    checkLockStatus();
    stopSlotFirst();
    stopSlotSecond();
    
    const displayFirst = document.getElementById('displayFirst');
    const displaySecond = document.getElementById('displaySecond');
    
    displayFirst.classList.remove('win-effect');
    displaySecond.classList.remove('win-effect');
    
    setTimeout(() => {
        displayFirst.classList.add('win-effect');
        displaySecond.classList.add('win-effect');
        generateOverlayImage();
        
        spinCount++;
        document.getElementById('totalSpins').textContent = spinCount;
        
        sendLogToBackend(displayFirst.textContent, displaySecond.textContent);
    }, 10);
}

// 10. 確定した文字から画像を自動生成し、画面に重ねて表示する関数
function generateOverlayImage() {
    const text1 = document.getElementById('displayFirst').textContent;
    const text2 = document.getElementById('displaySecond').textContent;
    
    if (text1 === "???" || text2 === "???") return;

    // --- 1. 文字数に合わせてキャンバスの横幅を自動計算 ---
    const calcCanvas = document.createElement('canvas');
    const calcCtx = calcCanvas.getContext('2d');
    calcCtx.font = '900 80px "Noto Sans JP", "Arial Black", "Impact", sans-serif';
    
    const width1 = calcCtx.measureText(text1).width;
    const width2 = calcCtx.measureText(text2).width;
    const maxTextWidth = Math.max(width1, width2);
    
    let canvasWidth = 500;
    if (maxTextWidth + 60 > 500) {
        canvasWidth = Math.floor(maxTextWidth + 60);
    }
    
    const canvasHeight = 500;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 2. パチンコ風・ド派手な背景（黒〜赤〜黒の激しいグラデーション）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, '#110000');
    bgGradient.addColorStop(0.3, '#440000');
    bgGradient.addColorStop(0.5, '#aa0000');
    bgGradient.addColorStop(0.7, '#440000');
    bgGradient.addColorStop(1, '#110000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 3. ギザギザ・稲妻風の飾り枠（ゴールド）
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 14;
    ctx.strokeRect(15, 15, canvasWidth - 30, canvasHeight - 30);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, canvasWidth - 44, canvasHeight - 44);
    
    // 4. パチンコ風の文字を描画するインナールーチン
    function drawPachinkoText(text, x, y) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = 80;
        ctx.font = `900 ${fontSize}px "Noto Sans JP", "Arial Black", "Impact", sans-serif`;

        // --- 重厚な多層フチ取り描画（カラー微調整版） ---
        
        // 🌟1層目：一番外側のフチを「黒」から「白」に変更！
        // これで暗い背景から文字の形がクッキリ浮き出ます！
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = fontSize * 0.45; // 少しだけ太くして存在感をアップ
        ctx.lineJoin = 'miter';
        ctx.strokeText(text, x, y);

        // 2層目：外側のフチ（赤・オレンジのグラデーション）
        // 白フチの内側に入るため、引き締め役として機能します
        const borderGrad = ctx.createLinearGradient(x, y - fontSize/2, x, y + fontSize/2);
        borderGrad.addColorStop(0, '#ff9500');
        borderGrad.addColorStop(0.5, '#c70000');
        borderGrad.addColorStop(1, '#220000'); // 底辺はさらに濃くして立体感を強調
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = fontSize * 0.28;
        ctx.strokeText(text, x, y);

        // 3層目：文字の斜め下の影（境界線をさらにクッキリさせるため黒に変更）
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.12;
        ctx.strokeText(text, x + (fontSize * 0.05), y + (fontSize * 0.05));

        // 4層目：メインカラー（ゴールド）
        const textGrad = ctx.createLinearGradient(x, y - fontSize/2, x, y + fontSize/2);
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.25, '#ffff00');
        textGrad.addColorStop(0.75, '#ffaa00');
        textGrad.addColorStop(1, '#ff4400');

        ctx.fillStyle = textGrad;
        ctx.fillText(text, x, y);

        ctx.restore();
    }
    
    // 5. 新しいキャンバスの中心を狙ってドカンと描画
    const centerX = canvasWidth / 2;
    drawPachinkoText(text1, centerX, 175);
    
    // 真ん中の繋ぎ演出
    ctx.save();
    ctx.restore();

    drawPachinkoText(text2, centerX, 325);
    
    // 6. 画像データURLの生成
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // 7. データを流し込んでから即座に全体を表示する
    const overlayImg = document.getElementById('resultOverlay');
    overlayImg.src = imageDataUrl;
    
    // 即座に大きな箱を表示！
    document.getElementById('overlayArea').style.display = 'block';
}

// 11. 表示された画像を非表示にして、次のスロットのためにリセットする関数
function closeOverlay() {
    document.getElementById('overlayArea').style.display = 'none';
    document.getElementById('resultOverlay').src = "";
    document.getElementById('displayFirst').classList.remove('win-effect');
    document.getElementById('displaySecond').classList.remove('win-effect');
    checkLockStatus();
    document.getElementById('btnStop').disabled = true;
}

// 12. チェックボックスの状態を見て、両方固定ならスタートを押せなくする関数
function checkLockStatus() {
    const isFirstLocked = document.getElementById('lockFirst').checked;
    const isSecondLocked = document.getElementById('lockSecond').checked;
    const btnSlot = document.getElementById('btnSlot'); // 名前をbtnSlotに変更
    
    if (isFirstLocked && isSecondLocked) {
        btnSlot.disabled = true;
    } else {
        btnSlot.disabled = false;
    }
}

// 13. スロットの結果を裏でログに記録する関数
function sendLogToBackend(text1, text2) {
    const resultString = `【確定結果】${text1} × ${text2}`;
    console.log("🚀 ログ送信の準備完了:", resultString);

    // 👇 URLの末尾にログの文字をダイレクトにくっつけて、セキュリティの壁をすり抜けます！
    const logUrl = `${API_URL}?log=${encodeURIComponent(resultString)}`;

    fetch(logUrl, {
        method: "GET",       // POST から GET に変更して確実に届けます
        mode: "no-cors"      // パソコンからでもエラーを出さないための魔法
    })
    .then(() => {
        console.log("📊 ログデータをGASに向けて発射しました！");
    })
    .catch(error => {
        console.error("ログの送信に失敗しました:", error);
    });
}

// 14. 【追加】確定した結果をX（Twitter）に文字でシェアする関数
function shareOnX() {
    const text1 = document.getElementById('displayFirst').textContent;
    const text2 = document.getElementById('displaySecond').textContent;
    
    // 現在公開されているあなたのGitHub PagesのURLを自動で取得します
    const appUrl = window.location.href;
    
    // Xに投稿したい文章を作成する（改行は %0A になります）
    const shareText = `%0A%0A${text1}%0A${text2}%0A%0A%0A#Linguine %0A`;
    
    // Xの投稿画面を呼び出す魔法のURLを組み立てる
    const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(appUrl)}`;
    
    // 新しいタブ（ウィンドウ）でXの投稿画面を開く！
    window.open(xUrl, '_blank');
}