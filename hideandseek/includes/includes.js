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

            const previewDescription = document.createElement("div");
            previewDescription.classList.add("preview-description");

            const previewReference = document.createElement("div");
            previewReference.classList.add("preview-reference");

            previewBox.append(previewDescription, previewReference);

            if (!data[key]) return null;

            const { book, content, id, reference } = data[key];

            if (id) key = id;

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
            const realTarget = isTouchDevice() ? e : e.target;
            const linkRect = realTarget.getBoundingClientRect();

            const previewBoxTop = linkRect.bottom + window.scrollY + 5;
            let previewBoxLeft = linkRect.left + window.scrollX;

            if (previewBoxLeft + previewBox.offsetWidth + 15 > window.innerWidth) {
                previewBoxLeft = linkRect.right + window.scrollX - previewBox.offsetWidth;
            }

            previewBox.style.top = `${previewBoxTop}px`;
            previewBox.style.left = `${previewBoxLeft}px`;
        }

        function handleMobileClick(e) {
            const eReal = e.target.closest('a[data-key]');
            const key = eReal.getAttribute("data-key");
            const previewBox = createPreviewBox(eReal, key);

            if (!previewBox) return;

            document.body.append(previewBox);

            positionPreviewBox(eReal, previewBox);

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
            element.style.transition = 'background-color 1s ease';
            element.style.backgroundColor = 'rgba(var(--highlight), 0.4)';

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
    const articleActions = document.querySelector('.article-actions');
    if (!articleActions) return;

    const fullscreenEnabled = document.documentElement.dataset.fullscreenenabled === "true";

    if (fullscreenEnabled) {
        const fullscreenBtn = document.createElement('a');
        fullscreenBtn.setAttribute('draggable', 'false');
        fullscreenBtn.innerHTML = `<span class="material-symbols-rounded">open_in_full</span> 放大滿版`;
        articleActions.appendChild(fullscreenBtn);

        const fullscreenArea = document.querySelector('.article-content');

        function setFullscreen(go) {
            window.scrollTo({ top: 0, behavior: "instant" });
            document.body.style.overflowY = go ? "hidden" : "";

            if (go) {
                fullscreenArea.classList.add("fullscreen");
            } else {
                fullscreenArea.classList.add("unfullscreen");
                fullscreenArea.addEventListener("animationend", () => {
                    fullscreenArea.classList.remove("fullscreen");
                    fullscreenArea.classList.remove("unfullscreen");
                }, { once: true });
            }
        }

        fullscreenBtn.addEventListener('click', () => setFullscreen(true));

        const unfullscreenBtn = document.createElement('div');
        unfullscreenBtn.id = "btn-unfullscreen";
        unfullscreenBtn.className = "btn";
        unfullscreenBtn.innerHTML = `<span class="material-symbols-rounded">close_fullscreen</span>`;
        unfullscreenBtn.addEventListener('click', () => setFullscreen(false));

        fullscreenArea.prepend(unfullscreenBtn);

        setFullscreen(true);
    }

    if (document.documentElement.dataset.markdown === "true") {
        const mdBtn = document.createElement('a');
        mdBtn.setAttribute('draggable', 'false');
        mdBtn.innerHTML = `<span class="material-symbols-rounded">markdown</span> 純文字`;
        mdBtn.href = "markdown.md";
        articleActions.appendChild(mdBtn);
    }

    const shareBtn = document.createElement('a');
    shareBtn.setAttribute('draggable', 'false');
    shareBtn.innerHTML = `<span class="material-symbols-rounded">share</span> 分享`;
    shareBtn.addEventListener('click', () => openModal('qrcode'));
    articleActions.appendChild(shareBtn);

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'modal-qrcode';
    modal.innerHTML = `
    <div class="content show">
        <div class="header">
            <span class="close material-symbols-rounded" onclick="closeModal()">cancel</span>
            <h2><span class="material-symbols-rounded">qr_code_scanner</span> 分享此頁面</h2>
        </div>
        <div class="body">
            <div style="display: flex; flex-direction: column;">
                <img src="share.svg" class="modal-qr" draggable="false" loading="lazy" alt="分享 QR Code">
                <p style="text-align: center; margin-top: 1em;"><a class="inlineLink" href="https://ztakh.lol${window.location.pathname}" draggable="false"><code>https://ztakh.lol${window.location.pathname.replaceAll(/(?<=[^:\/])\/(?!$)/g, '&ZeroWidthSpace;/')}</code></a></p>
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

document.querySelector('html').dataset.js = true;

const currentScript = document.querySelector('script[src="/includes/includes.js"]');

loadHTML('header', '/hideandseek/includes/header.html');
loadHTML('footer', '/hideandseek/includes/footer.html');

function scrollTitleText() {
    const header = document.querySelector('header');
    const headerFlexBox = header.querySelector('.flex-1');
    const headerH1 = header.querySelector('.h1');
    const headerH2 = header.querySelector('.h2');
    const mainH1 = document.querySelector('main h1');
    const mainH2 = document.querySelectorAll('main h2');

    headerFlexBox.setAttribute("style", `width: ${headerFlexBox.style.offsetWidth}px`);
    headerH1.textContent = mainH1.dataset.value || mainH1.textContent.trim();

    function onScroll() {
        var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var scrolled = (winScroll / height) * 100;
        document.querySelector("header .progress-bar").style.width = scrolled + "%";

        if (mainH1.getBoundingClientRect().bottom > header.offsetHeight) {
            header.classList.remove('scrolled');
            return;
        }

        header.classList.add('scrolled');

        let currentH2 = null;

        mainH2.forEach(h2 => {
            const rect = h2.getBoundingClientRect();
            if (rect.top < window.innerHeight / 2) {
                currentH2 = h2;
            }
        });

        if (!currentH2) {
            header.classList.remove('shrink');
            setTimeout(() => {
                headerH2.textContent = '';
            }, 300);
        } else {
            const newH2Text = currentH2.textContent.trim();
            if (headerH2.textContent !== newH2Text) {
                headerH2.style.opacity = 0;
                setTimeout(() => {
                    headerH2.textContent = newH2Text;
                    headerH2.style.opacity = 1;
                    header.classList.add('shrink');
                }, 300);
            }
        }
    }

    window.addEventListener('scroll', onScroll);

    onScroll();
}

function headerScript() {
    loadHTML('aside', '/hideandseek/includes/aside.html');

    document.querySelectorAll('main h2').forEach(heading => {
        const length = heading.textContent.trim().length + 0.5;
        heading.style.setProperty('--width', length + 'em');
    });

    const themeToggleButton = document.querySelector('header #theme')
    themeToggleButton.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        applyTheme(newTheme);
    });

    function setTheme() {
        const savedTheme = localStorage.getItem('theme');
        const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme(userPrefersDark ? 'dark' : 'light', true);
        }
    }

    function applyTheme(newTheme, isAuto = false) {
        document.documentElement.setAttribute('data-theme', newTheme);

        if (isAuto) {
            return;
        }

        localStorage.setItem('theme', newTheme);
        themeToggleButton.querySelector('.material-symbols-rounded').textContent = newTheme === 'dark' ? 'brightness_4' : 'brightness_7';
    }

    setTheme();
}

function loadPag(nav, data) {
    const pages = Object.keys(data);

    const currentPath = window.location.pathname.replace(/\/$/, '');
    const currentPage = currentPath.split('/').pop();

    const currentPageIndex = pages.indexOf(currentPage);
    if (currentPageIndex === -1) return;

    const prevPage = currentPageIndex > 0 ? `../${pages[currentPageIndex - 1]}/` : null;
    const nextPage = currentPageIndex < pages.length - 1 ? `../${pages[currentPageIndex + 1]}/` : null;

    const prevLink = document.createElement('a');
    prevLink.classList.add('pag-button');
    prevLink.draggable = false;

    const nextLink = document.createElement('a');
    nextLink.classList.add('pag-button');
    nextLink.draggable = false;

    const pagBar = document.createElement('div');
    pagBar.classList.add('pag-bar');

    if (prevPage) {
        prevLink.setAttribute('href', prevPage);
    } else {
        prevLink.classList.add('disabled');
    }
    prevLink.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">arrow_left_alt</span>前頁';

    if (nextPage) {
        nextLink.setAttribute('href', nextPage);
    } else {
        nextLink.classList.add('disabled');
    }
    nextLink.innerHTML = '後頁<span class="material-symbols-rounded" aria-hidden="true">arrow_right_alt</span>';

    nav.insertBefore(pagBar, nav.firstChild);
    nav.insertBefore(prevLink, nav.firstChild);
    nav.appendChild(pagBar.cloneNode(true));
    nav.appendChild(nextLink);
}

function asideScript() {
    document.querySelector('aside').classList.add('sidebar');

    let aside = document.querySelector('aside');
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'none';
    document.body.insertBefore(overlay, document.body.firstChild);

    document.querySelector('header #sidebar').addEventListener('click', function () {
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

    document.querySelectorAll('#aside-pages h3').forEach(heading => {
        const length = heading.textContent.trim().length + 0.5;
        heading.style.setProperty('--width', length + 'em');
    });

    const asidePagesA = document.querySelectorAll('#aside-pages a');

    for (let index = 0; index < asidePagesA.length; index++) {
        const element = asidePagesA[index];

        if (element.href === window.location.href) {
            element.classList.add("disabled");
            element.removeAttribute('href');
            break;
        }
    }

    const nav = document.createElement('nav');
    nav.classList.add('article-container', 'article-pagination');
    document.getElementsByClassName('article-container-group')[0].appendChild(nav);

    const backToTop = document.createElement('a');
    backToTop.classList.add('pag-button');
    backToTop.draggable = false;
    backToTop.onclick = function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    backToTop.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">vertical_align_top</span>回頂端';

    nav.appendChild(backToTop);

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
                tocHTML += `<${section.title} href="${sectionUrl}" style="--width: ${section.display.trim().length}.5em;">${section.display}</${section.title}>`;
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

            loadPag(nav, data);
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

function addLinkSpace() {
    const links = document.querySelectorAll('main a');

    for (let i = 0; i < links.length - 1; i++) {
        const currentLink = links[i];
        const nextLink = links[i + 1];

        if (nextLink && currentLink.nextSibling === nextLink) {
            nextLink.classList.add('ml');
        }
    }
}

function footerScript() {
    setTimeout(() => {
        scrollToKey();
        scrollToId();
        addLinkSpace();
        scrollTitleText();
    }, 100);
}

const Utils = {
    getRandomInt(max) {
        return Math.floor(Math.random() * (max + 1));
    },
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    randomSample(array, sampleSize) {
        const indices = Array.from({ length: array.length }, (_, i) => i);
        const sampledIndices = indices.slice(0, Math.min(sampleSize, array.length));
        return sampledIndices.map(index => array[index]);
    },
    toggleDataBool(el, key) {
        const newBool = el.dataset[key] !== "true";
        el.dataset[key] = newBool;
        return newBool;
    }
};
window.Utils = Utils;