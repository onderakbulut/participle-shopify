/*
    Main 'Add to cart' (ATC) form
*/
window.onSubmitAtcForm = async (form, event) => {
    event.preventDefault()

    const btn = form.querySelector('.btn-atc')

    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    form.classList.add('loading')

    const response = await fetch('/cart/add.js', { method: 'POST', body: new FormData(form) })

    form.classList.remove('loading')
    btn.innerHTML = window.theme.product.addedToCart

    setTimeout(() => {
        btn.innerHTML = btn.dataset.textAddToCart
    }, 2000)

    window.refreshCartContents(response)

    bootstrap.Offcanvas.getOrCreateInstance('#offcanvas-cart').show()
}

/*
    Product options selector - Listen for change events
    Works only in the product page
*/
window.onChangeProductOption = async (input) => {
    const selectedOptions = []

    input.closest('form').querySelectorAll('.product-option').forEach(elem => {
        if (elem.type === 'radio') {
            if (elem.checked) {
                selectedOptions.push(elem.value)
                
                let li = document.querySelectorAll('.select-size li');
                li.forEach((item) => {
                    let sibling = item.parentNode.firstChild;
                    while (sibling) {
                        if (sibling.nodeType === 1 && sibling !== item) {
                            sibling.classList.remove('active');
                        }

                        sibling = sibling.nextSibling;
                    }
                });
                elem.parentElement.classList.add('active');
            }

        } else {
            selectedOptions.push(elem.value)
        }
    })
    
    const selectedVariant = window.productVariants.find(variant =>
        JSON.stringify(variant.options) === JSON.stringify(selectedOptions)
    )

    console.log(selectedVariant)

    const btn = input.closest('form').querySelector('.btn-atc')

    if (selectedVariant) {
        input.closest('form').querySelector('[name="id"]').value = selectedVariant.id

        if (selectedVariant.available) {
            btn.disabled = false
            btn.innerHTML = window.theme.product.addToCart
        } else {
            btn.disabled = true
            btn.innerHTML = window.theme.product.soldOut
        }

        if (selectedVariant.compare_at_price) {
            input.closest('#product-content').querySelector('.product-price').innerHTML = `
                <div class="d-flex flex-column-reverse align-items-center justify-content-start">
                    <span class="product-price-compare">
                        <span class="visually-hidden">
                            ${window.theme.product.priceFrom} &nbsp;
                        </span>
                        <s>
                            ${Shopify.formatMoney(selectedVariant.compare_at_price)}
                        </s>
                    </span>
                    <span class="product-price-final">
                        <span class="visually-hidden">
                        ${window.theme.product.priceSale} &nbsp;
                        </span>
                        ${Shopify.formatMoney(selectedVariant.price)}
                    </span>
                </div>
            `
        } else {
            input.closest('#product-content').querySelector('.product-price').innerHTML = `
                <span class="product-price-final">
                    ${Shopify.formatMoney(selectedVariant.price)}
                </span>
            `
        }
        if (selectedVariant.available && selectedVariant.compare_at_price) {
            input.closest('#product-content').querySelector('.product-price').insertAdjacentHTML('beforeend', `
                <span class="price-badge-sale badge">
                    ${window.theme.product.save}: ${Math.round((1 - (selectedVariant.price / selectedVariant.compare_at_price)) * 100)}%
                </span>    
            `)
        } else if (!selectedVariant.available) {
            input.closest('#product-content').querySelector('.product-price').insertAdjacentHTML('beforeend', `
                <span class="price-badge-sold-out badge bg-danger fs-10 ms-2">
                    ${window.theme.product.soldOut}
                </span>
            `)
        }

        const url = new URL(window.location)
        url.searchParams.set('variant', selectedVariant.id)
        window.history.replaceState({}, '', url)

        const customEvent = new CustomEvent('variantChange.my.product', {
            detail: selectedVariant
        })
        window.dispatchEvent(customEvent)
    } else {
        btn.disabled = true
        btn.innerHTML = window.theme.product.unavailable
    }
}


/*
    Product Gallery
*/
const initProductGallery = () => {

    var productThumbs = new Swiper('.product-thumbs', {
		
        centeredSlides: false,
        loop: true,
        slideToClickedSlide: true,
        watchSlidesProgress: true,
        direction: 'vertical',
        slidesPerView: 5,
        loopedSlides: 1,
        spaceBetween: 0
    });

    const wrapper = document.querySelector('#product-gallery')

    if (!wrapper) return

    const swiperOptions = {
        spaceBetween: 10,
        centeredSlides: false,
        loop:true,
        direction: 'horizontal',
        loopedSlides: 1,
        slidesPerView : 1,
        resizeObserver:true,
        breakpoints: {
            991: {
                slidesPerView: 1,
                loop : true,
            }
        },
        thumbs: {
            swiper: productThumbs
        }
    };
    var productGallery =  new Swiper(".product-gallery", swiperOptions);

    window.addEventListener('variantChange.my.product', (event) => {
        const selectedVariant = event.detail

        if (selectedVariant.featured_media) {
            productGallery.slideTo(selectedVariant.featured_media.position - 1);
        }
    }, false)

   /*  if (window.matchMedia('(min-width: 992px)').matches) {
        const navbarHeight = document.querySelector('#shopify-section-navbar.sticky-top').clientHeight || 0
        wrapper.style.position = 'sticky'
        wrapper.style.top = `${navbarHeight + 20}px`
        wrapper.style.zIndex = '1'
    } */

    if(document.querySelector('[data-fancybox="gallery"]')){
		Fancybox.bind('[data-fancybox="gallery"]:not(.swiper-slide-duplicate)', {
			Image: {
				zoom: false,
			},
			Toolbar: {
				display: [
					"zoom",
					"fullscreen",
					"thumbs",
					"close",
					"counter"
				],
			}
		});
	}

}
initProductGallery()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('#product-gallery')) {
        initProductGallery()
    }
})


/*
    'Buy it now' button
*/
window.onClickBuyBtn = (btn) => {
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `
    const form = btn.closest('form')
    const variantId = form.querySelector('[name="id"]').value
    const qty = Number(form.querySelector('input[name="quantity"]').value || 1)
    window.location.href = `/cart/${variantId}:${qty}`
}

/* product slider start */
let recommend = document.querySelector('.recommend-slider');
if(recommend){
			
    const swiperOptions = {
        loop:false,
        slidesPerView:4,
        slidesPerGroup:2,
        navigation: {
            nextEl: '.swiper-btn-next',
            prevEl: '.swiper-btn-prev',
        },
        breakpoints: {
            0: {
                slidesPerView: 2.2,
                slidesPerGroup:2,
                spaceBetween: 10
            },
            576: {
                slidesPerView: 3,
                slidesPerGroup:3,
                spaceBetween: 20
            },
            992: {
                slidesPerView: 4,
                slidesPerGroup:1,
                spaceBetween: 20
            }
        },
        scrollbar: {
            el: ".swiper-scrollbar",
            hide: true,
        }
    };

    document.addEventListener('lazyloaded', (e) => {
        if(e.target.classList.contains('recommend-slider')){
            new Swiper(".recommend-slider", swiperOptions);
        }
    });

    if(recommend.classList.contains("lazyloaded")){
        new Swiper(".recommend-slider", swiperOptions);
    }

}
/* product slider end */