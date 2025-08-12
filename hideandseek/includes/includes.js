function isTouchDevice() {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}

fetch('/hideandseek/includes/lawPreview.json')
    .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return response.json();
    })
    .then(data => {
        const links = document.querySelectorAll("a[data-key]");

        function createPreviewBox(e, key) {
            const previewBox = document.createElement("div");
            previewBox.classList.add("preview-box");
            previewBox.id = e.target.textContent;

            const previewDescription = document.createElement("div");
            previewDescription.classList.add("preview-description");

            const previewReference = document.createElement("div");
            previewReference.classList.add("preview-reference");

            previewBox.append(previewDescription, previewReference);

            if (!data[key]) return null;

            const { book, content, reference } = data[key];

            if (isTouchDevice()) {
                previewBox.addEventListener('click', () => {
                    window.location.href = `/hideandseek/rulebook/${book}/?key=${key}`;
                });
            }
            else {
                e.target.href = `/hideandseek/rulebook/${book}/?key=${key}`;
            }

            previewDescription.textContent = content;
            previewReference.textContent = reference;

            return previewBox;
        }

        function positionPreviewBox(e, previewBox) {
            const linkRect = e.target.getBoundingClientRect();

            const previewBoxTop = linkRect.bottom + window.scrollY + 5;
            let previewBoxLeft = linkRect.left + window.scrollX;

            if (previewBoxLeft + previewBox.offsetWidth > window.innerWidth) {
                previewBoxLeft = linkRect.right + window.scrollX - previewBox.offsetWidth;
            }

            previewBox.style.top = `${previewBoxTop}px`;
            previewBox.style.left = `${previewBoxLeft}px`;
        }

        function handleMobileClick(e) {
            const key = e.target.getAttribute("data-key");
            const previewBox = createPreviewBox(e, key);

            if (!previewBox) return;

            document.body.append(previewBox);

            positionPreviewBox(e, previewBox);

            setTimeout(() => previewBox.classList.add("visible"), 10);

            const closePreview = (event) => {
                if (!previewBox.contains(event.target) && event.target !== e.target) {
                    previewBox.classList.remove("visible");
                    setTimeout(() => previewBox.remove(), 300);
                    document.removeEventListener("click", closePreview);
                }
            };
            document.addEventListener("click", closePreview);
        }

        function handleDesktopHover(e) {
            const key = e.target.getAttribute("data-key");
            const previewBox = createPreviewBox(e, key);

            if (!previewBox) return;

            document.body.append(previewBox);

            positionPreviewBox(e, previewBox);

            setTimeout(() => previewBox.classList.add("visible"), 10);

            e.target.addEventListener("mouseleave", function () {
                previewBox.classList.remove("visible");
                setTimeout(() => previewBox.remove(), 300);
            });
        }

        links.forEach(link => {
            if (isTouchDevice()) {
                link.addEventListener("click", function (e) {
                    e.preventDefault();
                    handleMobileClick(e);
                });
            } else {
                link.addEventListener("mouseenter", handleDesktopHover);
            }
        });
    })
    .catch(error => console.error('Error loading JSON:', error));

function scrollToKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');

    if (key) {
        const element = document.getElementById(key);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.style.transition = 'background-color 0.2s ease';
            element.style.backgroundColor = 'var(--light-blue)';

            setTimeout(() => {
                element.style.backgroundColor = 'transparent';

                setTimeout(() => {
                    element.style.transition = '';
                    element.style.backgroundColor = '';
                }, 500);
            }, 2000);

            history.replaceState(null, null, window.location.pathname);
        } else {
            console.log(`No element with id="${key}" found.`);
        }
    }
}

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
    if (!articleActions) {
        return;
    }

    articleActions.innerHTML += `<a draggable="false" onclick="openModal('qrcode')"><span class="material-symbols-rounded">share</span> 分享</a>`;

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
                <p style="text-align: center; margin-top: 1em;"><a class="inlineLink" href="https://ztakh.lol${window.location.pathname}" draggable="false"><code>https://ztakh.lol${window.location.pathname}</code></a></p>
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

