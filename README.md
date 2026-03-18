# Esfer@ Script: Assignador Massiu de Notes v2.1

Millores personalitzades per a la plataforma d'avaluació Esfer@ del Departament d'Educació de la Generalitat de Catalunya.

Aquest script et permet estalviar hores a l'hora de posar les notes finals. Deixa de fer clic a milers de desplegables i aplica totes les notes d'un grup en segons, fent un simple copiar-enganxar des del teu full de càlcul (Excel, Google Sheets, etc.).

A més, **coloreja les notes** creant un "mapa de calor" visual de la classe i t'avisa de qualsevol anomalia (alumnes sense nota, pendents o DNIs erronis).

---

### 🔧 Requisits

Per instal·lar aquest script necessites:

- 🔌 **Tampermonkey**: Una extensió per a navegadors que permet executar scripts d'usuari.
- 🌐 Un navegador compatible (Chrome, Firefox, Edge...).

---

### 🚀 Instal·lació

1.  Instal·la Tampermonkey des de la seva web oficial:
    👉 [https://www.tampermonkey.net/](https://www.tampermonkey.net/)

2.  Fes clic a l'enllaç següent per descarregar l'script:
    👉  [ Instal·lar ](https://raw.githubusercontent.com/alvaroph/esfera_notes_dni_per_ra/refs/heads/main/script.user.js) 

3.  Tampermonkey t'obrirà una pestanya amb el codi i un botó per "Install" (Instal·lar). Fes-hi clic.

Un cop instal·lat, l'script s'activarà automàticament quan entris a la pàgina d'avaluació final de grup/matèria a Esfer@ (la URL que acaba en `finalAvaluacioGrupMateria`).

---

### 💡 Com Fer-lo Servir: El Flux de Treball

L'objectiu és anar del teu Moodle (o un altre gestor de notes) a l'Esfer@ en menys d'un minut.

#### Pas 1: Aconseguir les dades (Excel/Moodle)

Exporta les teves notes des de Moodle, Google Classroom, o el teu propi Excel. El que necessites és un full de càlcul amb dues columnes:

-   El DNI de l'alumne (o NIE/Passaport).
-   La Nota que vols posar (numèrica o de text).

**Recordatori de Moodle**: Per exportar el DNI, aquest ha d'estar al camp "Número d'ID" del perfil de l'alumne a Moodle. En exportar les notes des del Qualificador, assegura't de marcar la casella "Número d'ID" a les "Opcions del format d'exportació".

#### Pas 2: Copiar les Dades

Al teu full de càlcul, selecciona només les dues columnes (DNI i Nota) de tots els teus alumnes i fes `Ctrl+C` (Copiar).

#### Pas 3: Enganxar i Processar

1.  Ves a la pàgina d'avaluació final de l'Esfer@. Veuràs el nou panell "Assignador Massiu" a la part superior.
2.  Fes clic a la caixa de text de l'esquerra i fes `Ctrl+V` (Enganxar).
3.  Veuràs totes les teves dades enganxades, una línia per alumne.
4.  Fes clic al botó verd **"PROCESSAR I ACOLORIR"**.

L'script s'encarregarà de buscar cada DNI a la pestanya activa, assignar-li la nota corresponent, acolorir els desplegables i generar un informe detallat al panell de la dreta.

---

### ✅ Funcionalitats

-   **Interfície Integrada**: Afegeix un panell útil a la part superior de la pàgina, sense molestar.
-   **Plegable**: Pots plegar i desplegar el panell per estalviar espai amb un sol clic al títol.
-   **Entrada Massiva de Notes**: Processa desenes de notes en segons fent copiar-enganxar.
-   **Traducció Automàtica**: Entra la nota com vulguis:
    -   **Numèrica (amb arrodoniment)**: `10`, `9`, `8.5` (es converteix a `9`), `7`, `6`, `5`.
    -   **Suspesos**: `4.9` o inferior (tots es converteixen a `NA`).
    -   **Text**: `NA`, `EP`, `PDT`.
-   **Acoloriment Natiu (Mapa de Calor)**: L'script llegeix totes les notes de la taula (les noves i les que ja hi eren) i pinta els desplegables exactament com ho fa Esfer@:
    -   🟩 **Verd**: Assolit (5 a 10).
    -   🟥 **Vermell**: No Assolit (NA).
    -   🟧 **Taronja**: En Procés (EP).
    -   🟨 **Groc**: Pendent (PDT).
-   **Control d'Errors i Registre Detallat (NOU)**: El panell de la dreta fa una auditoria completa un cop acaba d'assignar les notes:
    -   ✅ Et confirma quantes notes s'han inserit amb èxit.
    -   ⚠️ **Falta Nota**: T'avisa amb nom i cognom si algun alumne de la taula s'ha quedat amb la casella en blanc.
    -   🚨 **Alerta Pendent**: Et ressalta quins alumnes tenen la nota "PDT" per a que els puguis revisar.
    -   ❌ **DNI no trobat**: T'alerta si has enganxat un DNI que no correspon a cap alumne de la pestanya actual.
-   **Compatibilitat Angular/SPA**: Detecta automàticament la pestanya activa (ex: F1, F2...) per no barrejar dades entre avaluacions.

---

### 📜 Llicència MIT — Sense responsabilitats

Aquest projecte està distribuït sota la llicència MIT.
Això vol dir:

-   Pots utilitzar, modificar i redistribuir lliurement el codi.
-   El codi s'ofereix "tal com és", sense garanties de cap mena.
-   L’autor no es fa responsable de cap dany, error o conseqüència derivada del seu ús.

Fes-lo servir sota la teva responsabilitat i sentit comú.

