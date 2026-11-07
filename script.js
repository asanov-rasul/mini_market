let products = JSON.parse(localStorage.getItem('products')) ?? []

const productsList = document.querySelector('#products')
const productForm = document.querySelector('#productForm')
const modalEdit = document.querySelector('.modal-overlay')

// Рендер товаров

function renderProducts(renderList) {
    productsList.textContent = ''
    if (renderList.length != 0) {
        renderList.forEach(item => {
            productsList.insertAdjacentHTML('afterbegin', `
                <div class="product" data-id="${item.id}">
                    <h3>${item.name}</h3>

                    <p>Категория: ${item.category}</p>

                    <p class="price">${item.price} $</p>

                    <p>На складе: ${item.stock} шт.</p>

                    <div class="product-buttons">
                        <button class="buy" data-action="buy">Купить</button>

                        <button class="edit" data-action="edit">
                            Редактировать
                        </button>

                        <button class="delete" data-action="delete">
                            Удалить
                        </button>
                    </div>
                </div>
            `)
        })
    } else {
        productsList.insertAdjacentHTML('afterbegin', `<p>Каталог пуст.</p>`)
    }
    localStorage.setItem('products', JSON.stringify(products))
}

renderProducts(products)

// Добавление товаров

productForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const productName = document.querySelector('#productName')
    const productPrice = document.querySelector('#productPrice')
    const productCategory = document.querySelector('#productCategory')
    const productStock = document.querySelector('#productStock')
    
    if (productName.value.trim() != '' && productPrice.value > 0 && productStock.value > 0) {
        let newProduct = {
            id: Date.now(),
            name: productName.value,
            price: productPrice.value,
            category: productCategory.value,
            stock: productStock.value
        }
        products.push(newProduct)
    }
    productName.value = ''
    productPrice.value = ''
    productCategory.value = ''
    productStock.value = ''
    renderProducts(products)
})

// Удаление и редактирование товаров

const productEditName = document.querySelector('#editName')
const productEditPrice = document.querySelector('#editPrice')
const productEditCategory = document.querySelector('#editCategory')
const productEditStock = document.querySelector('#editStock')
let productId

productsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) {
        const productElement = e.target.closest('.product')
        const productId = Number(productElement.dataset.id)

        products = products.filter(item => item.id !== productId)   
        renderProducts(products)     
    }

    if (e.target.classList.contains('edit')) {
        const productElement = e.target.closest('.product')
        productId = Number(productElement.dataset.id)

        modalEdit.style.display = 'flex'

        products.forEach(item => {
            if (item.id == productId) {
                productEditName.value = item.name
                productEditPrice.value = item.price
                productEditCategory.value = item.category
                productEditStock.value = item.stock
            }
        })
    }

    if (e.target.classList.contains('buy')) {
        const id = Number(e.target.closest('.product').dataset.id)
        const product = products.find(item => item.id === id)

        if (!product || product.stock <= 0) return // товар закончился

        product.stock--

        const cartItem = cartList.find(item => item.id === id)
        if (cartItem) {
            cartItem.qty++
        } else {
            cartList.push({ 
                            id,
                            name: product.name,
                            price: product.price,
                            category: product.category,
                            qty: 1 
                        })
        }

        renderProducts(products)
        renderCartProducts(cartList)
    }
})


function closeEditModal() {
    modalEdit.style.display = 'none'
}

['.close-btn', '.cancel-btn'].forEach(item => {
    modalEdit.querySelector(item).addEventListener('click', () => {
        closeEditModal()
    })
})

modalEdit.querySelector('.edit-form').addEventListener('submit', (e) => {
    e.preventDefault()

    products.forEach(item => {
        if (item.id == productId) {
            if (productEditName.value.trim() != '' && productEditPrice.value > 0 && productEditStock.value > 0) {
                let newProduct = {
                    id: item.id,
                    name: productEditName.value,
                    price: Number(productEditPrice.value),
                    category: productEditCategory.value,
                    stock: Number(productEditStock.value)
                }
                products = products.map(item => {
                    if (item.id == productId) {
                        return newProduct
                    }
                    return item 
                })
            }
        }
    })
    closeEditModal()
    renderProducts(products)
})

// Поиск и фильтр

const searchInput = document.querySelector('#searchInput')
const categoryFilter = document.querySelector('#categoryFilter')

