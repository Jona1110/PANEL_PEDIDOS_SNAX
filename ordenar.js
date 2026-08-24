/* S.N.A.X. TERMINAL POS - Estilo Rosfresh 
   Integrado con S.N.A.X. ENTERPRISE BACKEND CORE v3.0
*/

let currentCombo = { 
    protein: null, 
    sauces: [], // Modificado para aceptar múltiples salsas
    price: 0, 
    size: "Chica", 
    basePrice: 0 
};
let finalCart = [];

document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    updateInterface();
    
    const dateElement = document.getElementById('current-date');
    if(dateElement){
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
});

function initEvents() {
    // 1. Manejo del selector de Tamaño
    document.querySelectorAll('.size-btn').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            
            currentCombo.size = this.dataset.size;
            const extra = parseFloat(this.dataset.add) || 0; 
            
            if (currentCombo.basePrice > 0) {
                currentCombo.price = currentCombo.basePrice + extra;
            }
            checkComboStatus();
        });
    });

    // 2. Manejo de Proteínas
    document.querySelectorAll('.select-protein').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.select-protein').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            
            currentCombo.protein = this.dataset.name;
            currentCombo.basePrice = parseFloat(this.dataset.price) || 0;
            
            const activeSize = document.querySelector('.size-btn.selected');
            const extra = activeSize ? parseFloat(activeSize.dataset.add) : 0;
            currentCombo.price = currentCombo.basePrice + extra;
            
            checkComboStatus();
        });
    });

    // 3. Manejo de Salsas (Máximo 2)
    document.querySelectorAll('.sauce-btn').forEach(el => {
        el.addEventListener('click', function() {
            const sauceName = this.dataset.name;
            
            if (currentCombo.sauces.includes(sauceName)) {
                // Si ya está seleccionada, la quitamos
                currentCombo.sauces = currentCombo.sauces.filter(s => s !== sauceName);
                this.classList.remove('selected');
            } else {
                // Si no está seleccionada, la agregamos (max 2)
                if (currentCombo.sauces.length >= 2) {
                    // Quitamos la más vieja
                    const removedSauce = currentCombo.sauces.shift();
                    document.querySelectorAll('.sauce-btn').forEach(btn => {
                        if(btn.dataset.name === removedSauce) btn.classList.remove('selected');
                    });
                }
                currentCombo.sauces.push(sauceName);
                this.classList.add('selected');
            }
            checkComboStatus();
        });
    });

    // 4. Botón Agregar Combo al Ticket
    const addComboBtn = document.getElementById('add-combo-btn');
    if (addComboBtn) {
        addComboBtn.addEventListener('click', () => {
            
            let salsaText = currentCombo.sauces.length === 2 ? 
                `Mitad y Mitad: ${currentCombo.sauces[0]} / ${currentCombo.sauces[1]}` : 
                (currentCombo.sauces[0] === 'Naturales' ? 'Sin Salsa - Naturales' : 'Salsa: ' + currentCombo.sauces[0]);
                
            let subtitleText = currentCombo.sauces.length === 2 ?
                `Mitad: ${currentCombo.sauces[0]} / ${currentCombo.sauces[1]}` :
                (currentCombo.sauces[0] === 'Naturales' ? 'Sin Salsa - Naturales' : `Baño: ${currentCombo.sauces[0]}`);

            finalCart.push({
                title: `${currentCombo.protein} (${currentCombo.size})`,
                subtitle: subtitleText,
                desc: `${currentCombo.protein} (${currentCombo.size}) [${salsaText}]`,
                price: currentCombo.price
            });

            // Resetear configuración visual
            currentCombo = { protein: null, sauces: [], price: 0, size: "Chica", basePrice: 0 };
            document.querySelectorAll('.select-protein, .sauce-btn').forEach(i => i.classList.remove('selected'));
            document.querySelectorAll('.size-btn').forEach(i => i.classList.remove('selected'));
            
            const defaultSize = document.querySelector('[data-size="Chica"]');
            if (defaultSize) defaultSize.classList.add('selected');
            
            addComboBtn.disabled = true;
            updateInterface();
        });
    }

    // 5. Extras Directos (Añadidos al clickear la tarjeta)
    document.querySelectorAll('.direct-addon').forEach(el => {
        el.addEventListener('click', function() {
            const precioExtra = parseFloat(this.dataset.price) || 0;
            const nombreVisible = this.dataset.name; 

            finalCart.push({
                title: nombreVisible,
                subtitle: `Extra directo`,
                desc: `${nombreVisible} ($${precioExtra.toFixed(2)})`,
                price: precioExtra
            });
            
            const originalBg = this.style.backgroundColor;
            this.style.backgroundColor = '#dcfce7'; 
            setTimeout(() => {
                this.style.backgroundColor = originalBg || '#fff';
            }, 300);

            updateInterface();
        });
    });

    // 6. Procesar Orden
    const finalizeBtn = document.getElementById('btn-finalize');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', sendOrder);
    }
}

