// Clase para manejar los vehículos
class Vehicle {
    constructor(plate, brand, model, color, entryTime = new Date()) {
        this.plate = plate;
        this.brand = brand;
        this.model = model;
        this.color = color;
        this.entryTime = entryTime;
    }

    calculateCost() {
        const now = new Date();
        const timeDiff = (now - this.entryTime) / 1000; // Diferencia en segundos
        return Math.ceil(timeDiff / 5) * 50; // Cada 5 segundos = 50 colones
    }

    getTimeElapsed() {
        const now = new Date();
        const timeDiff = (now - this.entryTime) / 1000; // Diferencia en segundos
        const minutes = Math.floor(timeDiff / 60);
        const seconds = Math.floor(timeDiff % 60);
        return `${minutes}m ${seconds}s`;
    }
}

// Clase para manejar el sistema
class ParkingSystem {
    constructor() {
        this.vehicles = this.loadFromLocalStorage();
        this.updateInterval = null;
        this.initialize();
    }

    initialize() {
        // Verificar si los elementos del DOM existen antes de inicializar
        const form = document.getElementById('registrationForm');
        const entryTimeInput = document.getElementById('entryTime');
        
        if (form && entryTimeInput) {
            // Función para actualizar la hora de ingreso
            const updateEntryTime = () => {
                entryTimeInput.value = this.formatTime(new Date());
            };

            // Actualizar la hora inicialmente
            updateEntryTime();

            // Actualizar la hora cada segundo
            setInterval(updateEntryTime, 1000);

            // Event listener para el formulario
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registerVehicle();
            });

            // Iniciar actualización de tiempos y costos
            this.startUpdates();
        } else {
            console.error('Elementos del formulario no encontrados');
        }
    }

    registerVehicle() {
        const plate = document.getElementById('plate').value.trim();
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const color = document.getElementById('color').value.trim();

        // Validar que todos los campos estén llenos
        if (!plate || !brand || !model || !color) {
            alert('Por favor, complete todos los campos del formulario');
            return;
        }

        const vehicle = new Vehicle(plate, brand, model, color);
        this.vehicles.push(vehicle);
        this.saveToLocalStorage();
        this.updateTable();
        this.resetForm();
    }

    formatTime(date) {
        return date.toLocaleTimeString('es-CR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    resetForm() {
        document.getElementById('registrationForm').reset();
        document.getElementById('plate').focus();
    }

    saveToLocalStorage() {
        try {
            // Convertir las fechas a strings antes de guardar
            const vehiclesToSave = this.vehicles.map(vehicle => ({
                ...vehicle,
                entryTime: vehicle.entryTime.toISOString()
            }));
            localStorage.setItem('vehicles', JSON.stringify(vehiclesToSave));
        } catch (error) {
            console.error('Error al guardar datos:', error);
        }
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('vehicles');
        if (!data) return [];
        
        try {
            const vehicles = JSON.parse(data);
            return vehicles.map(vehicle => {
                // Crear un nuevo objeto Vehicle con los datos existentes
                return new Vehicle(vehicle.plate, vehicle.brand, vehicle.model, vehicle.color);
            });
        } catch (error) {
            console.error('Error al cargar datos:', error);
            return [];
        }
    }

    updateTable() {
        const tableBody = document.getElementById('vehiclesTable');
        tableBody.innerHTML = '';

        this.vehicles.forEach((vehicle, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle.plate}</td>
                <td>${vehicle.brand}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.color}</td>
                <td>${this.formatTime(vehicle.entryTime)}</td>
                <td class="time-cell">${vehicle.getTimeElapsed()}</td>
                <td class="cost-cell">₡${vehicle.calculateCost()}</td>
                <td>
                    <button onclick="parkingSystem.removeVehicle(${index})" class="btn btn-danger btn-sm">Cobrar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    removeVehicle(index) {
        const vehicle = this.vehicles[index];
        const cost = vehicle.calculateCost();
        
        // Mostrar modal con la información del vehículo
        const modalBody = document.getElementById('vehicleInfo');
        modalBody.innerHTML = `
            <div class="vehicle-detail">
                <span class="vehicle-label">Número de Placa:</span>
                <span class="vehicle-value">${vehicle.plate}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Marca:</span>
                <span class="vehicle-value">${vehicle.brand}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Modelo:</span>
                <span class="vehicle-value">${vehicle.model}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Color:</span>
                <span class="vehicle-value">${vehicle.color}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Hora de Ingreso:</span>
                <span class="vehicle-value">${this.formatTime(vehicle.entryTime)}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Tiempo Total:</span>
                <span class="vehicle-value">${vehicle.getTimeElapsed()}</span>
            </div>
            <div class="vehicle-detail">
                <span class="vehicle-label">Costo Total:</span>
                <span class="vehicle-value">₡${cost}</span>
            </div>
        `;

        // Inicializar el modal
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        const cancelButton = document.getElementById('cancelButton');
        const confirmButton = document.getElementById('confirmCobro');
        
        // Evento para el botón de confirmar cobro
        confirmButton.onclick = () => {
            this.vehicles.splice(index, 1);
            this.saveToLocalStorage();
            this.updateTable();
            modal.hide();
        };

        // Evento para cuando el modal se oculta
        modal._element.addEventListener('hidden.bs.modal', () => {
            // Restaurar el focus al botón de cobrar original
            const originalButton = document.querySelector(`button[onclick*="removeVehicle(${index})"]`);
            if (originalButton) {
                originalButton.focus();
            }
        });

        // Mostrar modal
        modal.show();

        // Establecer focus inicial en el botón de cancelar
        cancelButton.focus();
    }

    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => {
            this.updateTable();
        }, 1000);
    }
}

// Función para limpiar localStorage
function clearLocalStorage() {
    localStorage.removeItem('vehicles');
    console.log('LocalStorage limpiado');
}

// Llamar a la función para limpiar localStorage
clearLocalStorage();

// Inicializar el sistema
globalThis.parkingSystem = new ParkingSystem();

// Asegurar que el sistema esté inicializado después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (!globalThis.parkingSystem) {
        globalThis.parkingSystem = new ParkingSystem();
    }
});
