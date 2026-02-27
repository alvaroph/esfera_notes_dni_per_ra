// ==UserScript==
// @name         Assignador de Notes per DNI (Esfer@ Fix)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Corrección para carga dinámica en Esfer@ (SPA AngularJS)
// @author       Genis
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const CONTAINER_ID = 'grade-injector-container';

    // 1. FUNCIÓN DE INYECCIÓN
    function tryInject() {
        // Si ya existe el panel, no hacemos nada
        if (document.getElementById(CONTAINER_ID)) return;

        // Buscamos el contenedor principal donde AngularJS renderiza la vista
        const mainView = document.querySelector('[data-ng-view]') || document.getElementById('mainView');
        
        // Buscamos cualquier tabla que parezca de alumnos (suelen tener tr con ng-repeat)
        const table = document.querySelector('table tr[data-ng-repeat]') ? document.querySelector('table') : null;

        if (mainView && table) {
            console.log('SISTEMA: Detectada vista activa y tabla. Inyectando...');
            injectUI(mainView, table);
        }
    }

    function injectUI(parent, table) {
        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style = "background:#f8f9fa; border:2px solid #007bff; margin:15px; border-radius:8px; font-family: sans-serif; position:relative; z-index:10001;";

        container.innerHTML = `
            <div id="injector-header" style="background:#007bff; color:white; padding:10px; cursor:pointer; display:flex; justify-content:space-between; border-radius:5px 5px 0 0;">
                <b style="font-size:14px;">⚡ ASSIGNADOR MASSIIU v1.7 (Esfer@)</b>
                <span id="inj-toggle">▲</span>
            </div>
            <div id="injector-body" style="padding:15px; display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div>
                    <label style="display:block; font-size:11px; font-weight:bold; margin-bottom:5px;">DNI + NOTA (Ex: 12345678A 9.5)</label>
                    <textarea id="inj-data" style="width:100%; height:120px; font-family:monospace; font-size:12px; border:1px solid #ccc;" placeholder="Paste aquí los datos..."></textarea>
                    <button id="inj-btn" style="width:100%; margin-top:10px; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">PROCESAR AHORA</button>
                </div>
                <div id="inj-log" style="height:150px; overflow-y:auto; background:white; border:1px solid #ddd; padding:5px; font-size:11px; font-family:monospace;">
                    <div style="color:blue;">> Sistema listo. Esperando datos...</div>
                </div>
            </div>
        `;

        // Insertar siempre al principio del contenedor de la vista
        parent.prepend(container);

        // Eventos
        document.getElementById('inj-btn').onclick = processData;
        document.getElementById('injector-header').onclick = () => {
            const body = document.getElementById('injector-body');
            body.style.display = body.style.display === 'none' ? 'grid' : 'none';
        };
    }

    function processData() {
        const text = document.getElementById('inj-data').value;
        const log = document.getElementById('inj-log');
        const lines = text.split('\n');
        const dataMap = new Map();

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if(parts.length >= 2) {
                const dni = parts[0].toUpperCase().replace(/[^0-9A-Z]/g, '');
                const nota = parts[parts.length - 1].replace(',', '.');
                dataMap.set(dni, nota);
            }
        });

        const rows = document.querySelectorAll('tr[data-ng-repeat]');
        let count = 0;

        rows.forEach(row => {
            const rowText = row.innerText.toUpperCase().replace(/[^0-9A-Z]/g, '');
            dataMap.forEach((nota, dni) => {
                if (rowText.includes(dni)) {
                    const select = row.querySelector('select');
                    if (select) {
                        const val = mapNote(nota);
                        if (val) {
                            select.value = val;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            select.dispatchEvent(new Event('input', { bubbles: true }));
                            row.style.backgroundColor = '#d4edda';
                            count++;
                        }
                    }
                }
            });
        });

        const status = document.createElement('div');
        status.innerHTML = `<span style="color:green;">✔ OK: ${count}</span> | <span style="color:red;">Restantes: ${dataMap.size - count}</span>`;
        log.prepend(status);
    }

    function mapNote(n) {
        const val = parseFloat(n);
        if (isNaN(val)) return null;
        if (val < 5) return 'string:NA';
        const rounded = Math.round(val);
        return 'string:A' + Math.min(10, Math.max(5, rounded));
    }

    // 2. OBSERVADOR DINÁMICO (Crucial para AngularJS)
    // En lugar de un intervalo fijo, vigilamos cambios en el DOM
    const observer = new MutationObserver(() => {
        tryInject();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();