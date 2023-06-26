

// Refresh cart contents (offcanvas cart, cart page, count badges, etc)
window.refreshCartContents = async (response) => {
    console.log(response)

    const offcanvasCart = document.querySelector('#offcanvas-cart')

    offcanvasCart?.classList.add('loading')

    const respoonse = await fetch(window.location.href)
    const text = await respoonse.text()
    const newDocument = new DOMParser().parseFromString(text, 'text/html')

    offcanvasCart?.querySelector('.offcanvas-body')
        .replaceWith(newDocument.querySelector('#offcanvas-cart .offcanvas-body'))
    offcanvasCart?.querySelector('.offcanvas-footer')
        .replaceWith(newDocument.querySelector('#offcanvas-cart .offcanvas-footer'))

    document.querySelector('#cart')?.replaceWith(newDocument.querySelector('#cart'))

    document.querySelectorAll('.cart-count-badge').forEach((badge) => {
        badge.textContent = newDocument.querySelector('.cart-count-badge').textContent
        badge.removeAttribute('hidden')
    })

    offcanvasCart?.classList.remove('loading')

    window.dispatchEvent(new Event('updated.my.cart'))
    window.dispatchEvent(new Event('qtyEvent'))
    

    if (response.ok) {
        if (response.url.includes('add.js')) {
            offcanvasCart?.querySelector('#offcanvas-cart-alert-add').removeAttribute('hidden')
        } else {
            const infos = document.querySelectorAll('#offcanvas-cart-alert-updated');
            infos.forEach( (info) => {
                info.removeAttribute('hidden');
            });
        }
    } else {
        const data = await response.json()
        const alerts = document.querySelectorAll('#offcanvas-cart-alert-error')
        alerts.forEach( (alert) => {
            alert.querySelector('span').textContent = `${data.message} ${data.description != null ? ' - ' + data.description:''}`
            alert.removeAttribute('hidden')
        })
        
    }
}

// Quantity Inputs
window.onClickqtyButtons = () => {
    const qtyButtons = document.querySelectorAll('button.plus,  button.minus');

    qtyButtons.forEach(el => el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const $inputTag = el.closest('.quantity').querySelector('.qty');
        if($inputTag){
            let value = $inputTag.value ? parseInt($inputTag.value, 10) : 0
                , max = $inputTag.dataset.max || 100
                , min = $inputTag.dataset.min || 0
                , step = $inputTag.dataset.step || 1;
            if (el.classList.contains('plus')) {
                value = value + step <= max ? value + step : max;
            } else {
                value = value - step >= min ? value - step : min;
            }
            $inputTag.value = value;
            var event = new Event('change');
            $inputTag.dispatchEvent(event);
        }
    }));
}
window.onClickqtyButtons();
window.addEventListener('qtyEvent', () => {
    window.onClickqtyButtons();
})


window.onChangeCartQty = async (input) => {
    const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: input.dataset.lineItemKey,
            quantity: input.value
        })
    })
    window.refreshCartContents(response)
}

// Remove Buttons
window.onRemoveCartItem = async (btn) => {
    const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: btn.dataset.lineItemKey,
            quantity: 0
        })
    })
    window.refreshCartContents(response)
}

// Checkout button - indicate loading on click
window.onClickCheckoutBtn = (btn) => {
    btn.style.height = btn.clientHeight + 'px'
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1.2rem; height: 1.2rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `
}

// Summary card on the cart page - sticky on desktop
const initStickySummaryCard = () => {
    const card = document.querySelector('#cart-summary')

    if (!card) return

    if (window.matchMedia('max-width: 991px').matches) return

    const navbarHeight = document.querySelector('#shopify-section-navbar.sticky-top').clientHeight || 0
    card.style.position = 'sticky'
    card.style.top = `${navbarHeight + 20}px`
}
initStickySummaryCard()

window.addEventListener('updated.my.cart', () => {
    initStickySummaryCard()
})


// Save cart note
window.onSaveCartNote = async (e) => {
    
    let note = e.previousSibling
    if(!note){
        return
    }
    let cartNote = note.value;
    
    const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            note: cartNote
        })
    })
    window.refreshCartContents(response)
}