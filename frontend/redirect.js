document.addEventListener("DOMContentLoaded", function() {

    const UserAgent = navigator.userAgent.toLowerCase();
    const target_URL = window.location.href;

    if (UserAgent.match(/inapp|naver|snapchat|wirtschaftswoche|thunderbird|instagram|everytimeapp|whatsApp|electron|wadiz|aliapp|zumapp|kakaostory|band|twitter|DaumApps|DaumDevice\/mobile|FB_IAB|FB4A|FBAN|FBIOS|FBSS|SamsungBrowser\/[^1]/i) || UserAgent.match(20100101)) {
        popupContainer.style.display = "flex";
    }
    
    else if (UserAgent.match(/kakaotalk/i)) {
        window.location.href = 'kakaotalk://inappbrowser/close';
        window.location.href = 'kakaotalk://web/openExternal?url='+encodeURIComponent(target_URL);
    }

    else if (UserAgent.match(/line/i)) {
        window.location.href = target_URL+'?openExternalBrowser=1';
    }
});