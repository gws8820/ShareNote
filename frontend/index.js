document.addEventListener("DOMContentLoaded", function() {

    setScreenSize();

    window.addEventListener("resize", function() {
        setScreenSize();
    });

    const storedPinvalue = sessionStorage.getItem('pinvalue');
    if (storedPinvalue !== null) {
        setTimeout(function() {
            window.location.href = "https://sharenote.kr/main";
        }, 0);
    }

    const popupContainer = document.getElementById("popupContainer")
    const confirmPopup = document.getElementById("confirmPopup")
    confirmPopup.addEventListener("click", function(){
        popupContainer.classList.add("fade-out");
        setTimeout(function() {
            popupContainer.style.display = "none";
        }, 200);
    });

    const pinvalueInput = document.getElementById("pinvalue");
    const loginButton = document.getElementById("login");
    
    loginButton.addEventListener("click", function() {
        Authentication(pinvalueInput.value);
    });
    
    pinvalueInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            Authentication(pinvalueInput.value);
        }
    });

    const tutorialContainer = document.getElementById("tutorialContainer");
    const tutorialImages = document.getElementById("tutorialImages");
    const tutorialButton = document.getElementById("floatingButton");
    const leftButton = document.getElementById("leftButton");
    const rightButton = document.getElementById("rightButton");
    const closeButton = document.getElementById("closeButton");
    const startButton = document.getElementById("startButton");

    tutorialButton.addEventListener("click", function() {
        tutorialContainer.style.display = "flex";
        tutorialButton.classList.add("fade-out");
        setTimeout(function() {
            tutorialButton.style.display = "none";
            tutorialButton.classList.remove("fade-out");
        }, 200);
    });

    leftButton.addEventListener("click", function() {
        tutorialImages.scrollBy({
            left: -tutorialImages.offsetWidth,
            behavior: 'smooth',
        });
    });

    rightButton.addEventListener("click", function() {
        tutorialImages.scrollBy({
            left: tutorialImages.offsetWidth,
            behavior: 'smooth',
        });
    });

    closeButton.addEventListener("click", function() {
        tutorialButton.style.display = "flex";
        tutorialContainer.classList.add("fade-out");
        setTimeout(function() {
            tutorialContainer.style.display = "none";
            tutorialContainer.classList.remove("fade-out");
        }, 200);
    });

    startButton.addEventListener("click", function() {
        tutorialButton.style.display = "flex";
        tutorialContainer.classList.add("fade-out");
        setTimeout(function() {
            tutorialContainer.style.display = "none";
            tutorialContainer.classList.remove("fade-out");
        }, 200);
    });

    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    function Authentication(pinvalue) {
        if (pinvalue == "") {
            showAlert("숫자 PIN을 입력해 주세요.");
        }
        else if (pinvalue.length < 6) {
            showAlert("6자리 이상 입력해 주세요.");
        }
        else if (pinvalue.length > 15) {
            showAlert("15자리 이하로 입력해 주세요.");
        }
        else {
            sessionStorage.setItem('loggedtime', Date.now());
            sessionStorage.setItem('pinvalue', pinvalue);
            window.location.href = "https://sharenote.kr/main";
        }
    }

    function showAlert(message) {
        const alertBanner = document.getElementById("alertBanner");
        alertBanner.textContent = message;
        alertBanner.style.display = "block";
        setTimeout(function() {
            alertBanner.style.display = "none";
        }, 2000);
    }
});