function loadPag(mainParent, data) {
    const pages = Object.keys(data);

    const currentPath = window.location.pathname.replace(/\/$/, '');
    const currentPage = currentPath.split('/').pop();

    const currentPageIndex = pages.indexOf(currentPage);
    if (currentPageIndex === -1) return;

    const prevPage = currentPageIndex > 0 ? `../${pages[currentPageIndex - 1]}/` : null;
    const nextPage = currentPageIndex < pages.length - 1 ? `../${pages[currentPageIndex + 1]}/` : null;

    const nav = document.createElement('nav');
    nav.classList.add('article-container', 'article-pagination');

    const prevLink = document.createElement('a');
    prevLink.classList.add('pag-button');
    prevLink.draggable = 'false';

    const nextLink = document.createElement('a');
    nextLink.classList.add('pag-button');
    nextLink.draggable = 'false';

    const pagBar = document.createElement('div');

    pagBar.classList.add('pag-bar');

    if (prevPage) {
        prevLink.setAttribute('href', prevPage);
    } else {
        prevLink.classList.add('disabled');
    }
    prevLink.innerHTML = '<span class="material-symbols-rounded">arrow_left_alt</span>前頁';

    if (nextPage) {
        nextLink.setAttribute('href', nextPage);
    } else {
        nextLink.classList.add('disabled');
    }
    nextLink.innerHTML = '後頁<span class="material-symbols-rounded">arrow_right_alt</span>';

    nav.appendChild(prevLink);
    nav.appendChild(pagBar);
    nav.appendChild(nextLink);

    mainParent.appendChild(nav);
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

    if (!aside.hasAttribute('data-toc')) {
        document.getElementById('aside-button-group').remove();
        document.getElementById('aside-toc').remove();
        document.getElementById('aside-pages').style.display = 'block';
        return;
    }

    const toc = aside.getAttribute('data-toc');
    let curUrl = '';

    function generateTOC(data, parentKey = '') {
        let tocHTML = '<ul>';

        for (let key in data) {
            const section = data[key];

            if (section.url)
                curUrl = section.url;

            const sectionUrl = curUrl + '#' + key;

            if (section.title) {
                tocHTML += `<${section.title} href="${sectionUrl}">${section.display}</${section.title}>`;
            } else {
                tocHTML += `<li><a href="${sectionUrl}" draggable="false">${section.display}</a>`;
            }

            if (section.children) {
                tocHTML += generateTOC(section.children, key);
            }

            tocHTML += '</li>';
        }

        tocHTML += '</ul>';
        return tocHTML;
    }

    fetch(toc)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${file}`);
            return response.json();
        })
        .then(data => {
            const asideToc = document.getElementById('aside-toc');
            asideToc.innerHTML = generateTOC(data);
            asideToc.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function (e) {
                    const targetId = link.getAttribute('href').split('#')[1];

                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });

            const mainParent = document.getElementsByClassName('article-container-group')[0];
            loadPag(mainParent, data);
        })
        .catch(error => console.error('Error loading JSON:', error));

    const tocDiv = document.getElementById('aside-toc');
    const pagesDiv = document.getElementById('aside-pages');
    const tocBtn = document.getElementById('aside-button-toc');
    const pagesBtn = document.getElementById('aside-button-pages');

    function switchTabs(isToc) {
        tocBtn.classList.toggle('selected', isToc);
        pagesBtn.classList.toggle('selected', !isToc);
        tocDiv.style.display = isToc ? 'block' : 'none';
        pagesDiv.style.display = !isToc ? 'block' : 'none';
    }

    document.getElementById('aside-button-pages').addEventListener('click', function (e) {
        switchTabs(false);
    });

    document.getElementById('aside-button-toc').addEventListener('click', function (e) {
        switchTabs(true);
    });
}

function scrollToId() {
    if (!window.location.hash)
        return;

    const hash = window.location.hash;

    const targetElement = document.querySelector(hash);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    history.pushState('', document.title, window.location.pathname + window.location.search);
}

function footerScript() {
    setTimeout(() => {
        scrollToKey();
        scrollToId();
    }, 100);
}