// ==========================================================================
// 1. CLASE NODO: La pieza fundamental de nuestras estructuras
// ==========================================================================
class Nodo {
    constructor(dato) {
        this.dato = dato;       // Guardará un solo carácter (en la lista) o un string de estado (en la pila)
        this.siguiente = null;  // Referencia al siguiente bloque de la cadena
    }
} // <--- AQUÍ SE CIERRA LA CLASE NODO

// ==========================================================================
// 2. CLASE LISTAENLAZADA: El "documento vivo" de nuestro editor
// ==========================================================================
class ListaEnlazada {
    constructor() {
        this.cabeza = null; // Puntero al primer carácter del documento
        this.cola = null;   // Puntero al último carácter para inserciones rápidas de tiempo O(1)
    }

    /**
     * Agrega un carácter al final del documento.
     * Es la operación base para el comando ESCRIBIR.
     */
    insertarAlFinal(caracter) {
        // nuevo eslabón con el carácter correspondiente
        const nuevoNodo = new Nodo(caracter);

        // ESCENARIO 1: Si la lista está vacía, el nuevo nodo es el principio y el fin
        if (this.cabeza === null) {
            this.cabeza = nuevoNodo;
            this.cola = nuevoNodo;
        } 
        // ESCENARIO 2: Si ya contiene texto, lo enganchamos al final de la cola actual
        else {
            this.cola.siguiente = nuevoNodo; // Ponemos la flecha del último hacia el nuevo
            this.cola = nuevoNodo;           // Actualizamos nuestra referencia de la cola
        }
    }

    /**
     * Convierte la lista enlazada en un string normal de JS.
     * Útil para el comando MOSTRAR y para tomar la "foto" del estado actual.
     */
    listaAString() {
        let resultado = "";
        let actual = this.cabeza; // Empezamos el viaje en la cabeza

        // Recorremos la lista nodo por nodo hasta llegar al final (null)
        while (actual !== null) {
            resultado += actual.dato;   // Concatenamos el carácter
            actual = actual.siguiente;  // Movemos el puntero al siguiente eslabón
        }

        return resultado; // Devolvemos el texto completo
    }

    /**
     * Limpia la lista actual y la reconstruye a partir de un string.
     * Esencial para restaurar estados en DESHACER y REHACER.
     */
    stringALista(texto) {
        // 1. Vaciamos la lista por completo
        this.cabeza = null;
        this.cola = null;

        // 2. Recorremos el string carácter por carácter
        for (let i = 0; i < texto.length; i++) {
            this.insertarAlFinal(texto[i]); // Reutilizamos nuestro método de inserción
        }
    }
} // <--- AQUÍ SE CIERRA LA CLASE LISTAENLAZADA

// ==========================================================================
// 3. CLASE PILA: Estructura LIFO (Last In, First Out) basada puramente en Nodos
// ==========================================================================
class Pila {
    constructor() {
        this.top = null; // Controla el elemento que está arriba del todo en la pila
    }

    /**
     * Inserta un estado (el texto del documento) en la cima de la pila.
     */
    push(estadoTexto) {
        const nuevoNodo = new Nodo(estadoTexto);
        // El nuevo nodo apunta hacia abajo, al que antes era el top
        nuevoNodo.siguiente = this.top;
        // La cima de la pila ahora es nuestro nuevo nodo
        this.top = nuevoNodo;
    }

    /**
     * Remueve y devuelve el estado que se encuentra en la cima de la pila.
     */
    pop() {
        // Si la pila no tiene elementos, devolvemos null
        if (this.top === null) {
            return null;
        }
        // Guardamos el dato de arriba para no perderlo
        const textoSalida = this.top.dato;
        // Movemos el control de la cima al nodo de abajo
        this.top = this.top.siguiente;
        
        return textoSalida;
    }