searchInput.addEventListener('input', (e) => {
    let searchInputValue = e.currentTarget.value.toLowerCase()
    let searchedProducts = products.filter(item => item.name.toLowerCase().includes(searchInputValue))
    renderProducts(searchedProducts)
})

categoryFilter.addEventListener('change', (e) => {
    let categoryValue = e.currentTarget.value
    let categoryProducts = products.filter(item => item.category == categoryValue)
    if (categoryValue == 'all') {
        renderProducts(products)
    } else renderProducts(categoryProducts)
})

// Корзина

const cartButton = document.querySelector('#cartToggle')
const cartSidebar = document.querySelector('#cartSidebar')
const cartItems = document.querySelector('#cartItems')
const cartTotalPrice = document.querySelector('#cartTotal')
let cartList = JSON.parse(localStorage.getItem('cartProducts')) ?? []

renderCartProducts(cartList)
if (sessionStorage.getItem('cartActive') == 'true') cartSidebar.classList.add('active')

cartButton.addEventListener('click', () => {
    cartSidebar.classList.add('active')
    sessionStorage.setItem('cartActive', true)
})

cartSidebar.querySelector('#cartClose').addEventListener('click', () => {
    cartSidebar.classList.remove('active')
    sessionStorage.setItem('cartActive', false)
})

function renderCartProducts(renderCartList) {
    cartItems.textContent = ''
    if (renderCartList.length != 0) {
        renderCartList.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id)
            if (!product) return

            cartItems.insertAdjacentHTML('afterbegin', `
                <div class="cart-item" data-id="${cartItem.id}">

                    <div class="cart-item-info">
                        <h3>${product.name}</h3>
                        <p>Цена: ${product.price} $</p>
                    </div>

                    <div class="cart-item-controls">
                        <button class="quantity-btn-minus">−</button>
                        <span class="quantity">${cartItem.qty}</span>
                        <button class="quantity-btn-plus">+</button>
                    </div>

                    <div class="cart-item-delete">
                        <button class="cart-item-delete-btn">Удалить</button>
                    </div>

                    <div class="cart-item-total">
                        ${product.price * cartItem.qty} $
                    </div>

                </div>
            `)
        })
    } else {
        cartItems.insertAdjacentHTML('afterbegin', `<p>Корзина пуста.</p>`)
    }
    totalPrice = 0
    cartList.forEach(item => totalPrice += item.price * item.qty)
    cartTotalPrice.textContent = `${totalPrice} $`
    localStorage.setItem('cartProducts', JSON.stringify(cartList))
    cartButton.querySelector('#cartCount').textContent = cartList.length
}

renderCartProducts(cartList)

cartItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('cart-item-delete-btn')) {
        const productElement = e.target.closest('.cart-item')
        const productId = Number(productElement.dataset.id)

        cartList = cartList.filter(item => item.id !== productId)
        renderCartProducts(cartList)     
    }

    if (e.target.classList.contains('quantity-btn-minus')) {
        const productElement = e.target.closest('.cart-item')
        const productId = Number(productElement.dataset.id)

        cartList.forEach(item => {
            if (item.id == productId) {
                item.qty--
                renderCartProducts(cartList)
            }
        })
    }

    if (e.target.classList.contains('quantity-btn-plus')) {
        const productElement = e.target.closest('.cart-item')
        const productId = Number(productElement.dataset.id)

        cartList.forEach(item => {
            if (item.id == productId) {
                item.qty++
                renderCartProducts(cartList)
            }
        })
    }
})

// Оформление заказа

const successModal = document.querySelector('#successModal')
const checkoutBtn = document.querySelector('.checkout-btn')

checkoutBtn.addEventListener('click', () => {
    if (cartList.length == 0) return
    successModal.style.display = 'flex'
    document.querySelector('.order-nomer').textContent = `#MM-${Date.now()}`
    sendOrder()
})

function closeSuccessModal() {
    successModal.style.display = 'none'
    cartList = []
    renderCartProducts(cartList)
}

successModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('success-overlay') || e.target.classList.contains('success-close') || e.target.classList.contains('success-button')) closeSuccessModal()
})

async function sendOrder() {
    try {
        const response = await fetch('https://mini-market-backend-b0vt.onrender.com/mail.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: cartList
            })
        });

        const text = await response.text();

        console.log('HTTP Status:', response.status);
        console.log('Ответ сервера:', text);

        const result = JSON.parse(text);

        if (result.success) {
            alert('Заказ успешно отправлен!');
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}