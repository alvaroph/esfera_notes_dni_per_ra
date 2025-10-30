// ==UserScript==
// @name         Assignador de Notes per DNI
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Assigna notes massivament des d'un àrea de text usant el DNI de l'alumne a la plataforma de notes.
// @author       (Tu nombre aquí)
// @match        *://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/finalAvaluacioGrupMateria*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Esperar que la pàgina carregui completament
    window.addEventListener('load', () => {
        // Donem un petit marge extra perquè Angular acabi de "pintar" tot
        setTimeout(injectUI, 1000);
    });

    // 2. Injectar la UI (caixa de text i botó)
    function injectUI() {
        const container = document.createElement('div');
        container.id = 'grade-injector-container';

        // Afegim estils CSS per les columnes i la capçalera plegable
        const styles = `
            #grade-injector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                user-select: none;
            }
            #grade-injector-header h3 { margin: 0; }
            #grade-injector-toggle { font-size: 1.5em; padding: 5px; }
            #grade-injector-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
            }
            #injector-col-log h4 { margin-top: 0; }
            #grade-injector-log {
                height: 220px; /* Alçada fixa pel log */
                max-height: none; /* Sobreescriure el max-height anterior */
                overflow-y: auto;
                border: 1px solid #ccc;
                padding: 10px;
                background: #fdfdfd;
                font-family: monospace;
                font-size: 12px;
            }
            #grade-input-area {
                width: 100%;
                height: 180px; /* Alçada augmentada pel textarea */
                box-sizing: border-box;
                font-family: monospace;
            }
            /* Disseny responsive: una columna en pantalles petites */
            @media (max-width: 768px) {
                #grade-injector-body { grid-template-columns: 1fr; }
                #grade-injector-log { height: 150px; } /* Tornar a alçada més petita */
                #grade-input-area { height: 120px; }
            }
        `;

        container.innerHTML = `
            <style>${styles}</style>

            <!-- Capçalera (sempre visible) -->
            <div id="grade-injector-header" title="Plegar / Desplegar">
                <h3 style="margin-top: 0;">Assignador Ràpid de Notes per DNI</h3>
                <div id="grade-injector-toggle">▲</div>
            </div>

            <!-- Cos (plegable) -->
            <div id="grade-injector-body">

                <!-- Columna 1: Input -->
                <div id="injector-col-input">
                    <p style="margin: 4px 0;">Enganxa les dades aquí (un alumne per línia). Format: <strong>DNI,Nota</strong> o <strong>DNI Nota</strong></p>
                    <p style="margin: 4px 0;">Introdueix la nota numèrica (ex: <strong>10, 9, 5, 4</strong>) o text (<strong>PDT, EP, NA</strong>).</p>
                    <textarea id="grade-input-area" rows="8"></textarea>
                    <button id="process-grades-btn" style="padding: 10px 15px; margin-top: 10px; font-size: 14px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Processar Notes
                    </button>
                </div>

                <!-- Columna 2: Log -->
                <div id="injector-col-log">
                     <h4 style="margin-top:0;">Resultats del processament</h4>
                     <div id="grade-injector-log">
                        <p>A punt per processar...</p>
                    </div>
                </div>

            </div>
        `;

        // Estils del contenidor principal
        Object.assign(container.style, {
            padding: '20px',
            backgroundColor: '#f4f8ff',
            border: '2px solid #007bff',
            borderRadius: '8px',
            margin: '20px 0',
            zIndex: '9999',
            position: 'relative'
        });

        // Inserir abans de la taula principal
        const table = document.querySelector('table[data-st-table="dummyStudents"]');

        if (table && table.parentElement) {
            table.parentElement.insertBefore(container, table);
        } else {
            log('No s\'ha trobat la taula principal (data-st-table="dummyStudents"). Inserint a l\'inici del body.', true);
            document.body.prepend(container);
        }

        // Afegir listeners als botons
        document.getElementById('process-grades-btn').addEventListener('click', processGrades);
        document.getElementById('grade-injector-header').addEventListener('click', toggleInjectorBody);
    }

    // Funció per plegar/desplegar el cos de l'eina
    function toggleInjectorBody() {
        const body = document.getElementById('grade-injector-body');
        const toggle = document.getElementById('grade-injector-toggle');
        if (body.style.display === 'none') {
            body.style.display = 'grid'; // Tornar a 'grid' (com als estils)
            toggle.textContent = '▲';
        } else {
            body.style.display = 'none';
            toggle.textContent = '▼';
        }
    }

    // Funció per mostrar missatges al log
    function log(message, isError = false) {
        const logDiv = document.getElementById('grade-injector-log');
        if (logDiv) {
            const p = document.createElement('p');
            p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            p.style.color = isError ? '#d9534f' : '#5cb85c'; // Vermell per error, verd per èxit
            p.style.margin = '2px 0';
            p.style.borderBottom = '1px solid #eee';
            logDiv.prepend(p); // Afegir nous logs al principi
        }
        (isError ? console.error : console.log)(message);
    }

    /**
     * Funció de mapeig: Converteix la nota numèrica (o text) a la nota del desplegable.
     * @param {string} gradeInput - La nota entrada per l'usuari (ex: "10", "5", "NA").
     * @returns {string|null} - El valor per al <select> (ex: "string:A10") o null si no és vàlid.
     */
    function mapGradeToValue(gradeInput) {
        const grade = gradeInput.toUpperCase();

        // Primer, comprovem text directe (PDT, EP, NA)
        if (grade === 'PDT') return 'string:PDT';
        if (grade === 'EP') return 'string:EP';
        if (grade === 'NA') return 'string:NA';

        // Ara, gestionem els valors numèrics
        // Permetre notes amb decimals (ex: 8.5) i arrodonir-les
        const numFloat = parseFloat(gradeInput.replace(',', '.')); // Acceptar coma o punt
        if (isNaN(numFloat)) {
             // Podria ser un text com "A10", donem-li suport per flexibilitat
            if (grade.startsWith('A') && grade.length >= 2) {
                 return 'string:' + grade;
            }
            return null; // Entrada invàlida
        }

        const num = Math.round(numFloat); // Arrodonir a l'enter més proper

        if (num >= 10) return 'string:A10';
        if (num === 9) return 'string:A9';
        if (num === 8) return 'string:A8';
        if (num === 7) return 'string:A7';
        if (num === 6) return 'string:A6';
        if (num === 5) return 'string:A5';
        if (num < 5 && num >= 0) return 'string:NA'; // Mapeja 0-4 a "No assolit"

        return null; // Número invàlid (ex: negatiu)
    }

    // 3. Funció principal per processar les notes
    function processGrades() {
        log('Iniciant processament...');
        document.getElementById('grade-injector-log').innerHTML = ''; // Netejar log
        const input = document.getElementById('grade-input-area').value.trim();

        if (!input) {
            log('L\'àrea de text és buida.', true);
            return;
        }

        const lines = input.split('\n');
        const gradeMap = new Map();
        let parseErrors = 0;

        // Parsejar l'entrada de l'usuari
        lines.forEach((line, index) => {
            if (line.trim()) {
                // Separar per coma, espai or tabulació
                const parts = line.trim().split(/[\s,t]+/);
                if (parts.length >= 2) {
                    const dni = parts[0].trim().toUpperCase();
                    const grade = parts[1].trim(); // Guardar la nota original (ex: 8.5)
                    if (dni && grade) {
                        gradeMap.set(dni, grade);
                    } else {
                        log(`Error en parsejar línia ${index + 1}: "${line}". S'ignora.`, true);
                        parseErrors++;
                    }
                } else {
                     log(`Error en parsejar línia ${index + 1}: "${line}". Format incorrecte.`, true);
                     parseErrors++;
                }
            }
        });

        if (gradeMap.size === 0) {
            log("No s'han pogut parsejar dades vàlides. Assegura't del format: DNI,Nota", true);
            return;
        }

        log(`Dades parsejades: ${gradeMap.size} alumnes a processar. ${parseErrors} línies ignorades.`);

        // Iterar per les files de la taula
        const studentRows = document.querySelectorAll('tbody tr[data-ng-repeat^="alumne in dummyStudents"]');
        if (studentRows.length === 0) {
            log('No s\'han trobat files d\'alumnes a la taula (tbody tr[data-ng-repeat^="alumne in dummyStudents"]). És visible la taula?', true);
            return;
        }

        let foundCount = 0;
        let updatedCount = 0;

        studentRows.forEach((row) => {
            row.style.backgroundColor = '';
            const dniCell = row.querySelectorAll('td')[4];
            if (!dniCell) return;

            const dni = dniCell.textContent.trim().toUpperCase();

            if (gradeMap.has(dni)) {
                foundCount++;
                const gradeInput = gradeMap.get(dni); // ex: "8.5", "5", "NA"

                const targetValue = mapGradeToValue(gradeInput);

                if (!targetValue) {
                    log(`ERROR: Alumne ${dni} - la nota '${gradeInput}' no és vàlida o no es pot mapejar.`, true);
                    row.style.backgroundColor = '#f8d7da';
                    return;
                }

                const select = row.querySelector('select[data-ng-if="el.type==\'select\' && !alumne.esEpriEinf"]');

                if (select) {
                    const optionExists = select.querySelector(`option[value="${targetValue}"]`);

                    if (optionExists) {
                        select.value = targetValue;
                        select.dispatchEvent(new Event('input', { bubbles: true }));
                        select.dispatchEvent(new Event('change', { bubbles: true }));

                        log(`ÈXIT: Alumne ${dni} actualitzat a ${gradeInput} (Mapejat a: ${targetValue.replace('string:','')}).`, false);
                        row.style.backgroundColor = '#d4edda';
                        updatedCount++;
                    } else {
                        log(`ERROR: Alumne ${dni} - la nota '${gradeInput}' (mapejada a: ${targetValue}) no és una opció vàlida en el desplegable.`, true);
                        row.style.backgroundColor = '#f8d7da';
                    }
                } else {
                    log(`ERROR: Alumne ${dni} - No s'ha trobat el desplegable de nota en aquesta fila.`, true);
                    row.style.backgroundColor = '#f8d7da';
                }
            }
        });

        log(`Procés completat. Alumnes trobats a la taula: ${foundCount}. Alumnes actualitzats amb èxit: ${updatedCount}.`, false);
        if (updatedCount < gradeMap.size) {
            log(`AVÍS: ${gradeMap.size - updatedCount} alumnes de la teva llista no s'han trobat o no s'han pogut actualitzar a la taula actual.`, true);
        }
    }

})();