// ==UserScript==
// @name         Assignador de Notes per DNI (Esfer@ v2.1 - Control Errors i Pendents)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Assigna notes, coloreja, i alerta de DNIs erronis o notes Pendents.
// @author       Álvaro Pérez
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const CONTAINER_ID = 'grade-injector-container';

    function tryInject() {
        if (document.getElementById(CONTAINER_ID)) return;
        const mainView = document.querySelector('[data-ng-view]') || document.getElementById('mainView');
        const hasTable = document.querySelector('tr[data-ng-repeat]');

        if (mainView && hasTable) {
            injectUI(mainView);
        }
    }

    function injectUI(parent) {
        if (document.getElementById(CONTAINER_ID)) return;
        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style = "background:#f4f7f9; border:2px solid #0056b3; margin:15px; border-radius:8px; font-family: sans-serif; position:relative; z-index:10001; box-shadow: 0 4px 12px rgba(0,0,0,0.15);";

        container.innerHTML = `
            <div id="injector-header" style="background:#0056b3; color:white; padding:10px; cursor:pointer; display:flex; justify-content:space-between; border-radius:6px 6px 0 0;">
                <b>⚡ ASSIGNADOR MASSIIU v2.1 (Control Errors)</b>
                <span id="inj-toggle">Plegar ▲</span>
            </div>
            <div id="injector-body" style="padding:15px; display:grid; grid-template-columns: 1.2fr 1fr; gap:20px;">
                <div>
                    <label style="display:block; font-size:11px; font-weight:bold; margin-bottom:5px;">DNI NOTA (Ex: 12345678A 9)</label>
                    <textarea id="inj-data" style="width:100%; height:140px; font-family:monospace; font-size:12px; border:1px solid #aaa; padding:5px;"></textarea>
                    <button id="inj-btn" style="width:100%; margin-top:10px; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">PROCESSAR I ACOLORIR</button>
                </div>
                <div>
                    <h4 style="margin:0 0 5px 0; font-size:11px; color:#555;">LOG DE REVISIÓ:</h4>
                    <div id="inj-log" style="height:170px; overflow-y:auto; background:white; border:1px solid #ddd; padding:8px; font-size:11px; font-family:monospace; line-height:1.4;">
                        <div style="color:#888;">> Preparat. Insereix dades i prem el botó.</div>
                    </div>
                </div>
            </div>
        `;

        parent.prepend(container);

        document.getElementById('inj-btn').onclick = processData;
        document.getElementById('injector-header').onclick = () => {
            const body = document.getElementById('injector-body');
            body.style.display = body.style.display === 'none' ? 'grid' : 'none';
        };
    }

    function addLog(msg, color = '#333') {
        const logDiv = document.getElementById('inj-log');
        const entry = document.createElement('div');
        entry.style.color = color;
        entry.style.borderBottom = "1px solid #f9f9f9";
        entry.style.padding = "3px 0";
        entry.innerHTML = msg;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function processData() {
        const text = document.getElementById('inj-data').value.trim();
        const logDiv = document.getElementById('inj-log');
        logDiv.innerHTML = '';

        const lines = text ? text.split('\n') : [];
        const inputMap = new Map();
        const foundInWeb = new Set();

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if(parts.length >= 2) {
                const dni = parts[0].toUpperCase().replace(/[^0-9A-Z]/g, '');
                const nota = parts[parts.length - 1].replace(',', '.');
                inputMap.set(dni, nota);
            }
        });

        const activePane = document.querySelector('.tab-pane.active') || document;
        const rows = activePane.querySelectorAll('tr[data-ng-repeat]');
        
        if (rows.length === 0) {
            addLog("<b>Error:</b> No s'han trobat alumnes a la taula.", "red");
            return;
        }

        let countOK = 0;
        let countBuit = 0;
        let countPendent = 0;

        addLog(`<b>> Iniciant repàs de la taula (${rows.length} alumnes)...</b>`, "blue");

        // FASE 1: Inserir dades
        rows.forEach(row => {
            const rowText = row.innerText.toUpperCase().replace(/[^0-9A-Z]/g, '');
            const select = row.querySelector('select');
            
            if (select) {
                inputMap.forEach((nota, dni) => {
                    if (rowText.includes(dni)) {
                        const val = mapNote(nota);
                        if (val && select.value !== val) {
                            select.value = val;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            select.dispatchEvent(new Event('input', { bubbles: true }));
                            countOK++;
                        }
                        foundInWeb.add(dni);
                    }
                });
            }
        });

        // FASE 2: Repassar colors i detectar estats (Buits i Pendents)
        rows.forEach(row => {
            const select = row.querySelector('select');
            if (select) {
                const currentValue = select.value;
                const rowCells = row.querySelectorAll('td');
                const nomAlumne = rowCells[1] ? rowCells[1].innerText.trim() + " " + (rowCells[2]?.innerText.trim() || "") : "Desconegut";

                // Revisió d'alertes
                if (!currentValue || currentValue.includes('?')) {
                    addLog(`⚠️ <b>FALTA NOTA (Buit):</b> ${nomAlumne}`, "#d35400"); // Taronja fosc
                    countBuit++;
                } else if (currentValue.includes('PDT')) {
                    addLog(`🚨 <b>ALERTA (Pendent):</b> ${nomAlumne} té la nota com a Pendent!`, "#c0392b"); // Vermell
                    countPendent++;
                }

                // Acolorir el select
                if (currentValue && !currentValue.includes('?')) {
                    applyEsferaColors(select, currentValue);
                } else {
                    select.style.backgroundColor = "";
                    select.style.color = "";
                    select.style.fontWeight = "normal";
                }
            }
        });

        // FASE 3: Reportar DNIs erronis / no trobats
        inputMap.forEach((nota, dni) => {
            if (!foundInWeb.has(dni)) {
                addLog(`❌ <b>ERROR DE DNI:</b> ${dni} no concorda amb cap alumne d'aquesta pàgina. Revisa'l!`, "red");
            }
        });

        // RESUM FINAL
        addLog(`<br><b>RESUM FINAL:</b><br>✅ ${countOK} notes processades.<br>⚠️ ${countBuit} alumnes sense dades.<br>🚨 ${countPendent} alumnes marcats com a Pendent.`, "green");
    }

    function applyEsferaColors(select, val) {
        select.style.border = "1px solid rgb(204, 204, 204)";
        
        if (val.includes('NA')) { // No assolit
            select.style.backgroundColor = "red";
            select.style.color = "white";
            select.style.fontWeight = "bold";
        } else if (val.includes('PDT')) { // Pendent
            select.style.backgroundColor = "yellow";
            select.style.color = "black";
            select.style.fontWeight = "normal";
        } else if (val.includes('EP')) { // En procés
            select.style.backgroundColor = "#ff8800"; // Taronja
            select.style.color = "white";
            select.style.fontWeight = "bold";
        } else if (val.includes('A10') || val.includes('A9') || val.includes('A8') || val.includes('A7') || val.includes('A6') || val.includes('A5')) {
            // Assolits
            select.style.backgroundColor = "lightgreen";
            select.style.color = "black";
            select.style.fontWeight = "normal";
        } else {
            select.style.backgroundColor = "";
            select.style.color = "";
            select.style.fontWeight = "normal";
        }
    }

    function mapNote(n) {
        const valStr = n.toUpperCase();
        if (valStr === 'NA') return 'string:NA';
        if (valStr === 'EP') return 'string:EP';
        if (valStr === 'PDT') return 'string:PDT';
        const val = parseFloat(n);
        if (isNaN(val)) return null;
        if (val < 5) return 'string:NA';
        const rounded = Math.round(val);
        return 'string:A' + Math.min(10, Math.max(5, rounded));
    }

    const observer = new MutationObserver(() => { tryInject(); });
    observer.observe(document.body, { childList: true, subtree: true });

})();