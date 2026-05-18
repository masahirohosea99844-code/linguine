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
            
            // 👇【ここを追加！】データが届いたので、スタートボタンを活性化（有効化）する
            const btnStart = document.getElementById('btnStart');
            btnStart.disabled = false;           // グレーアウトを解除
            btnStart.textContent = "スタート！"; // 文字を元に戻す
            
            // 念のため、チェックボックスが最初から両方オンだった場合のガードも走らせる
            checkLockStatus();
        })
        .catch(error => {
            console.error("データの読み込みに失敗しました:", error);
            alert("データの読み込みに失敗しました。URLが正しいか確認してください。");
            
            // エラーで止まってしまった場合は、ボタンの文字をエラー表示に変える
            document.getElementById('btnStart').textContent = "読み込み失敗";
        });
}

// 5. スロットの状態を管理する変数（タイマーの番号を入れておく場所）
let timerFirst = null;
let timerSecond = null;

// 6. 「スタート」ボタンを押したときの処理
function startSlot() {
    // スタート連打や両方固定でのバグを防ぐため、ボタンの状態を切り替える
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnStop').disabled = false;

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

// 9. 「ストップ」ボタンを押したときの処理（ド派手演出付き！）
function stopSlot() {
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = true;
    
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
        
        // 👇【ここを追加！】ストップが押されたら、カウントを1増やして画面を書き換える
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

    // 1. キャンバスの作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;
    
    // 2. 背景グラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#ffefe5');
    gradient.addColorStop(1, '#fffde7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);
    
    // 3. 飾り枠
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, 470, 470);
    
    // 4. タイトル
    ctx.fillStyle = '#666';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    //ctx.fillText('✨ 今日の名言（迷言） ✨', 250, 80);
    
    // 5. スロットの文字を描写
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(text1, 250, 220);
    ctx.fillText(text2, 250, 320);
    
    // 6. 画像データURLの生成
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // 7. 【ここを修正】一瞬の隙も与えず、データを流し込んでから即座に全体を表示する！
    const overlayImg = document.getElementById('resultOverlay');
    overlayImg.src = imageDataUrl; // 先に画像をセット！
    
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
    const btnStart = document.getElementById('btnStart');
    
    // 両方にチェックが入っていたら、スタートボタンをグレーアウトする
    if (isFirstLocked && isSecondLocked) {
        btnStart.disabled = true;
    } else {
        btnStart.disabled = false;
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
    const shareText = `%0A%0A【 ${text1} 】%0A【 ${text2} 】%0A%0A%0A#Linguine %0A`;
    
    // Xの投稿画面を呼び出す魔法のURLを組み立てる
    const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(appUrl)}`;
    
    // 新しいタブ（ウィンドウ）でXの投稿画面を開く！
    window.open(xUrl, '_blank');
}