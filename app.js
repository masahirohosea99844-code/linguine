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
    // 画面に表示されている現在の言葉を取得する
    const text1 = document.getElementById('displayFirst').textContent;
    const text2 = document.getElementById('displaySecond').textContent;
    
    // もしスロットがまだ回っていなければ、画像は作らない
    if (text1 === "???" || text2 === "???") return;

    // 1. 脳内に「見えないお絵かきキャンバス（Canvas）」を1枚用意する
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 画像のサイズを決定（縦長スマホに合わせた500px × 500pxの正方形）
    canvas.width = 500;
    canvas.height = 500;
    
    // 2. 背景を塗りつぶす（ちょっと豪華なグラデーションにします）
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#ffefe5'); // 上は薄いピンクオレンジ
    gradient.addColorStop(1, '#fffde7'); // 下は薄い黄色
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);
    
    // 3. 飾り枠（フレーム）を描く
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, 470, 470);
    
    // 4. タイトル文字を描く（Linguineのロゴ風）
    ctx.fillStyle = '#666';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    //ctx.fillText('✨  ✨', 250, 80);
    
    // 5. スロットの言葉をドーン！と真ん中に描く
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px sans-serif';
    
    // 前半の言葉を描く（Y座標：220の位置）
    ctx.fillText(text1, 250, 220);
    
    // 後半の言葉を描く（Y座標：320の位置）
    ctx.fillText(text2, 250, 320);
    
    // 6. 出来上がったお絵かきデータを「画像（PNGデータ）」に変換する
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // 7. HTMLにある画像タグに、作ったデータを流し込んで画面に表示する！
    const overlayImg = document.getElementById('resultOverlay');
    overlayImg.src = imageDataUrl;
    
    // ほんの少しだけ余韻を持たせてから（0.6秒後）、画像エリアをパッと表示する
    setTimeout(() => {
        document.getElementById('overlayArea').style.display = 'block'; // 👈 ここを書き換え
    }, 600);
}

// 11. 表示された画像を非表示にして、次のスロットのためにリセットする関数
function closeOverlay() {
    const overlayImg = document.getElementById('resultOverlay');
    
    // 画像をパッと非表示（none）にします
    overlayImg.style.display = 'none';
    
    // 次のスロットのために、画像の中身（URL）も一度空っぽにしておきます
    overlayImg.src = "";

    document.getElementById('overlayArea').style.display = 'none'; // 👈 ここを書き換え
    document.getElementById('resultOverlay').src = "";
    
    // ついでに、文字のピカピカ光る装飾（win-effect）もここで綺麗に消しておきます
    document.getElementById('displayFirst').classList.remove('win-effect');
    document.getElementById('displaySecond').classList.remove('win-effect');
    // 画像を閉じた後、ボタンの状態をチェックボックスに合わせて正しく戻す
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
    console.log("🚀 ログ送信の準備完了（通信量はごくわずかです）:", resultString);

    // 👇 【確実版】GASのdoPostが100%受け取れる「フォーム形式」にデータを梱包します
    const formData = new URLSearchParams();
    formData.append('log', resultString); // GAS側に「log」という名前で文字列を渡す

    fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // パソコンのローカルファイルからでもCORSの壁を突破する魔法
        headers: {
            "Content-Type": "application/x-www-form-urlencoded" // フォーム形式であることを明示
        },
        body: formData.toString() // 梱包したデータを送信
    })
    .then(response => {
        // mode: "no-cors" のため中身の判定はできませんが、送信処理自体はここで完了します
        console.log("📊 ログデータをフォーム形式でGASに送信しました！");
    })
    .catch(error => {
        console.error("ログの保存に失敗しました（動作には影響ありません）:", error);
    });
}

// 14. 【追加】確定した結果をX（Twitter）に文字でシェアする関数
function shareOnX() {
    const text1 = document.getElementById('displayFirst').textContent;
    const text2 = document.getElementById('displaySecond').textContent;
    
    // 現在公開されているあなたのGitHub PagesのURLを自動で取得します
    const appUrl = window.location.href;
    
    // Xに投稿したい文章を作成する（改行は %0A になります）
    const shareText = `🎰 スロットの結果は...%0A%0A【 ${text1} 】%0A【 ${text2} 】%0A%0Aでした！みんなも回してみてね！%0A#Linguine %0A`;
    
    // Xの投稿画面を呼び出す魔法のURLを組み立てる
    const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(appUrl)}`;
    
    // 新しいタブ（ウィンドウ）でXの投稿画面を開く！
    window.open(xUrl, '_blank');
}