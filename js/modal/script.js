function closeModal(id = null) {
    const modal = document.querySelector(id ? ("#" + id) : '.modal-active');
    modalControl(modal, false);
}

window.onclick = function (event) {
    if (Array.from(document.querySelectorAll('.modal-active')).includes(event.target)) {
        modalControl(event.target, false);
    }
}

function openModal(id) {
    const modal = document.querySelector('#modal-' + id);
    if (!modal.classList.contains('transparentBg')) modal.classList.add('transparentBg');
    modalControl(modal, true);
}
window.openModal = openModal;

function modalControl(modal, on) {
    if (!modal) return;

    modal.querySelector(".content").classList.toggle('show', on);

    setTimeout(function () {
        modal.classList.toggle('transparentBg', !on);
    }, on ? 5 : 0);

    setTimeout(function () {
        if (!on) {
            const callbackName = modal.getAttribute('data-onclose');
            if (callbackName && typeof window[callbackName] === 'function') {
                window[callbackName]();
            }
        }

        modal.classList.toggle('modal-active', on);
        document.body.style.overflow = on ? 'hidden' : 'auto';
    }, on ? 0 : 350);

    modal.querySelector('.body').scrollTop = 0;
}

document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link href='/js/modal/stylesheet.css' rel='stylesheet'></link>");

const Confirm = {
    _currentHandlers: {
        cancel: null,
        confirm: null
    },
    _showConfirm(message, confirmCallback, cancelCallback) {
        const modalId = "modal-sys-alert";
        let alertModal = document.getElementById(modalId);

        if (!alertModal) {
            alertModal = document.createElement('div');
            alertModal.classList.add('modal');
            alertModal.id = modalId;
            alertModal.innerHTML = `
            <div class="content show">
                <div class="body">
                    <h2 id="${modalId}-msg"></h2>
                </div>
                <div class="footer">
                    <div class="btn outline" id="${modalId}-cancel"><span class="material-symbols-rounded">cancel</span>取消</div>
                    <div class="btn" id="${modalId}-confirm"><span class="material-symbols-rounded">check_circle</span>確定</div>
                </div>
            </div>`;

            document.body.append(alertModal);
        }

        document.getElementById(modalId + "-msg").textContent = message;
        openModal("sys-alert");

        const cancelBtn = document.getElementById(modalId + "-cancel");
        const confirmBtn = document.getElementById(modalId + "-confirm");

        const handleClick = (isConfirmed) => () => {
            closeModal(modalId);
            isConfirmed
                ? (typeof confirmCallback === 'function' && confirmCallback())
                : (typeof cancelCallback === 'function' && cancelCallback());
        };

        if (this._currentHandlers.cancel) {
            cancelBtn.removeEventListener('click', this._currentHandlers.cancel);
            confirmBtn.removeEventListener('click', this._currentHandlers.confirm);
        }

        this._currentHandlers.cancel = handleClick(false);
        this._currentHandlers.confirm = handleClick(true);

        cancelBtn.addEventListener('click', this._currentHandlers.cancel);
        confirmBtn.addEventListener('click', this._currentHandlers.confirm);
    },
    confirmLink(event, message) {
        event.preventDefault();
        const targetEl = event.currentTarget;
        this._showConfirm(message, () => {
            if (targetEl.target === '_blank') {
                window.open(targetEl.href);
            } else {
                window.location.href = targetEl.href;
            }
        });
    },
    confirmAction(event, message, confirmCallback = null, cancelCallback = null) {
        event.preventDefault();
        this._showConfirm(message, confirmCallback, cancelCallback);
    }
};
window.Confirm = Confirm;