    /**
     * Limpia la pila por completo.
     * Crucial para cumplir la regla de vaciar REHACER al escribir o borrar.
     */
    vaciar() {
        this.top = null;
    }
} // <--- AQUÍ SE CIERRA LA CLASE PILA

// ==========================================================================
// 4. CONTROL DE ESTADO DEL EDITOR
// ==========================================================================
// Instanciamos nuestras estructuras propias
const documento = new ListaEnlazada();
const historial = new Pila();
const rehacer = new Pila();

/**
 * Guarda una "foto" del documento actual antes de realizar una modificación.
 * Cumple la regla de limpiar la pila REHACER.
 */
function registrarHistorial() {
    // 1. Convertimos la lista de nodos actual en un string (la foto)
    const fotoActual = documento.listaAString();
    
    // 2. Guardamos esa foto en el historial para el futuro DESHACER
    historial.push(fotoActual);
    
    // 3. ¡Regla crítica! Limpiamos la pila de rehacer por completo
    rehacer.vaciar();
}

// ==========================================================================
// 5. IMPLEMENTACIÓN DE COMANDOS DEL EDITOR
// ==========================================================================

/**
 * Comando: ESCRIBIR <texto>
 * Agrega texto al final del documento actual.
 */
function cmdEscribir(texto) {
    // Guardamos el estado en el historial ANTES de modificar el documento
    registrarHistorial();

    // Recorremos el texto que mandó el usuario y metemos letra por letra a la lista
    for (let i = 0; i < texto.length; i++) {
        documento.insertarAlFinal(texto[i]);
    }
}

/**
 * Comando: BORRAR <n>
 * Elimina los últimos 'n' caracteres del documento.
 */
function cmdBorrar(n) {
    // 1. Regla crítica: Guardamos el estado en el historial ANTES de modificar
    registrarHistorial();

    // 2. Contamos cuántos caracteres tiene el documento actualmente
    let actual = documento.cabeza;
    let longitud = 0;
    while (actual !== null) {
        longitud++;
        actual = actual.siguiente;
    }

    // 3. Caso límite: Si 'n' es igual o mayor a lo que hay, vaciamos el documento
    if (n >= longitud) {
        documento.cabeza = null;
        documento.cola = null;
        return;
    }

    // 4. Si no, calculamos cuántos nodos se quedan vivos
    let nodosAConservar = longitud - n;
    
    // Avanzamos en la lista hasta llegar al último nodo que se salvará
    let apuntador = documento.cabeza;
    for (let i = 1; i < nodosAConservar; i++) {
        apuntador = apuntador.siguiente;
    }

    // 5. Cortamos la cadena ahí: este nodo se convierte en la nueva cola
    documento.cola = apuntador;
    documento.cola.siguiente = null; // Rompemos el enlace con los caracteres eliminados
}

/**
 * Comando: MOSTRAR
 * Imprime en consola el contenido actual del documento.
 */
function cmdMostrar() {
    const textoActual = documento.listaAString();
    
    if (textoActual === "") {
        console.log("(vacio)");
    } else {
        console.log(textoActual);
    }
}

/**
 * Comando: DESHACER
 * Regresa el documento al estado anterior guardado en el historial.
 */
function cmdDeshacer() {
    // 1. Intentamos sacar el estado anterior del historial
    const estadoAnterior = historial.pop();

    // Si es null, la pila estaba vacía (no hay nada que deshacer)
    if (estadoAnterior === null) {
        return; 
    }

    // 2. Guardamos la foto de cómo está el documento justo ahora en rehacer
    const estadoActual = documento.listaAString();
    rehacer.push(estadoActual);

    // 3. Reconstruimos la lista con el texto del pasado
    documento.stringALista(estadoAnterior);
}

/**
 * Comando: REHACER
 * Vuelve a aplicar el estado que se había deshecho.
 */
