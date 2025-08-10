fetch('/hideandseek/includes/lawPreview.json')
    .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return response.json();
    })
    .then(data => {
        const links = document.querySelectorAll("a[data-key]");

        links.forEach(link => {
            link.addEventListener("mouseenter", function (e) {
                const previewBox = document.createElement("div");
                previewBox.classList.add("preview-box");
                previewBox.id = e.target.textContent;

                const previewDescription = document.createElement("div");
                previewDescription.classList.add("preview-description");

                const previewReference = document.createElement("div");
                previewReference.classList.add("preview-reference");

                previewBox.append(previewDescription, previewReference);

                const key = e.target.getAttribute("data-key");

                if (!data[key]) return;

                const { book, content, reference } = data[key];

                e.target.href = `/hideandseek/rulebook/${book}/#${key}`;

                previewDescription.textContent = content;
                previewReference.textContent = reference;

                const linkRect = e.target.getBoundingClientRect();
                previewBox.style.top = `${linkRect.bottom + window.scrollY + 5}px`;
                previewBox.style.left = `${linkRect.left + window.scrollX}px`;

                document.body.append(previewBox);
                setTimeout(() => previewBox.classList.add("visible"), 10);
            });

            link.addEventListener("mouseleave", function (e) {
                previewBoxes = document.querySelectorAll('.preview-box#' + e.target.textContent);
                previewBoxes.forEach(element => {
                    element.classList.remove("visible");
                    setTimeout(() => element.remove(), 300);
                });
            });
        });
    })
    .catch(error => console.error('Error loading JSON:', error));

function addShareModal() {
    if (!document.querySelector('script[src="/js/modal/script.js"]')) {
        const script = document.createElement('script');
        script.src = '/js/modal/script.js';
        script.onload = function () {
            initialiseShareButton();
        };
        document.body.append(script);
    } else {
        initialiseShareButton();
    }
}

function initialiseShareButton() {
    const articleActions = document.querySelectorAll('.article-actions')[0];
    if (articleActions) {
        articleActions.innerHTML += `<a draggable="false" onclick="openModal('qrcode')"><span class="material-symbols-rounded">share</span> 分享</a>`;
    }

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'modal-qrcode';
    modal.innerHTML = `
    <div class="content show">
        <div class="header">
            <span class="close" onclick="closeModal()"><span class="twemoji"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"></path>
                    </svg></span></span>
            <h2><span class="twemoji"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M4 4h6v6H4zm16 0v6h-6V4zm-6 11h2v-2h-2v-2h2v2h2v-2h2v2h-2v2h2v3h-2v2h-2v-2h-3v2h-2v-4h3zm2 0v3h2v-3zM4 20v-6h6v6zM6 6v2h2V6zm10 0v2h2V6zM6 16v2h2v-2zm-2-5h2v2H4zm5 0h4v4h-2v-2H9zm2-5h2v4h-2zM2 2v4H0V2a2 2 0 0 1 2-2h4v2zm20-2a2 2 0 0 1 2 2v4h-2V2h-4V0zM2 18v4h4v2H2a2 2 0 0 1-2-2v-4zm20 4v-4h2v4a2 2 0 0 1-2 2h-4v-2z" />
                    </svg></span>分享此頁面</h2>
        </div>
        <div class="body">
            <div style="display: flex; flex-direction: column;">
                <img src="share.svg" draggable="false" loading="lazy" style="margin: auto;max-width: 60dvw;max-height: 60dvh;">
                <p style="text-align: center;"><a class="inlineLink" href="https://ztakh.lol${window.location.pathname + window.location.search}"><code>https://ztakh.lol${window.location.pathname + window.location.search}</code></a></p>
            </div>
        </div>
    </div>`;

    document.body.append(modal);
}

const modalScript = document.createElement('script');
modalScript.src = '/js/modal/script.js';
modalScript.onload = addShareModal;
document.body.append(modalScript);

function loadHTML(id, file) {
    fetch(file)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${file}`);
            return response.text();
        })
        .then(data => {
            document.querySelector(id).innerHTML += data;
            if (id === 'header') headerScript();
            else if (id === 'aside') asideScript();
            else if (id === 'footer') footerScript();
        })
        .catch(error => console.error(error));
}

const currentScript = document.querySelector('script[src="/includes/includes.js"]');

loadHTML('header', '/hideandseek/includes/header.html');
loadHTML('footer', '/hideandseek/includes/footer.html');

function headerScript() {
    loadHTML('aside', '/hideandseek/includes/aside.html');
}

function asideScript() {
    document.querySelector('aside').classList.add('sidebar');

    let aside = document.querySelector('aside');
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'none';
    document.body.insertBefore(overlay, document.body.firstChild);

    document.getElementsByClassName('sidebar-toggle')[0].addEventListener('click', function () {
        if (!aside) {
            aside = document.querySelector('aside');
        }

        aside.classList.add('active');
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('active');
        }, 50);
        document.body.style.overflow = 'hidden';
    });

    overlay.addEventListener('click', function () {
        aside.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        document.body.style.overflow = 'auto';
    });
}

function footerScript() {

}