function checkComboStatus() {
    const btnAdd = document.getElementById('add-combo-btn');
    if (btnAdd) {
        btnAdd.disabled = !(currentCombo.protein && currentCombo.sauces.length > 0);
    }
}

window.removeItem = function(index) {
    finalCart.splice(index, 1);
    updateInterface();
};

function updateInterface() {
    const cartList = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total-price');
    const finalizeBtn = document.getElementById('btn-finalize');
    
    let total = 0;
    let listHTML = '';

    if (finalCart.length === 0) {
        listHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>El ticket está vacío</p>
            </div>`;
    } else {
        finalCart.forEach((item, index) => {
            listHTML += `
                <div class="cart-item">
                    <div class="item-details">
                        <h4 class="item-title">${item.title}</h4>
                        <p class="item-subtitle">${item.subtitle}</p>
                    </div>
                    <div class="item-actions">
                        <span class="item-price">$${item.price.toFixed(2)}</span>
                        <button class="btn-remove" onclick="removeItem(${index})" title="Eliminar del ticket">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>`;
            total += item.price;
        });
    }

    if (totalDisplay) totalDisplay.textContent = `$${total.toFixed(2)}`;
    if (cartList) cartList.innerHTML = listHTML;
    if (finalizeBtn) finalizeBtn.disabled = finalCart.length === 0;
}

async function sendOrder() {
    const btnFinalize = document.getElementById('btn-finalize');
    const nombreCliente = document.getElementById('cliente-nombre').value.trim() || "Cliente en Caja";
    
    btnFinalize.disabled = true;
    btnFinalize.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESANDO...';

    const orderID = "SNX-" + Math.floor(Math.random() * 9000 + 1000);
    let detallesString = finalCart.map(item => `• ${item.desc}`).join("\n");
    let totalAcumulado = finalCart.reduce((acc, item) => acc + item.price, 0);

    const payload = {
        action: "NUEVO_PEDIDO",
        id_orden: orderID, 
        detalles: detallesString,
        total: totalAcumulado,
        cliente: nombreCliente
    };

    const scriptURL = 'https://script.google.com/macros/s/AKfycbzKHLXqqbt-z2i1B-7sDF4njCIJyRjN5-fcDJPTYiAe2NE6tW6BOHHuYlccmUcssfGR/exec';

    try {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        localStorage.setItem('lastOrder', JSON.stringify({
            id: orderID,
            total: totalAcumulado,
            items: detallesString
        }));

        let message = `*--- S.N.A.X. ORDER ${orderID} ---*\n\n*Cliente:* ${nombreCliente}\n\n` + detallesString + `\n\n*TOTAL: $${totalAcumulado.toFixed(2)}*`;
        const waUrl = `https://wa.me/523322961969?text=${encodeURIComponent(message)}`;

        window.open(waUrl, '_blank');

        setTimeout(() => {
            window.location.href = `confirmacion.html?orderId=${orderID}`;
        }, 800);

    } catch (error) {
        console.error("Error en el sistema:", error);
        btnFinalize.disabled = false;
        btnFinalize.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> REINTENTAR COBRO';
    }
}