function cmdRehacer() {
    // 1. Intentamos sacar el estado de la pila rehacer
    const estadoSiguiente = rehacer.pop();

    // Si es null, no hay nada que rehacer
    if (estadoSiguiente === null) {
        return;
    }

    // 2. Guardamos la foto actual en el historial
    const estadoActual = documento.listaAString();
    historial.push(estadoActual);

    // 3. Reconstruimos los nodos con el texto recuperado
    documento.stringALista(estadoSiguiente);
}

/**
 * Comando: BUSCAR <palabra>
 * Reporta la posición (basada en 1) de la primera aparición exacta del texto.
 */
function cmdBuscar(palabra) {
    let posicion = 1;
    let nodoInicio = documento.cabeza;
    
    // Algoritmo de emparejamiento por caracteres consecutivos O(n * m)
    while (nodoInicio !== null) {
        let nodoActual = nodoInicio;
        let coincide = true;
        
        for (let i = 0; i < palabra.length; i++) {
            if (nodoActual === null || nodoActual.dato !== palabra[i]) {
                coincide = false;
                break;
            }
            nodoActual = nodoActual.siguiente;
        }
        
        if (coincide) {
            console.log("Encontrado en la posicion " + posicion);
            return posicion;
        }
        
        nodoInicio = nodoInicio.siguiente;
        posicion++;
    }
    
    console.log("No encontrado");
    return -1;
}

/**
 * Comando: REEMPLAZAR <viejo> <nuevo>
 * Sustituye la primera aparición de una subcadena por otra.
 */
function cmdReemplazar(viejo, nuevo) {
    let posicion = 1;
    let nodoInicio = documento.cabeza;
    let encontrado = false;
    
    // 1. Localizamos si existe la palabra de manera exacta
    while (nodoInicio !== null) {
        let nodoActual = nodoInicio;
        let coincide = true;
        
        for (let i = 0; i < viejo.length; i++) {
            if (nodoActual === null || nodoActual.dato !== viejo[i]) {
                coincide = false;
                break;
            }
            nodoActual = nodoActual.siguiente;
        }
        
        if (coincide) {
            encontrado = true;
            break; // nodoInicio apunta al inicio de la coincidencia
        }
        
        nodoInicio = nodoInicio.siguiente;
        posicion++;
    }
    
    // Si la palabra no existe, salimos inmediatamente sin alterar pilas ni historial
    if (!encontrado) {
        return;
    }
    
    // 2. Guardamos la foto en el historial antes de realizar la modificación
    registrarHistorial();
    
    // 3. Ubicamos el nodo inmediatamente anterior al bloque que vamos a reemplazar
    let anterior = null;
    if (posicion > 1) {
        anterior = documento.cabeza;
        for (let i = 1; i < posicion - 1; i++) {
            anterior = anterior.siguiente;
        }
    }
    
    // 4. Identificamos el nodo remanente que viene después del bloque 'viejo'
    let nodoSiguiente = nodoInicio;
    for (let i = 0; i < viejo.length; i++) {
        nodoSiguiente = nodoSiguiente.siguiente;
    }
    
    // 5. Construimos los nuevos nodos correspondientes a la palabra 'nuevo'
    let cabezaNueva = null;
    let colaNueva = null;
    for (let i = 0; i < nuevo.length; i++) {
        const nuevoNodo = new Nodo(nuevo[i]);
        if (cabezaNueva === null) {
            cabezaNueva = nuevoNodo;
            colaNueva = nuevoNodo;
        } else {
            colaNueva.siguiente = nuevoNodo;
            colaNueva = nuevoNodo;
        }
    }
    
    // 6. Enganchamos el bloque anterior de la lista a la cabeza de la nueva palabra
    if (anterior === null) {
        documento.cabeza = cabezaNueva;
    } else {
        anterior.siguiente = cabezaNueva;
    }
    
    // 7. Enganchamos la cola de la nueva palabra al fragmento remanente
    if (cabezaNueva === null) {
        if (anterior === null) {
            documento.cabeza = nodoSiguiente;
        } else {
            anterior.siguiente = nodoSiguiente;
        }
    } else {
        colaNueva.siguiente = nodoSiguiente;
    }
    
    // 8. Ajustamos la cola global si el reemplazo llegó justo al final del documento
    if (nodoSiguiente === null) {
        documento.cola = (colaNueva !== null) ? colaNueva : anterior;
    }
}

