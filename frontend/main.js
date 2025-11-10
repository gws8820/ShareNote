document.addEventListener("DOMContentLoaded", function() {

    setScreenSize();

    window.addEventListener("resize", function() {
        setScreenSize();
    });

    const storedPinvalue = sessionStorage.getItem('pinvalue');
    if (storedPinvalue === null) {
        setTimeout(function() {
            window.location.href = "https://sharenote.kr";
        }, 0);
    }
    else {
        login(storedPinvalue);
    }

    setInterval(checkTimeDifference, 60000);
    
    const UserAgent = navigator.userAgent.toLowerCase();
    if (UserAgent.match(/inapp|naver|snapchat|wirtschaftswoche|thunderbird|instagram|everytimeapp|whatsApp|electron|wadiz|aliapp|zumapp|kakaostory|band|twitter|DaumApps|DaumDevice\/mobile|FB_IAB|FB4A|FBAN|FBIOS|FBSS|SamsungBrowser\/[^1]/i) || UserAgent.match(20100101)) {
        floatingButton.style.display = "none"
    }

    const addNoteButton = document.getElementById("addNote");
    addNoteButton.addEventListener("click", function() {
        const note = noteText.value.trim();
            addNote(note);
    });

    const noteText = document.getElementById("noteText");
    
    function autoResize() {
        noteText.style.height = 'auto';
        noteText.style.height = Math.min(noteText.scrollHeight, 400) + 'px';
        if (noteText.scrollHeight > 240) {
            noteText.style.overflowY = 'auto';
        } else {
            noteText.style.overflowY = 'hidden';
        }
    }
    
    noteText.addEventListener("input", autoResize);
    
    noteText.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            const note = noteText.value;
            addNote(note);
        }
    });

    const pasteButton = document.getElementById("floatingButton");
    pasteButton.addEventListener("click", async function () {
        performPasteAction();
    });

    const removeAll = document.getElementById("removeAll");
    const StickyNotes = document.getElementsByClassName("sticky-note");
    removeAll.addEventListener("click", function () {
        const currentTime = Date.now();
        const lastRemovedTime = localStorage.getItem('lastremovedtime');
        const remainingTime = Math.ceil((300000 - (currentTime - lastRemovedTime)) / 60000)

        if (StickyNotes.length == 0) {
            menuContainer.classList.remove("menu-open");
            menuBackground.classList.remove("menu-background");
            showAlert("노트가 없습니다.");
        }

        else if (remainingTime > 0) {
            menuContainer.classList.remove("menu-open");
            menuBackground.classList.remove("menu-background");
            showAlert(remainingTime + "분 후 시도해주세요.")
        }

        else {
            removeAllNotes(storedPinvalue);
        }
    });

    const logoutButton = document.getElementById("logoutButton");
    logoutButton.addEventListener("click", function(){
        sessionStorage.clear();
        window.location.href = "https://sharenote.kr";
    });

    const mailMe = document.getElementById("mailMe");
    mailMe.addEventListener("click", function () {
        menuContainer.classList.remove("menu-open");
        menuBackground.classList.remove("menu-background");
    });

    const menuOpen = document.getElementById("menuOpen");
    const menuClose = document.getElementById("menuClose");
    const menuContainer = document.getElementById("menuContainer");
    const menuBackground = document.getElementById("menuBackground");

    menuOpen.addEventListener("click", function () {
        menuContainer.classList.add("menu-open");
        menuBackground.classList.add("menu-background");
    });

    menuClose.addEventListener("click", function () {
        menuContainer.classList.remove("menu-open");
        menuBackground.classList.remove("menu-background");
    });

    menuBackground.addEventListener("click", function () {
        menuContainer.classList.remove("menu-open");
        menuBackground.classList.remove("menu-background");
    });

    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    function checkTimeDifference() {
        const loggedTime = sessionStorage.getItem('loggedtime');
        const currentTime = Date.now();
        const remainingTime = Math.ceil((3600000 - (currentTime - loggedTime)) / 60000)

        if (remainingTime <= 0) {
            window.alert("1시간이 경과하여 로그아웃 되었습니다.");
            sessionStorage.clear();
            window.location.href = "https://sharenote.kr";
        }

        else if (remainingTime <= 5) {
            showAlert(remainingTime + "분 후 로그아웃됩니다. 취소하려면 다시 로그인해 주세요.");
        }
    }

    async function addNote(note) {
        const count = document.getElementsByClassName("sticky-note").length;
        if (count >= 200) {
            showAlert("더 이상 추가할 수 없습니다.");
        }
        else {
            if (note === "") {
                showAlert("내용을 입력해 주세요.");
            }
            else if (note.length > 10000) {
                showAlert("내용이 너무 길어 저장할 수 없습니다.");
            } 
            else {
                noteText.value = "";
                noteText.style.height = '64px';
                const noteElement = displayNote(note);
                const response = await sendNoteToServer(storedPinvalue, note);
                noteElement.setAttribute("note-id", response.noteId);
            }
        }
    }

    function displayNote(text) {
        const note = document.createElement("div");
        note.className = "sticky-note fade-in";
        note.setAttribute('onselectstart', 'return false');

        const noteContent = document.createElement("div");
        noteContent.className = "note-content";
        noteContent.innerHTML = text.replace(/\n/g, '<br>');
        note.appendChild(noteContent);
        
        const notesContainer = document.getElementById("notesContainer");
        notesContainer.prepend(note);

        const removeButton = document.createElement("button");
        removeButton.className = "remove-button";
    
        const removeImage = document.createElement("img");
        removeImage.src = "minus.png";
        removeButton.appendChild(removeImage);
        note.appendChild(removeButton);
        
        removeButton.addEventListener("click", function(event) {
            event.stopPropagation();
            note.classList.add("fade-out");
            setTimeout(function() {
                if (notesContainer.contains(note)) {
                    notesContainer.removeChild(note)
                }
            }, 300);
    
            const noteId = note.getAttribute("note-id");
            RemoveNoteFromServer(noteId);
        });

        note.addEventListener("click", function () {
            const urls = text.match(/(https?:\/\/\S+)/g);
            if (urls && urls.length === 1) {
                const popupContainer = document.getElementById("popupContainer")
                const confirm = document.getElementById("confirmPopup");
                const close = document.getElementById("closePopup");
                const urlToOpen = urls[0];

                popupContainer.style.display = "flex";

                const confirmListener = function () {
                    setTimeout(function() {
                        popupContainer.style.display = "none";
                    }, 200);
                    window.open(urlToOpen, "_blank");
                    confirm.removeEventListener('click', confirmListener);
                    close.removeEventListener('click', closeListener);
                }
                const closeListener = function () {
                    popupContainer.classList.add("fade-out");
                    setTimeout(function() {
                        popupContainer.style.display = "none";
                        popupContainer.classList.remove("fade-out");
                    }, 200);
                    performCopyAction(text);
                    confirm.removeEventListener('click', confirmListener);
                    close.removeEventListener('click', closeListener);
                }
                confirm.addEventListener("click", confirmListener);
                close.addEventListener("click", closeListener);
            }
            else {
                performCopyAction(text);
            }
        });
        return note;
    }

    async function performPasteAction() {
        try {
            const clipboardText = await navigator.clipboard.readText();

            if (clipboardText.trim() !== "") {
                addNote(clipboardText);
            } 
            else {
                showAlert("클립보드가 비어있습니다.");
            }
        } 
        catch (error) {
            showAlert("클립보드 접근 권한을 허용해주세요.");
        }
    }

    function performCopyAction(note) {
        navigator.clipboard.writeText(note)
            .then(() => {
                showNotification("클립보드에 복사되었습니다!");
            })
            .catch((error) => {
                performCopyAction_Legacy(note);
            });
    }

    function performCopyAction_Legacy(note) {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = note;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);

        showNotification("클립보드에 복사되었습니다!");
    }

    async function login(pinvalue) {
        const url = 'https://api.sharenote.kr/login';
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: pinvalue })
            });
    
            const data = await response.json();
    
            if (data.success) {
                const notesWithIds = data.notes.map(note => ({
                    id: note.id,
                    content: note.content
                }));
                notesWithIds.forEach(note => {
                    const noteElement = displayNote(note.content);
                    noteElement.setAttribute("note-id", note.id);
                    console.log("Successfully Logged In.");
                });
            }
            else if (data.error === 'IP Banned Temporarily.') {
                window.alert("비정상적인 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
                sessionStorage.clear();
                pinvalueInput.value = "";
            }
            else if (data.error === 'Invalid Request') {
                showAlert("잠시 후 시도해주세요.");
            } 
            else if (data.error === 'IP Banned Permanently.') {
                window.alert("해킹 시도로 이용이 차단되었습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }
        }
        catch (error) {
            setTimeout(function() {
                window.alert("서버 오류가 발생했습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }, 0);
        }

    }

    async function sendNoteToServer(pinvalue, note) {
        const url = 'https://api.sharenote.kr/add-note';
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: pinvalue, note: note })
            });
    
            const data = await response.json();
    
            if (data.success) {
                console.log("Note Successfully Added to the Server.");
                return data;
            } 
            else if (data.error === `IP Banned Temporarily.`) {
                window.alert("비정상적인 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
            } 
            else if (data.error === `Invalid Request`) {
                showAlert("잠시 후 시도해주세요.");
            } 
            else if (data.error === `IP Banned Permanently.`) {
                window.alert("해킹 시도로 이용이 차단되었습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }
        } 
        catch (error) {
            setTimeout(function() {
                window.alert("서버 오류가 발생했습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }, 0);
        }
    }

    async function RemoveNoteFromServer(noteId) {
        try {
            const url = 'https://api.sharenote.kr/remove-note';
    
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ noteId: noteId })
            });
    
            const data = await response.json();
    
            if (data.success) {
                console.log("Note Successfully Removed from the Server.");
                return data;
            } 
            else if (data.error === `IP Banned Temporarily.`) {
                window.alert("비정상적인 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
            } 
            else if (data.error === `Invalid Request`) {
                showAlert("잠시 후 시도해주세요.");
            } 
            else if (data.error === `IP Banned Permanently.`) {
                window.alert("해킹 시도로 이용이 차단되었습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }
        } 
        catch (error) {
            setTimeout(function() {
                window.alert("서버 오류가 발생했습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }, 0);
        }
    }
    
    function removeAllNotes(pinvalue) {
        const currentTime = Date.now();
        
        const url = 'https://api.sharenote.kr/remove-all-notes';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin: pinvalue })
        })
        .then(response => response.json())
        .then(data => {
            menuContainer.classList.remove("menu-open");
            menuBackground.classList.remove("menu-background");

            if (data.success) {
                localStorage.setItem('lastremovedtime', currentTime);
                console.log("All Notes Successfully Removed from the Server.");
                while (StickyNotes.length > 0) {
                    StickyNotes[0].remove();
                }
                showNotification("모든 노트가 삭제되었습니다.");
            }
            else if (data.error === `IP Banned Temporarily.`) {
                window.alert("비정상적인 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
            } 
            else if (data.error === `Invalid Request`) {
                showAlert("잠시 후 시도해주세요.");
            } 
            else if (data.error === `IP Banned Permanently.`) {
                window.alert("해킹 시도로 이용이 차단되었습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }
        })
        .catch(error => {
            setTimeout(function() {
                window.alert("서버 오류가 발생했습니다.");
                sessionStorage.clear();
                window.location.href = "https://sharenote.kr";
            }, 0);
        });
    }

    function showNotification(message) {
        const successBanner = document.getElementById("notificationBanner");
        successBanner.textContent = message;
        successBanner.style.display = "block";
        setTimeout(function() {
            successBanner.style.display = "none";
        }, 2000);
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