
(() => {
  "use strict";

  const STORAGE_KEY = "smartbrief-v1-state";

  const PROJECT_ORDER = [
    "fahrzeug",
    "schaufenster",
    "gebaeude",
    "beschilderung",
    "event",
    "spezialprojekt"
  ];

  const PROJECTS = {
    fahrzeug: {
      name: "Fahrzeug",
      icon: "assets/icons/fahrzeug.png",
      question: "Wie sollen die Fahrzeuge beschriftet werden?",
      choices: [
        "Komplettbeschriftung",
        "Teilbeschriftung",
        "Logo / Firmenbeschriftung",
        "Einzelne Elemente",
        "Noch nicht sicher"
      ],
      fields: [
        { id: "count", label: "Anzahl Fahrzeuge", type: "number" },
        { id: "model", label: "Marke / Modell", type: "text" },
        { id: "same", label: "Sind die Fahrzeuge baugleich?", type: "select", options: ["", "Ja", "Nein", "Noch nicht sicher"] }
      ],
      baseUploads: ["Vorderseite", "Rückseite", "Linke Seite", "Rechte Seite"]
    },

    schaufenster: {
      name: "Schaufenster",
      icon: "assets/icons/schaufenster.png",
      question: "Was möchten Sie am Schaufenster umsetzen?",
      choices: [
        "Vollflächige Beschriftung",
        "Teilbeschriftung",
        "Sichtschutz",
        "Aktionen / Öffnungszeiten",
        "Noch nicht sicher"
      ],
      fields: [
        { id: "count", label: "Anzahl Flächen", type: "number" },
        { id: "size", label: "Ungefähre Breite × Höhe", type: "text" }
      ],
      baseUploads: ["Gesamtansicht", "Fensterflächen", "Detail Untergrund"]
    },

    gebaeude: {
      name: "Gebäude",
      icon: "assets/icons/gebaeude.png",
      question: "Welche Gebäudebereiche sollen beschriftet werden?",
      choices: [
        "Eingangstüre",
        "Liftbeschriftung",
        "Stockwerke",
        "Fassade",
        "Innenräume",
        "Sonstiges"
      ],
      fields: [
        { id: "floors", label: "Anzahl Stockwerke", type: "number" },
        { id: "lifts", label: "Anzahl Lifte", type: "number" }
      ],
      baseUploads: ["Gesamtansicht"]
    },

    beschilderung: {
      name: "Beschilderung",
      icon: "assets/icons/beschilderung.png",
      question: "Welche Beschilderungen benötigen Sie?",
      choices: [
        "Aussenstele",
        "Parkplatzschilder",
        "Wegweiser",
        "Firmenschild",
        "Hinweistafeln",
        "Sonstiges"
      ],
      fields: [
        { id: "count", label: "Anzahl Schilder", type: "number" },
        { id: "size", label: "Ungefähres Format", type: "text" }
      ],
      baseUploads: ["Übersicht Montageort"]
    },

    event: {
      name: "Event / Messe",
      icon: "assets/icons/event.png",
      question: "Was möchten Sie für den Event realisieren?",
      choices: [
        "Messestand",
        "Eventbranding",
        "Displays / Roll-ups",
        "Temporäre Beschriftung",
        "Sonstiges"
      ],
      fields: [
        { id: "event", label: "Event / Messe", type: "text" },
        { id: "location", label: "Ort", type: "text" },
        { id: "space", label: "Standfläche", type: "text" }
      ],
      baseUploads: ["Standplan", "Logo", "Visualisierung / Referenz"]
    },

    spezialprojekt: {
      name: "Spezialprojekt",
      icon: "assets/icons/spezialprojekt.png",
      question: "Worum geht es bei Ihrem Projekt?",
      choices: [
        "Objekt / Installation",
        "Prototyp",
        "Verpackungsdummy",
        "Einzelanfertigung",
        "Etwas anderes"
      ],
      fields: [
        { id: "description", label: "Kurzbeschrieb", type: "text" },
        { id: "size", label: "Ungefähre Grösse", type: "text" },
        { id: "count", label: "Anzahl", type: "number" }
      ],
      baseUploads: ["Skizze", "Referenzbild", "Masszeichnung", "Logo"]
    }
  };

  const freshState = () => {
    const areaData = {};
    const uploads = {};
    PROJECT_ORDER.forEach(key => {
      areaData[key] = { choices: [], fields: {} };
      PROJECTS[key].fields.forEach(field => areaData[key].fields[field.id] = "");
      uploads[key] = {};
    });

    return {
      selected: [],
      overview: { projectName: "", location: "", context: "" },
      areaData,
      design: "",
      uploadArea: "",
      uploads,
      extraUploads: {},
      planning: { date: "", timing: "", budget: "", remarks: "" },
      contact: { name: "", email: "" }
    };
  };

  let state = loadState();
  let route = parseRoute();

  const screen = document.getElementById("screen");
  const footer = document.getElementById("footer");
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const phaseEl = document.getElementById("progressPhase");
  const countEl = document.getElementById("progressCount");
  const barEl = document.getElementById("progressBar");
  const closeBtn = document.getElementById("closeBtn");

  const resetDialog = document.getElementById("resetDialog");
  const sentDialog = document.getElementById("sentDialog");

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return freshState();
      const parsed = JSON.parse(raw);
      return mergeState(freshState(), parsed);
    }catch{
      return freshState();
    }
  }

  function mergeState(base, incoming){
    if(!incoming || typeof incoming !== "object") return base;
    const merged = {...base, ...incoming};
    merged.overview = {...base.overview, ...(incoming.overview || {})};
    merged.planning = {...base.planning, ...(incoming.planning || {})};
    merged.contact = {...base.contact, ...(incoming.contact || {})};
    merged.areaData = {...base.areaData};
    merged.uploads = {...base.uploads};
    merged.extraUploads = {...(incoming.extraUploads || {})};

    PROJECT_ORDER.forEach(key => {
      merged.areaData[key] = {
        ...base.areaData[key],
        ...((incoming.areaData || {})[key] || {}),
        fields: {
          ...base.areaData[key].fields,
          ...((((incoming.areaData || {})[key] || {}).fields) || {})
        }
      };
      merged.uploads[key] = {
        ...base.uploads[key],
        ...((incoming.uploads || {})[key] || {})
      };
    });

    if(!Array.isArray(merged.selected)) merged.selected = [];
    merged.selected = merged.selected.filter(k => PROJECT_ORDER.includes(k));
    return merged;
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function parseRoute(){
    const hash = (location.hash || "#start").slice(1);
    if(hash.startsWith("area/")){
      const index = Number(hash.split("/")[1]);
      return {name:"area", index:Number.isFinite(index) ? index : 0};
    }
    return {name:hash || "start"};
  }

  function go(name, index){
    const hash = name === "area" ? `#area/${index}` : `#${name}`;
    if(location.hash === hash){
      route = parseRoute();
      render();
    } else {
      location.hash = hash;
    }
  }

  function totalSteps(){
    return 8 + Math.max(1, state.selected.length);
  }

  function stepInfo(){
    const n = Math.max(1, state.selected.length);
    if(route.name === "start") return {step:1, phase:"PROJEKT"};
    if(route.name === "select") return {step:2, phase:"PROJEKT"};
    if(route.name === "overview") return {step:3, phase:"PROJEKT"};
    if(route.name === "area") return {step:4 + Math.min(route.index, n-1), phase:"DETAILS"};
    if(route.name === "design") return {step:4+n, phase:"DATEN"};
    if(route.name === "uploads") return {step:5+n, phase:"DATEN"};
    if(route.name === "check") return {step:6+n, phase:"PLANUNG"};
    if(route.name === "planning") return {step:7+n, phase:"PLANUNG"};
    return {step:8+n, phase:"ANFRAGE"};
  }

  function updateProgress(){
    const {step, phase} = stepInfo();
    const total = totalSteps();
    phaseEl.textContent = phase;
    countEl.textContent = `${step} / ${total}`;
    barEl.style.width = `${Math.min(100, step / total * 100)}%`;
  }

  function setFooter({show=true, backLabel="Zurück", nextLabel="Weiter", back, next, disabled=false} = {}){
    footer.classList.toggle("hidden", !show);
    if(!show) return;

    backBtn.textContent = backLabel;
    nextBtn.textContent = nextLabel;
    nextBtn.disabled = disabled;

    backBtn.onclick = back || null;
    nextBtn.onclick = disabled ? null : next;
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);
  }

  function toggleInArray(arr, value){
    return arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
  }

  function selectedNames(){
    return state.selected.map(key => PROJECTS[key].name);
  }

  function areaUploadRequirements(key){
    const cfg = PROJECTS[key];
    const choices = state.areaData[key].choices;

    if(key === "gebaeude" && choices.length){
      return ["Gesamtansicht", ...choices.map(choice => `Foto: ${choice}`)];
    }

    if(key === "beschilderung" && choices.length){
      return choices.map(choice => `Montageort: ${choice}`);
    }

    return [...cfg.baseUploads];
  }

  function slotId(key, label){
    return `${key}::${label}`;
  }

  async function openDb(){
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("smartbrief-v1-files", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if(!db.objectStoreNames.contains("files")){
          db.createObjectStore("files", {keyPath:"id"});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveFile(id, file){
    try{
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({id, file});
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }catch(err){
      console.warn("Datei konnte nicht persistent gespeichert werden.", err);
    }
  }

  async function getFile(id){
    try{
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readonly");
        const req = tx.objectStore("files").get(id);
        req.onsuccess = () => resolve(req.result?.file || null);
        req.onerror = () => reject(req.error);
      });
    }catch{
      return null;
    }
  }

  async function clearFiles(){
    try{
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }catch{}
  }

  function fileMeta(key, label){
    return state.uploads[key]?.[label] || null;
  }

  function setFileMeta(key, label, file){
    if(!state.uploads[key]) state.uploads[key] = {};
    state.uploads[key][label] = {
      name:file.name,
      type:file.type,
      size:file.size
    };
    saveState();
  }

  function prettyBytes(bytes){
    if(!bytes) return "";
    if(bytes < 1024) return `${bytes} B`;
    if(bytes < 1024*1024) return `${Math.round(bytes/1024)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  }

  function render(){
    if(route.name === "area"){
      if(!state.selected.length){
        go("select");
        return;
      }
      if(route.index < 0 || route.index >= state.selected.length){
        go("area", 0);
        return;
      }
    }

    updateProgress();
    screen.scrollTop = 0;

    const renderers = {
      start:renderStart,
      select:renderSelect,
      overview:renderOverview,
      area:renderArea,
      design:renderDesign,
      uploads:renderUploads,
      check:renderCheck,
      planning:renderPlanning,
      summary:renderSummary
    };

    (renderers[route.name] || renderStart)();
  }

  function renderStart(){
    setFooter({show:false});
    screen.innerHTML = `
      <section class="start-screen">
        <p class="eyebrow">PROJEKTANFRAGE</p>
        <h1>Erzählen Sie uns von Ihrem Projekt.</h1>
        <p class="lead">In wenigen Schritten erfassen wir die wichtigsten Angaben für eine erste Beurteilung.</p>
        <button id="startBtn" class="start-cta" type="button">Projekt starten</button>
        <div class="micro">CA. 3–5 MINUTEN · KEIN LOGIN NÖTIG</div>
      </section>
    `;
    document.getElementById("startBtn").onclick = () => go("select");
  }

  function renderSelect(){
    const count = state.selected.length;
    setFooter({
      back:() => go("start"),
      next:() => go("overview"),
      nextLabel:count ? `Weiter mit ${count} Bereich${count === 1 ? "" : "en"}` : "Weiter",
      disabled:count === 0
    });

    screen.innerHTML = `
      <p class="eyebrow">SCHRITT 1</p>
      <h1>Was möchten Sie realisieren?</h1>
      <p class="multi-note">Mehrfachauswahl möglich. Wählen Sie alle passenden Bereiche.</p>

      <div class="project-grid">
        ${PROJECT_ORDER.map(key => {
          const cfg = PROJECTS[key];
          const selected = state.selected.includes(key);
          return `
            <button class="project-tile ${selected ? "selected" : ""}" type="button" data-project="${key}" aria-pressed="${selected}">
              <span class="project-tick">✓</span>
              <img src="${cfg.icon}" alt="">
              <span class="project-tile-name">${escapeHtml(cfg.name)}</span>
            </button>
          `;
        }).join("")}
      </div>
      <div class="selection-status">${count ? `${count} Bereich${count === 1 ? "" : "e"} ausgewählt` : "Noch kein Bereich ausgewählt"}</div>
    `;

    screen.querySelectorAll("[data-project]").forEach(button => {
      button.onclick = () => {
        const key = button.dataset.project;
        state.selected = toggleInArray(state.selected, key)
          .sort((a,b) => PROJECT_ORDER.indexOf(a) - PROJECT_ORDER.indexOf(b));

        if(!state.uploadArea || !state.selected.includes(state.uploadArea)){
          state.uploadArea = state.selected[0] || "";
        }

        saveState();
        renderSelect();
      };
    });
  }

  function renderOverview(){
    const count = state.selected.length;
    if(!count){ go("select"); return; }

    setFooter({
      back:() => go("select"),
      next:() => go("area", 0),
      nextLabel:"Projekt erfassen"
    });

    screen.innerHTML = `
      <p class="eyebrow">IHR PROJEKT</p>
      <h1>Ihr Projekt umfasst ${count} Bereich${count === 1 ? "" : "e"}.</h1>

      <div class="confirm-list">
        ${state.selected.map(key => `
          <div class="confirm-row">
            <span class="confirm-check">✓</span>
            <span>${escapeHtml(PROJECTS[key].name)}</span>
          </div>
        `).join("")}
      </div>

      <p class="helper">Diese Bereiche fragen wir nun nacheinander ab. Alles gehört zu einer einzigen Anfrage.</p>

      <div class="field-grid">
        <div class="field">
          <label>Projektname · optional</label>
          <input id="projectName" value="${escapeHtml(state.overview.projectName)}">
        </div>
        <div class="field">
          <label>Standort</label>
          <input id="projectLocation" value="${escapeHtml(state.overview.location)}">
        </div>
        <div class="field">
          <label>Projektart / Anlass · optional</label>
          <select id="projectContext">
            <option value=""></option>
            ${["Neuer Standort","Umbau","Einzelprojekt","Sonstiges"].map(value =>
              `<option ${state.overview.context === value ? "selected" : ""}>${value}</option>`
            ).join("")}
          </select>
        </div>
      </div>
    `;

    document.getElementById("projectName").oninput = e => {
      state.overview.projectName = e.target.value; saveState();
    };
    document.getElementById("projectLocation").oninput = e => {
      state.overview.location = e.target.value; saveState();
    };
    document.getElementById("projectContext").onchange = e => {
      state.overview.context = e.target.value; saveState();
    };
  }

  function renderArea(){
    const index = route.index;
    const key = state.selected[index];
    const cfg = PROJECTS[key];
    const data = state.areaData[key];

    setFooter({
      back:() => index === 0 ? go("overview") : go("area", index-1),
      next:() => index === state.selected.length-1 ? go("design") : go("area", index+1),
      nextLabel:index === state.selected.length-1 ? "Weiter" : "Nächster Bereich"
    });

    screen.innerHTML = `
      <div class="area-meta">
        <span>${escapeHtml(cfg.name)}</span>
        <span>${index+1} von ${state.selected.length} Bereichen</span>
      </div>

      <p class="eyebrow">PROJEKTDETAILS</p>
      <h1>${escapeHtml(cfg.question)}</h1>

      <div class="choice-grid">
        ${cfg.choices.map(choice => `
          <button class="choice ${data.choices.includes(choice) ? "selected" : ""}" type="button" data-choice="${escapeHtml(choice)}">
            ${escapeHtml(choice)}
            <span class="choice-mark">✓</span>
          </button>
        `).join("")}
      </div>

      <div class="field-grid">
        ${cfg.fields.map(field => {
          const value = data.fields[field.id] || "";
          if(field.type === "select"){
            return `
              <div class="field">
                <label>${escapeHtml(field.label)}</label>
                <select data-field="${field.id}">
                  ${field.options.map(opt => `<option value="${escapeHtml(opt)}" ${value === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("")}
                </select>
              </div>
            `;
          }

          return `
            <div class="field">
              <label>${escapeHtml(field.label)}</label>
              <input type="${field.type}" data-field="${field.id}" value="${escapeHtml(value)}">
            </div>
          `;
        }).join("")}
      </div>

      <p class="helper">Noch nicht sicher? Kein Problem. Sie können trotzdem weiterfahren.</p>
    `;

    screen.querySelectorAll("[data-choice]").forEach(button => {
      button.onclick = () => {
        data.choices = toggleInArray(data.choices, button.dataset.choice);
        saveState();
        renderArea();
      };
    });

    screen.querySelectorAll("[data-field]").forEach(input => {
      const handler = e => {
        data.fields[e.target.dataset.field] = e.target.value;
        saveState();
      };
      input.oninput = handler;
      input.onchange = handler;
    });
  }

  function renderDesign(){
    setFooter({
      back:() => go("area", state.selected.length-1),
      next:() => go("uploads")
    });

    const options = [
      ["Ja","Ja, komplett vorhanden","Produktionsdaten sind vorhanden."],
      ["Teilweise","Teilweise","Logo / Corporate Design vorhanden."],
      ["Nein","Nein","Gestaltungsunterstützung gewünscht."]
    ];

    screen.innerHTML = `
      <p class="eyebrow">GESTALTUNG & DATEN</p>
      <h1>Ist die Gestaltung bereits vorhanden?</h1>

      <div class="design-list">
        ${options.map(([key,title,sub]) => `
          <button class="design-choice ${state.design === key ? "selected" : ""}" type="button" data-design="${key}">
            <strong>${title}</strong>
            <small>${sub}</small>
          </button>
        `).join("")}
      </div>
    `;

    screen.querySelectorAll("[data-design]").forEach(button => {
      button.onclick = () => {
        state.design = button.dataset.design;
        saveState();
        renderDesign();
      };
    });
  }

  function renderUploads(){
    if(!state.uploadArea || !state.selected.includes(state.uploadArea)){
      state.uploadArea = state.selected[0] || "";
    }

    const key = state.uploadArea;
    const cfg = PROJECTS[key];
    const requirements = areaUploadRequirements(key);

    setFooter({
      back:() => go("design"),
      next:() => go("check")
    });

    screen.innerHTML = `
      <p class="eyebrow">FOTOS & DATEIEN</p>
      <h1>Zeigen Sie uns Ihr Projekt.</h1>

      <div class="area-tabs">
        ${state.selected.map(areaKey => `
          <button class="area-tab ${areaKey === key ? "active" : ""}" type="button" data-upload-area="${areaKey}">
            ${escapeHtml(PROJECTS[areaKey].name)}
          </button>
        `).join("")}
      </div>

      <p class="helper">${key === "fahrzeug"
        ? "Für Fahrzeuge helfen vier klare Ansichten."
        : "Die Dateien werden dem ausgewählten Projektbereich zugeordnet."}</p>

      <div class="upload-box">
        <div class="upload-title">${escapeHtml(cfg.name)} · Dateien</div>
        ${requirements.map(label => {
          const meta = fileMeta(key, label);
          return `
            <div class="upload-row">
              <div class="upload-name">
                <div>${escapeHtml(label)}</div>
                ${meta ? `<div class="upload-file-name">${escapeHtml(meta.name)} · ${prettyBytes(meta.size)}</div>` : ""}
              </div>
              <label class="upload-action" title="Datei auswählen">
                ${meta ? "✓" : "+"}
                <input type="file" data-upload-slot="${escapeHtml(label)}" accept="image/*,.pdf,.svg,.ai,.eps">
              </label>
            </div>
          `;
        }).join("")}
      </div>

      <label class="drop-zone">
        <strong>Weitere Fotos oder Dateien hinzufügen</strong>
        <small>JPG · PNG · PDF · SVG · AI · EPS</small>
        <input id="extraFiles" type="file" multiple accept="image/*,.pdf,.svg,.ai,.eps">
      </label>

      <div id="previewStrip" class="preview-strip"></div>
    `;

    screen.querySelectorAll("[data-upload-area]").forEach(button => {
      button.onclick = () => {
        state.uploadArea = button.dataset.uploadArea;
        saveState();
        renderUploads();
      };
    });

    screen.querySelectorAll("[data-upload-slot]").forEach(input => {
      input.onchange = async e => {
        const file = e.target.files?.[0];
        if(!file) return;
        const label = e.target.dataset.uploadSlot;
        setFileMeta(key, label, file);
        await saveFile(slotId(key,label), file);
        renderUploads();
      };
    });

    document.getElementById("extraFiles").onchange = async e => {
      const files = [...(e.target.files || [])];
      if(!state.extraUploads[key]) state.extraUploads[key] = [];
      for(const file of files){
        const id = `${key}::extra::${crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random()}`;
        state.extraUploads[key].push({id,name:file.name,type:file.type,size:file.size});
        await saveFile(id,file);
      }
      saveState();
      renderUploads();
    };

    renderPreviews(key);
  }

  async function renderPreviews(key){
    const strip = document.getElementById("previewStrip");
    if(!strip) return;

    const cards = [];
    const requirements = areaUploadRequirements(key);

    for(const label of requirements){
      const meta = fileMeta(key,label);
      if(!meta) continue;
      const file = await getFile(slotId(key,label));
      cards.push(await previewCard(meta,file));
    }

    for(const meta of (state.extraUploads[key] || [])){
      const file = await getFile(meta.id);
      cards.push(await previewCard(meta,file));
    }

    strip.innerHTML = cards.join("");
  }

  async function previewCard(meta,file){
    if(file && file.type?.startsWith("image/")){
      const url = URL.createObjectURL(file);
      return `<div class="preview-card" title="${escapeHtml(meta.name)}"><img src="${url}" alt=""></div>`;
    }
    return `<div class="preview-card" title="${escapeHtml(meta.name)}">${escapeHtml(meta.name.split(".").pop()?.toUpperCase() || "FILE")}</div>`;
  }

  function completenessFor(key){
    const choicesOk = state.areaData[key].choices.length > 0;
    const requirements = areaUploadRequirements(key);
    const uploaded = requirements.filter(label => fileMeta(key,label)).length;
    return {
      choicesOk,
      uploaded,
      required:requirements.length,
      complete:choicesOk && uploaded === requirements.length
    };
  }

  function renderCheck(){
    setFooter({
      back:() => go("uploads"),
      next:() => go("planning")
    });

    const checks = state.selected.map(key => ({
      key,
      ...completenessFor(key)
    }));

    const allComplete = checks.every(item => item.complete) && Boolean(state.design);

    screen.innerHTML = `
      <p class="eyebrow">VOLLSTÄNDIGKEIT</p>
      <h1>Fast geschafft.</h1>

      <div class="check-list">
        ${checks.map(item => `
          <div class="check-row">
            <span class="check-icon">${item.complete ? "✓" : "○"}</span>
            <span>${escapeHtml(PROJECTS[item.key].name)} · ${item.uploaded} / ${item.required} Dateien</span>
          </div>
        `).join("")}
        <div class="check-row">
          <span class="check-icon">${state.design ? "✓" : "○"}</span>
          <span>Gestaltungsstatus</span>
        </div>
      </div>

      ${allComplete
        ? `<div class="ready"><strong>✓ Alle wichtigen Angaben vorhanden</strong><p>Die Anfrage kann fortgesetzt werden.</p></div>`
        : `<div class="alert"><strong>Einige Angaben sind noch unvollständig.</strong><p>Sie können fehlende Informationen ergänzen oder die Anfrage trotzdem fortsetzen.</p></div>`
      }
    `;
  }

  function renderPlanning(){
    setFooter({
      back:() => go("check"),
      next:() => go("summary")
    });

    const p = state.planning;

    screen.innerHTML = `
      <p class="eyebrow">TERMIN & BUDGET</p>
      <h1>Wann soll das Projekt umgesetzt werden?</h1>

      <div class="field-grid">
        <div class="field">
          <label>Wunschdatum</label>
          <input id="dateField" type="date" value="${escapeHtml(p.date)}">
        </div>
      </div>

      <div class="segment">
        ${["Fix","Flexibel","Noch offen"].map(value => `
          <button class="${p.timing === value ? "selected" : ""}" type="button" data-timing="${value}">${value}</button>
        `).join("")}
      </div>

      <div class="field-grid" style="margin-top:14px">
        <div class="field">
          <label>Budgetrahmen · optional</label>
          <select id="budgetField">
            <option value=""></option>
            ${["unter CHF 1'000","CHF 1'000–2'500","CHF 2'500–5'000","CHF 5'000–10'000","über CHF 10'000"].map(value =>
              `<option ${p.budget === value ? "selected" : ""}>${value}</option>`
            ).join("")}
          </select>
        </div>

        <div class="field">
          <label>Bemerkungen · optional</label>
          <textarea id="remarksField">${escapeHtml(p.remarks)}</textarea>
        </div>
      </div>
    `;

    document.getElementById("dateField").onchange = e => {
      p.date = e.target.value; saveState();
    };
    document.getElementById("budgetField").onchange = e => {
      p.budget = e.target.value; saveState();
    };
    document.getElementById("remarksField").oninput = e => {
      p.remarks = e.target.value; saveState();
    };

    screen.querySelectorAll("[data-timing]").forEach(button => {
      button.onclick = () => {
        p.timing = button.dataset.timing;
        saveState();
        renderPlanning();
      };
    });
  }

  function formatPlanning(){
    const p = state.planning;
    return [p.date, p.timing].filter(Boolean).join(" · ") || "—";
  }

  function areaSummary(key){
    const data = state.areaData[key];
    const choiceText = data.choices.length ? data.choices.join(", ") : "—";
    const fieldText = PROJECTS[key].fields
      .map(field => data.fields[field.id] ? `${field.label}: ${data.fields[field.id]}` : "")
      .filter(Boolean)
      .join(" · ");

    return fieldText ? `${choiceText} · ${fieldText}` : choiceText;
  }

  function renderSummary(){
    setFooter({
      back:() => go("planning"),
      next:sendTest,
      nextLabel:"Anfrage senden"
    });

    const projectMeta = [
      state.overview.projectName,
      state.overview.location,
      state.overview.context
    ].filter(Boolean).join(" · ") || "—";

    screen.innerHTML = `
      <p class="eyebrow">ZUSAMMENFASSUNG</p>
      <h1>Ihr Projekt auf einen Blick.</h1>

      <div class="summary">
        <div class="summary-row">
          <div class="summary-label">Projekt</div>
          <div class="summary-value ${projectMeta === "—" ? "muted" : ""}">${escapeHtml(projectMeta)}</div>
        </div>

        ${state.selected.map(key => `
          <div class="summary-row">
            <div class="summary-label">${escapeHtml(PROJECTS[key].name)}</div>
            <div class="summary-value">${escapeHtml(areaSummary(key))}</div>
          </div>
        `).join("")}

        <div class="summary-row">
          <div class="summary-label">Gestaltung</div>
          <div class="summary-value ${state.design ? "" : "muted"}">${escapeHtml(state.design || "—")}</div>
        </div>

        <div class="summary-row">
          <div class="summary-label">Termin</div>
          <div class="summary-value ${formatPlanning() === "—" ? "muted" : ""}">${escapeHtml(formatPlanning())}</div>
        </div>

        ${state.planning.remarks.trim() ? `
          <div class="summary-row">
            <div class="summary-label">Bemerkungen</div>
            <div class="summary-value">${escapeHtml(state.planning.remarks)}</div>
          </div>
        ` : ""}
      </div>

      <div class="contact-grid">
        <input id="contactName" placeholder="Vorname und Nachname" value="${escapeHtml(state.contact.name)}">
        <input id="contactEmail" type="email" placeholder="E-Mail" value="${escapeHtml(state.contact.email)}">
      </div>

      <div id="validation" class="validation"></div>
    `;

    document.getElementById("contactName").oninput = e => {
      state.contact.name = e.target.value; saveState();
    };
    document.getElementById("contactEmail").oninput = e => {
      state.contact.email = e.target.value; saveState();
    };
  }

  function sendTest(){
    const validation = document.getElementById("validation");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email.trim());
    const nameOk = state.contact.name.trim().length >= 2;

    if(!nameOk || !emailOk){
      validation.textContent = !nameOk && !emailOk
        ? "Bitte Name und gültige E-Mail-Adresse eingeben."
        : !nameOk
          ? "Bitte Vorname und Nachname eingeben."
          : "Bitte eine gültige E-Mail-Adresse eingeben.";
      return;
    }

    validation.textContent = "";
    sentDialog.showModal();
  }

  function exportJson(){
    const payload = {
      createdAt:new Date().toISOString(),
      project:{
        ...state.overview,
        selectedAreas:selectedNames()
      },
      areas:Object.fromEntries(state.selected.map(key => [
        PROJECTS[key].name,
        {
          choices:state.areaData[key].choices,
          fields:state.areaData[key].fields,
          files:[
            ...Object.entries(state.uploads[key] || {}).map(([slot,meta]) => ({slot,...meta})),
            ...(state.extraUploads[key] || []).map(meta => ({slot:"Weitere Datei",...meta}))
          ]
        }
      ])),
      design:state.design,
      planning:state.planning,
      contact:state.contact
    };

    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projektanfrage-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function resetAll(){
    state = freshState();
    localStorage.removeItem(STORAGE_KEY);
    await clearFiles();
    resetDialog.close();
    go("start");
  }

  closeBtn.onclick = () => resetDialog.showModal();

  document.getElementById("continueBtn").onclick = () => resetDialog.close();
  document.getElementById("homeBtn").onclick = () => {
    resetDialog.close();
    go("start");
  };
  document.getElementById("resetBtn").onclick = resetAll;

  document.getElementById("exportBtn").onclick = exportJson;
  document.getElementById("sentCloseBtn").onclick = () => sentDialog.close();

  window.addEventListener("hashchange", () => {
    route = parseRoute();
    render();
  });

  if(!location.hash){
    history.replaceState(null,"","#start");
  }

  route = parseRoute();
  render();
})();