// ==========================================================================
// 6. INTERPRETE DE COMANDOS DESDE ARCHIVO EXTERNO
// ==========================================================================
// Nota: El uso de métodos de strings estándar aquí es exclusivamente para la 
// lectura del archivo de entrada, manteniendo intactas las restricciones algorítmicas de las estructuras.
const fs = require('fs');

function ejecutarDesdeArchivo(rutaArchivo) {
    try {
        // Validamos si el archivo existe
        if (!fs.existsSync(rutaArchivo)) {
            console.log(`❌ Error: El archivo '${rutaArchivo}' no existe.`);
            return;
        }

        // Leemos el archivo completo y lo dividimos por líneas
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        const lineas = contenido.split(/\r?\n/);

        console.log(`\n==================================================`);
        console.log(`PROCESANDO ARCHIVO: ${rutaArchivo}`);
        console.log(`==================================================`);

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].trim();

            // Ignoramos comentarios y líneas en blanco
            if (linea === "" || linea.startsWith("//")) {
                continue;
            }

            // Separamos el comando del argumento compuesto
            let comando = "";
            let argumentos = "";
            const primerEspacio = linea.indexOf(" ");

            if (primerEspacio === -1) {
                comando = linea.toUpperCase();
            } else {
                comando = linea.substring(0, primerEspacio).toUpperCase();
                argumentos = linea.substring(primerEspacio + 1).trim();
            }

            console.log(`\n>>> Ejecutando: ${linea}`);

            switch (comando) {
                case "ESCRIBIR":
                    // Quitamos comillas si el usuario envolvió el texto en ellas
                    if (argumentos.startsWith('"') && argumentos.endsWith('"')) {
                        argumentos = argumentos.substring(1, argumentos.length - 1);
                    }
                    cmdEscribir(argumentos);
                    break;

                case "BORRAR":
                    const cantidad = parseInt(argumentos, 10);
                    cmdBorrar(isNaN(cantidad) ? 0 : cantidad);
                    break;

                case "MOSTRAR":
                    cmdMostrar();
                    break;

                case "DESHACER":
                    cmdDeshacer();
                    break;

                case "REHACER":
                    cmdRehacer();
                    break;

                case "BUSCAR":
                    if (argumentos.startsWith('"') && argumentos.endsWith('"')) {
                        argumentos = argumentos.substring(1, argumentos.length - 1);
                    }
                    cmdBuscar(argumentos);
                    break;

                case "REEMPLAZAR":
                    // El comando REEMPLAZAR espera dos parámetros.
                    // Soportamos formato con comillas '"viejo" "nuevo"' o espacio simple 'viejo nuevo'
                    let viejo = "";
                    let nuevo = "";
                    
                    if (argumentos.startsWith('"')) {
                        const partes = argumentos.split('" "');
                        viejo = partes[0] ? partes[0].replace(/"/g, "") : "";
                        nuevo = partes[1] ? partes[1].replace(/"/g, "") : "";
                    } else {
                        const partes = argumentos.split(" ");
                        viejo = partes[0] || "";
                        nuevo = partes[1] || "";
                    }
                    cmdReemplazar(viejo, nuevo);
                    break;

                default:
                    console.log(`⚠️ Línea ${i + 1}: Comando desconocido '${comando}'`);
            }
        }
        console.log(`\n==================================================`);
        console.log(`FIN DE LA EJECUCIÓN.`);
        console.log(`==================================================\n`);

    } catch (error) {
        console.error(`❌ Ocurrió un error al procesar el archivo:`, error.message);
    }
}

ejecutarDesdeArchivo("./comandos.txt");