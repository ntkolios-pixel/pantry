/* @ds-bundle: {"format":3,"namespace":"SulamDesignSystem_e92dff","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Stat","sourcePath":"components/display/Stat.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"LadderProgress","sourcePath":"components/progress/LadderProgress.jsx"}],"sourceHashes":{"assets/image-slot.js":"9309434cb09c","components/buttons/Button.jsx":"fac69e439bd0","components/buttons/IconButton.jsx":"4f4adaf4a7d7","components/display/Avatar.jsx":"62ae509166d3","components/display/Badge.jsx":"bb2a4e798306","components/display/Card.jsx":"e435c5d1e62a","components/display/Stat.jsx":"e4bb1a1c55f2","components/forms/Checkbox.jsx":"49bd902fa39a","components/forms/Input.jsx":"daccaca415aa","components/forms/Switch.jsx":"258e237c3c92","components/progress/LadderProgress.jsx":"65306088860c","ui_kits/marketing/site-booking.jsx":"c1d330ac1704","ui_kits/marketing/site-core.jsx":"94fa19563838","ui_kits/marketing/site-sections.jsx":"95a09f84d824","ui_kits/marketing/site-sections2.jsx":"ec655e5c2b0a","ui_kits/pages/pages-about.jsx":"5e9356e6aed7","ui_kits/pages/pages-booking.jsx":"c1d330ac1704","ui_kits/pages/pages-contact.jsx":"d0c157c640cf","ui_kits/pages/pages-core.jsx":"04c4e3d63d23","ui_kits/pages/pages-services.jsx":"af1ed99482a1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SulamDesignSystem_e92dff = window.SulamDesignSystem_e92dff || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/image-slot.js", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Button — the primary action primitive.
 * Variants: primary (sage), light (linen fill for dark surfaces), secondary (outline), ghost, link.
 * Sizes: sm, md, lg. Supports leading/trailing icons, loading, full width.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leadingIcon = null,
  trailingIcon = null,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      fontSize: 13,
      padding: '0 14px',
      height: 36,
      gap: 7,
      radius: 'var(--radius-sm)'
    },
    md: {
      fontSize: 15,
      padding: '0 20px',
      height: 44,
      gap: 8,
      radius: 'var(--radius-md)'
    },
    lg: {
      fontSize: 16,
      padding: '0 28px',
      height: 54,
      gap: 10,
      radius: 'var(--radius-md)'
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--action-primary)',
      color: 'var(--action-primary-text)',
      border: '1px solid transparent'
    },
    light: {
      background: 'var(--action-light)',
      color: 'var(--action-light-text)',
      border: '1px solid transparent'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid transparent'
    },
    link: {
      background: 'transparent',
      color: 'var(--text-link)',
      border: '1px solid transparent',
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      textDecorationThickness: 1,
      height: 'auto',
      padding: 0
    }
  };
  const v = variants[variant] || variants.primary;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const hoverBg = {
    primary: 'var(--action-primary-hover)',
    light: 'var(--action-light-hover)',
    secondary: 'var(--surface-light)',
    ghost: 'var(--surface-light)',
    link: 'transparent'
  };
  const pressBg = {
    primary: 'var(--action-primary-press)',
    light: 'var(--action-light-hover)',
    secondary: 'var(--stone-200)',
    ghost: 'var(--stone-200)',
    link: 'transparent'
  };
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    onClick: onClick,
    disabled: isDisabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: s.fontSize,
      letterSpacing: '0.01em',
      lineHeight: 1,
      height: v.height || s.height,
      padding: v.padding !== undefined ? v.padding : s.padding,
      gap: s.gap,
      borderRadius: v.radius || s.radius,
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.45 : 1,
      transition: 'background var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
      transform: press && !isDisabled ? 'translateY(0.5px) scale(0.99)' : 'none',
      ...v,
      background: isDisabled ? v.background : press ? pressBg[variant] : hover ? hoverBg[variant] : v.background,
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && leadingIcon, children, !loading && trailingIcon);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'sl-spin 0.7s linear infinite'
    }
  });
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam IconButton — a square, icon-only button for toolbars and compact UI.
 * Mirrors Button's variants. Pass an icon node as children. Always provide aria-label.
 */
function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  style,
  ...rest
}) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const dim = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--action-primary)',
      color: 'var(--action-primary-text)',
      border: '1px solid transparent'
    },
    light: {
      background: 'var(--action-light)',
      color: 'var(--action-light-text)',
      border: '1px solid transparent'
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    }
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = React.useState(false);
  const hoverBg = {
    primary: 'var(--action-primary-hover)',
    light: 'var(--action-light-hover)',
    secondary: 'var(--surface-light)',
    ghost: 'var(--surface-light)'
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dim,
      height: dim,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--duration-fast) var(--ease-standard)',
      ...v,
      background: disabled ? v.background : hover ? hoverBg[variant] : v.background,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Avatar — round member image with initials fallback.
 * size: sm 32, md 40, lg 56, xl 80.
 */
function Avatar({
  src,
  name = '',
  size = 'md',
  style,
  ...rest
}) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  };
  const dim = sizes[size] || sizes.md;
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: dim,
      height: dim,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'var(--clay-100)',
      color: 'var(--clay-700)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: dim * 0.38,
      border: '1px solid var(--clay-200)',
      flex: 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Badge — small status pill. tone: neutral, positive, warning, danger, info, accent.
 * variant: 'soft' (default, tinted bg) or 'solid'.
 */
function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      soft: ['var(--stone-100)', 'var(--charcoal-700)'],
      solid: ['var(--charcoal-900)', 'var(--linen)'],
      dot: 'var(--stone-400)'
    },
    positive: {
      soft: ['var(--moss-100)', 'var(--moss-600)'],
      solid: ['var(--moss-600)', 'var(--linen)'],
      dot: 'var(--moss-600)'
    },
    warning: {
      soft: ['var(--ochre-100)', '#7a5c1f'],
      solid: ['var(--ochre-500)', 'var(--charcoal-900)'],
      dot: 'var(--ochre-500)'
    },
    danger: {
      soft: ['var(--brick-100)', 'var(--brick-600)'],
      solid: ['var(--brick-600)', 'var(--linen)'],
      dot: 'var(--brick-600)'
    },
    accent: {
      soft: ['var(--clay-100)', 'var(--clay-700)'],
      solid: ['var(--clay-500)', 'var(--linen)'],
      dot: 'var(--clay-500)'
    }
  };
  const t = tones[tone] || tones.neutral;
  const [bg, fg] = variant === 'solid' ? t.solid : t.soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: bg,
      color: fg,
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.02em',
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: variant === 'solid' ? 'currentColor' : t.dot
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Card — the surface primitive. Cream by default.
 * variant: 'elevated' (shadow), 'outlined' (border), 'ink' (charcoal), 'soft' (sage tint).
 */
function Card({
  children,
  variant = 'outlined',
  padding = 24,
  style,
  onClick,
  ...rest
}) {
  const variants = {
    elevated: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)'
    },
    outlined: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      boxShadow: 'none'
    },
    ink: {
      background: 'var(--surface-ink)',
      border: '1px solid var(--charcoal-800)',
      boxShadow: 'none',
      color: 'var(--text-on-dark)'
    },
    soft: {
      background: 'var(--clay-100)',
      border: '1px solid var(--clay-200)',
      boxShadow: 'none'
    },
    light: {
      background: 'var(--surface-light)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'none'
    }
  };
  const v = variants[variant] || variants.outlined;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      borderRadius: 'var(--radius-lg)',
      padding,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard)',
      ...v,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Stat — a labeled metric readout for session lengths, counts, etc.
 * The value is set in Cormorant Garamond (the editorial numeral treatment).
 * trend: 'up' | 'down' | 'flat' with tone coloring.
 */
function Stat({
  label,
  value,
  unit,
  caption,
  trend,
  trendTone = 'positive',
  style,
  ...rest
}) {
  const trendColors = {
    positive: 'var(--clay-600)',
    danger: 'var(--brick-600)',
    neutral: 'var(--text-muted)'
  };
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : '';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 44,
      lineHeight: 1,
      letterSpacing: '-0.01em',
      color: 'var(--text-primary)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, unit), trend && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      color: trendColors[trendTone]
    }
  }, arrow)), caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, caption));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Stat.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Checkbox — square check control with optional label.
 */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}) {
  const cbId = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: cbId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("button", _extends({
    id: cbId,
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 22,
      height: 22,
      borderRadius: 'var(--radius-xs)',
      background: checked ? 'var(--clay-500)' : 'var(--surface-card)',
      border: checked ? '1.5px solid var(--clay-500)' : '1.5px solid var(--border-strong)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'inherit',
      padding: 0,
      transition: 'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)'
    }
  }, rest), checked && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--linen)",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Input — labeled text field with optional hint, error, and icons.
 */
function Input({
  label,
  hint,
  error,
  leadingIcon = null,
  trailingIcon = null,
  type = 'text',
  id,
  disabled = false,
  style,
  ...rest
}) {
  const inputId = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--status-danger)' : focus ? 'var(--clay-500)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: disabled ? 'var(--stone-100)' : 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      padding: '0 14px',
      height: 48,
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      boxShadow: focus && !error ? '0 0 0 3px rgba(181,112,79,0.16)' : 'none',
      opacity: disabled ? 0.6 : 1
    }
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)',
      height: '100%',
      minWidth: 0
    }
  }, rest)), trailingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, trailingIcon)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: error ? 'var(--status-danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam Switch — a toggle for binary settings. Controlled via `checked`/`onChange`.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}) {
  const switchId = id || React.useId();
  const track = checked ? 'var(--clay-500)' : 'var(--stone-300)';
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("button", _extends({
    id: switchId,
    role: "switch",
    type: "button",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 44,
      height: 26,
      borderRadius: 'var(--radius-full)',
      background: track,
      border: 'none',
      padding: 3,
      cursor: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'background var(--duration-base) var(--ease-standard)'
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--linen)',
      boxShadow: 'var(--shadow-sm)',
      transform: checked ? 'translateX(18px)' : 'translateX(0)',
      transition: 'transform var(--duration-base) var(--ease-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/progress/LadderProgress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sulam LadderProgress — the signature brand component. "Sulam" means "ladder".
 * Renders the rungs a client climbs through the recovery process.
 * Completed rungs are sage-filled, the current rung is ringed, future rungs are muted.
 *
 * orientation: 'horizontal' (default) | 'vertical'
 * steps: [{ label, caption? }]
 * current: index of the active rung (0-based). Rungs before it are complete.
 */
function LadderProgress({
  steps = [],
  current = 0,
  orientation = 'horizontal',
  style,
  ...rest
}) {
  const isV = orientation === 'vertical';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: isV ? 'column' : 'row',
      alignItems: isV ? 'stretch' : 'flex-start',
      gap: 0,
      ...style
    }
  }, rest), steps.map((step, i) => {
    const done = i < current;
    const active = i === current;
    const last = i === steps.length - 1;
    const dotBg = done ? 'var(--clay-500)' : active ? 'var(--surface-card)' : 'var(--stone-100)';
    const dotBorder = done ? 'var(--clay-500)' : active ? 'var(--clay-500)' : 'var(--border-default)';
    const lineBg = done ? 'var(--clay-500)' : 'var(--border-default)';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: isV ? 'row' : 'column',
        alignItems: isV ? 'flex-start' : 'center',
        flex: last ? '0 0 auto' : 1,
        minWidth: isV ? 0 : 64,
        gap: isV ? 14 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        alignItems: 'center',
        width: isV ? 'auto' : '100%',
        alignSelf: isV ? 'stretch' : 'auto'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        flex: 'none',
        background: dotBg,
        border: `2px solid ${dotBorder}`,
        boxShadow: active ? '0 0 0 4px var(--clay-100)' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--linen)',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 600,
        transition: 'all var(--duration-base) var(--ease-standard)'
      }
    }, done ? /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "3.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("polyline", {
      points: "20 6 9 17 4 12"
    })) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: active ? 'var(--clay-600)' : 'var(--text-muted)'
      }
    }, i + 1)), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        background: lineBg,
        ...(isV ? {
          width: 2,
          flex: 1,
          minHeight: 28,
          margin: '2px 0'
        } : {
          height: 2,
          flex: 1,
          margin: '0 2px'
        }),
        transition: 'background var(--duration-base) var(--ease-standard)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: isV ? 0 : 10,
        paddingBottom: isV ? 22 : 0,
        textAlign: isV ? 'left' : 'center',
        maxWidth: isV ? 'none' : 120
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        color: active || done ? 'var(--text-primary)' : 'var(--text-muted)',
        lineHeight: 1.25
      }
    }, step.label), step.caption && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'var(--text-muted)',
        marginTop: 2,
        lineHeight: 1.3
      }
    }, step.caption)));
  }));
}
Object.assign(__ds_scope, { LadderProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/LadderProgress.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/site-booking.jsx
try { (() => {
/* Sulam — booking modal (fake multi-step). Uses the Five Rungs ladder. */

function BookingModal({
  open,
  onClose
}) {
  const [step, setStep] = React.useState(0);
  const [offer, setOffer] = React.useState(null);
  const [slot, setSlot] = React.useState(null);
  const [name, setName] = React.useState('');
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setStep(0);
      setOffer(null);
      setSlot(null);
      setName('');
      setDone(false);
    }
  }, [open]);
  if (!open) return null;
  const steps = [{
    label: 'Session'
  }, {
    label: 'Time'
  }, {
    label: 'Details'
  }];
  const offers = [{
    k: 'rung',
    t: 'The Rung',
    meta: '60 min · 300 ₪',
    icon: 'Footprints'
  }, {
    k: 'session',
    t: 'The Sulam Session',
    meta: '90 min · 300 ₪',
    icon: 'Sparkle'
  }, {
    k: 'cold',
    t: 'The Cold Rung',
    meta: '45 min · from 200 ₪',
    icon: 'Snowflake'
  }, {
    k: 'full',
    t: 'The Full Reset',
    meta: 'Cold + 90 min · 680 ₪',
    icon: 'Layers'
  }, {
    k: 'ladder',
    t: 'The Ladder',
    meta: '4 / month · programme',
    icon: 'TrendingUp'
  }];
  const slots = ['Sun 18:00', 'Mon 09:00', 'Tue 17:30', 'Wed 12:00', 'Thu 08:00', 'Thu 19:00'];
  const canNext = step === 0 ? offer : step === 1 ? slot : name.trim();
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(42,37,32,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 540,
      maxWidth: '100%',
      background: 'var(--cream)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 30px',
      borderBottom: '1px solid var(--stone-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 22,
      color: 'var(--charcoal-900)'
    }
  }, "Sulam"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12,
      color: 'var(--taupe-500)',
      borderLeft: '1px solid var(--stone-300)',
      paddingLeft: 10
    }
  }, "Book a session")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-md)',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "X",
    size: 18,
    color: "var(--taupe-500)"
  }))), !done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 30px 6px'
    }
  }, /*#__PURE__*/React.createElement(MiniLadder, {
    steps: steps,
    current: step
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 30px 8px',
      minHeight: 220
    }
  }, done ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--clay-100)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Check",
    size: 26,
    color: "var(--clay-600)",
    stroke: 2.5
  })), /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "You're booked."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      color: 'var(--taupe-500)',
      marginTop: 10
    }
  }, offers.find(o => o.k === offer)?.t, " \xB7 ", slot, ". We'll send a confirmation and a short breathing primer to get you ready."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      color: 'var(--clay-700)',
      marginTop: 12
    }
  }, "Miluim? Book via WhatsApp for the 250 \u20AA rate.")) : step === 0 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Choose your rung."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 18
    }
  }, offers.map(o => {
    const on = offer === o.k;
    return /*#__PURE__*/React.createElement("button", {
      key: o.k,
      onClick: () => setOffer(o.k),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        background: on ? 'var(--clay-100)' : 'var(--white)',
        border: on ? '1.5px solid var(--clay-500)' : '1px solid var(--stone-300)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 140ms ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: on ? 'var(--clay-500)' : 'var(--surface-light)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: o.icon,
      size: 19,
      color: on ? 'var(--linen)' : 'var(--taupe-500)'
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--charcoal-900)'
      }
    }, o.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 300,
        fontSize: 13,
        color: 'var(--taupe-500)'
      }
    }, o.meta)), on && /*#__PURE__*/React.createElement(Icon, {
      name: "Check",
      size: 18,
      color: "var(--clay-600)"
    }));
  }))) : step === 1 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Pick a time."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      marginTop: 18
    }
  }, slots.map(sl => {
    const on = slot === sl;
    return /*#__PURE__*/React.createElement("button", {
      key: sl,
      onClick: () => setSlot(sl),
      style: {
        padding: '14px 8px',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        color: on ? 'var(--linen)' : 'var(--charcoal-900)',
        background: on ? 'var(--clay-500)' : 'var(--white)',
        border: on ? '1.5px solid var(--clay-500)' : '1px solid var(--stone-300)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 140ms ease'
      }
    }, sl);
  }))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Almost there."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--taupe-500)',
      marginTop: 8
    }
  }, "First session? Choose The Rung \u2014 60 minutes, no commitment."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Your name",
    value: name,
    onChange: setName,
    placeholder: "First and last"
  })))), !done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 30px 26px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => step === 0 ? onClose() : setStep(step - 1),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--taupe-500)'
    }
  }, step === 0 ? 'Cancel' : 'Back'), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "md",
    onClick: () => canNext && (step < 2 ? setStep(step + 1) : setDone(true)),
    trailing: step < 2 ? 'ArrowRight' : 'Check',
    style: {
      opacity: canNext ? 1 : 0.4,
      pointerEvents: canNext ? 'auto' : 'none'
    }
  }, step < 2 ? 'Continue' : 'Confirm booking')), done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 30px 28px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    size: "md",
    onClick: onClose,
    style: {
      width: '100%'
    }
  }, "Done"))));
}
function Field({
  label,
  value,
  onChange,
  placeholder
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--charcoal-900)'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      height: 48,
      padding: '0 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--charcoal-900)',
      background: 'var(--white)',
      border: `1.5px solid ${f ? 'var(--clay-500)' : 'var(--stone-300)'}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: f ? '0 0 0 3px rgba(181,112,79,0.16)' : 'none',
      transition: 'all 140ms ease'
    }
  }));
}
function MiniLadder({
  steps,
  current
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start'
    }
  }, steps.map((s, i) => {
    const d = i < current,
      a = i === current,
      last = i === steps.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: last ? '0 0 auto' : 1,
        minWidth: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: d ? 'var(--clay-500)' : a ? 'var(--white)' : 'var(--surface-light)',
        border: `2px solid ${d || a ? 'var(--clay-500)' : 'var(--stone-300)'}`,
        boxShadow: a ? '0 0 0 4px var(--clay-100)' : 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 600,
        color: a ? 'var(--clay-600)' : 'var(--taupe-500)'
      }
    }, d ? /*#__PURE__*/React.createElement(Icon, {
      name: "Check",
      size: 12,
      color: "var(--linen)",
      stroke: 3
    }) : i + 1), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        height: 2,
        flex: 1,
        margin: '0 4px',
        background: d ? 'var(--clay-500)' : 'var(--stone-300)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: a ? 600 : 400,
        color: a || d ? 'var(--charcoal-900)' : 'var(--taupe-500)',
        marginTop: 8
      }
    }, s.label));
  }));
}
Object.assign(window, {
  BookingModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/site-booking.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/site-core.jsx
try { (() => {
/* Sulam marketing site — shell & primitives. Per Wix Brief v3.
   Uses the real token CSS (styles.css). Exports to window. */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ---------- Lucide icon helper ---------- */
function Icon({
  name,
  size = 18,
  color = 'currentColor',
  stroke = 1.75
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide && lucide[name]) {
      ref.current.innerHTML = '';
      const el = lucide.createElement(lucide[name]);
      el.setAttribute('width', size);
      el.setAttribute('height', size);
      el.setAttribute('stroke', color);
      el.setAttribute('stroke-width', stroke);
      ref.current.appendChild(el);
    }
  }, [name, size, color, stroke]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}

/* ---------- Button ---------- */
function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  leading,
  trailing,
  style
}) {
  const [h, setH] = useState(false);
  const sizes = {
    sm: {
      p: '0 18px',
      hgt: 40,
      fs: 14
    },
    md: {
      p: '0 24px',
      hgt: 50,
      fs: 15
    },
    lg: {
      p: '0 32px',
      hgt: 58,
      fs: 16
    }
  };
  const s = sizes[size];
  const variants = {
    /* primary = Sage bg, Linen text */
    primary: {
      background: h ? 'var(--clay-600)' : 'var(--clay-500)',
      color: 'var(--linen)',
      border: '1px solid transparent'
    },
    /* light = Linen bg, Charcoal text (nav Book Now) */
    light: {
      background: h ? 'var(--white)' : 'var(--linen)',
      color: 'var(--charcoal-900)',
      border: '1px solid transparent'
    },
    /* ghost on dark = transparent, Linen border 25% */
    ghostDark: {
      background: h ? 'rgba(245,240,232,0.08)' : 'transparent',
      color: 'var(--linen)',
      border: '1px solid rgba(245,240,232,0.25)'
    },
    /* ghost on light = Charcoal border */
    ghostLight: {
      background: h ? 'var(--surface-light)' : 'transparent',
      color: 'var(--charcoal-900)',
      border: '1px solid var(--charcoal-900)'
    },
    secondary: {
      background: h ? 'var(--surface-light)' : 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      height: s.hgt,
      padding: s.p,
      fontFamily: 'var(--font-sans)',
      fontSize: s.fs,
      fontWeight: 500,
      letterSpacing: '0.01em',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 200ms ease',
      ...variants[variant],
      ...style
    }
  }, leading && /*#__PURE__*/React.createElement(Icon, {
    name: leading,
    size: 18,
    color: "currentColor"
  }), children, trailing && /*#__PURE__*/React.createElement(Icon, {
    name: trailing,
    size: 18,
    color: "currentColor"
  }));
}

/* ---------- Type helpers ---------- */
function Eyebrow({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--clay-500)',
      ...style
    }
  }, children);
}
function Display({
  children,
  size = 'lg',
  color = 'var(--charcoal-900)',
  style
}) {
  const sizes = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 58,
    '2xl': 76
  };
  return /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: sizes[size],
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color,
      margin: 0,
      textWrap: 'balance',
      ...style
    }
  }, children);
}
function Hebrew({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hebrew)',
      direction: 'rtl',
      ...style
    }
  }, children);
}

/* ---------- Cropped ladder watermark (off-centre, never centred on dark) ---------- */
function Watermark({
  pos = 'br',
  opacity = 0.07,
  size = 360
}) {
  const map = {
    br: {
      right: -size * 0.30,
      bottom: -size * 0.34,
      transform: 'rotate(0deg)'
    },
    tl: {
      left: -size * 0.44,
      top: -size * 0.42
    }
  };
  return /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      width: size,
      height: 'auto',
      objectFit: 'contain',
      opacity,
      pointerEvents: 'none',
      ...map[pos]
    }
  });
}

/* ---------- Navigation ---------- */
function Nav({
  onBook
}) {
  const links = [['About', 'about'], ['Services', 'services'], ['Contact', 'contact']];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      background: 'var(--charcoal-900)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--charcoal-800)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: '0 40px',
      height: 74,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "index.html",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    style: {
      height: 28
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-wordmark-linen.png",
    alt: "Sulam",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 13,
      color: 'var(--stone-300)',
      borderLeft: '1px solid var(--charcoal-700)',
      paddingLeft: 12
    }
  }, "Massage Therapy")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 30,
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }, links.map(([l, k]) => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: '../pages/index.html?p=' + k,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      color: 'var(--stone-300)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, l))), /*#__PURE__*/React.createElement(Btn, {
    variant: "light",
    size: "sm",
    onClick: onBook,
    trailing: "ArrowRight"
  }, "Book Now")));
}
Object.assign(window, {
  Icon,
  Btn,
  Eyebrow,
  Display,
  Hebrew,
  Watermark,
  Nav
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/site-core.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/site-sections.jsx
try { (() => {
/* Sulam Home — sections per Wix Brief v3. Depends on site-core.jsx. */

/* ---------- Section 1 — Hero (Charcoal, typography only) ---------- */
function Hero({
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--charcoal-900)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Watermark, {
    pos: "br",
    opacity: 0.07,
    size: 420
  }), /*#__PURE__*/React.createElement(Watermark, {
    pos: "tl",
    opacity: 0.04,
    size: 300
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 820,
      margin: '0 auto',
      padding: '128px 40px 132px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 28
    }
  }, "Massage \xB7 Breathwork \xB7 Cold Exposure"), /*#__PURE__*/React.createElement(Display, {
    size: "xl",
    color: "var(--linen)"
  }, "Your body knows how to let go."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-hebrew)',
      direction: 'rtl',
      fontSize: 26,
      fontWeight: 400,
      color: 'rgba(200,191,176,0.35)',
      margin: '14px 0 0',
      fontStyle: 'italic'
    }
  }, "\u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05D9\u05D5\u05D3\u05E2 \u05D0\u05D9\u05DA \u05DC\u05E9\u05D7\u05E8\u05E8."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 19,
      lineHeight: 1.65,
      color: 'var(--stone-300)',
      maxWidth: 580,
      margin: '28px auto 0'
    }
  }, "Sulam combines therapeutic massage, breathwork, and cold exposure \u2014 so tension releases at the root, not just the surface. For men, soldiers, and those who are done pushing through."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      justifyContent: 'center',
      marginTop: 38
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "lg",
    onClick: onBook
  }, "Book a Session"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghostDark",
    size: "lg",
    trailing: "ArrowDown"
  }, "How It Works"))));
}

/* ---------- Section 2 — Five Rungs strip (Linen) ---------- */
function FiveRungs() {
  const rungs = [{
    n: 1,
    t: 'Arrive',
    d: 'Brief intake. No pressure. Just what helps the work.'
  }, {
    n: 2,
    t: 'Breathwork',
    d: '5–10 min. Nervous system shifts from alert to receptive.'
  }, {
    n: 3,
    t: 'Treatment',
    d: 'Targeted, hands-on work — massage or cold exposure or both.'
  }, {
    n: 4,
    t: 'Ground',
    d: 'Short close. The release stays beyond the room.'
  }, {
    n: 5,
    t: 'Next rung',
    d: 'What to do at home. When to return.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-light)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: '0 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)'
    }
  }, rungs.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.n,
    style: {
      padding: '44px 24px',
      borderLeft: i ? '1px solid var(--stone-300)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 32,
      color: 'var(--clay-500)',
      lineHeight: 1
    }
  }, r.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--charcoal-900)',
      margin: '14px 0 8px'
    }
  }, r.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      lineHeight: 1.5,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, r.d)))));
}

/* ---------- Section 3 — Why Breathwork (Cream, light section) ---------- */
function WhyBreathwork() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--cream)',
      borderTop: '1px solid var(--stone-300)',
      borderBottom: '1px solid var(--stone-300)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '96px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: 'var(--clay-600)'
    }
  }, "The Sulam difference"), /*#__PURE__*/React.createElement(Display, {
    size: "md",
    style: {
      marginTop: 18
    }
  }, "Most massage works on the muscle. ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic'
    }
  }, "Sulam works on the system behind it.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 460
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "When your nervous system is in stress mode \u2014 and most people's is, most of the time \u2014 even skilled massage can only do so much. The body stays braced. The tension returns by morning."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "Breathwork changes that. A few minutes of guided breathing shifts your physiology from fight-or-flight to rest-and-release. Then the hands-on work lands somewhere it couldn't before."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 16,
      color: 'var(--charcoal-900)',
      margin: 0
    }
  }, "It's not spiritual. It's science."))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 32,
      borderLeft: '2px solid var(--clay-500)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 30,
      lineHeight: 1.3,
      color: 'var(--charcoal-900)',
      margin: 0
    }
  }, "\"The breathwork is why the results hold \u2014 not just for an hour, but for days.\""), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      color: 'var(--taupe-500)',
      marginTop: 18
    }
  }, "\u2014 The Sulam method"))));
}
Object.assign(window, {
  Hero,
  FiveRungs,
  WhyBreathwork
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/site-sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/site-sections2.jsx
try { (() => {
/* Sulam Home — Who We Work With, Offers (+ cold), Combined Packages, Final CTA, Footer. */

/* ---------- Section 4 — Who We Work With (Linen) ---------- */
function WhoWeWorkWith() {
  const cards = [{
    n: '01',
    t: 'Men',
    bg: 'var(--surface-light)',
    body: "You've been carrying it for years. The back pain, the burnout, the tension you've adapted around. Sulam is maintenance — not a luxury.",
    hook: 'You maintain everything else. When did you last maintain yourself?'
  }, {
    n: '02',
    t: 'Soldiers & Miluim',
    bg: 'var(--cream)',
    body: 'Active duty or reserve — your body is still running on field mode. Private, purposeful, built around function. The 72-hour window after miluim is critical.',
    hook: 'You maintain your equipment. Sulam is maintenance for you.'
  }, {
    n: '03',
    t: 'Older Adults',
    bg: 'var(--surface-light)',
    body: "Chronic pain isn't just part of aging. Gentle, adapted sessions that produce real change in sleep, mobility, and daily comfort.",
    hook: "Chronic pain isn't something to manage. It's something to work with."
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-light)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      maxWidth: 640,
      margin: '0 auto 56px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      display: 'block'
    }
  }, "Who we work with"), /*#__PURE__*/React.createElement(Display, {
    size: "lg",
    style: {
      marginTop: 18
    }
  }, "Built for people who push hard and rarely recover.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      border: '1px solid var(--stone-300)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, cards.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.t,
    style: {
      background: c.bg,
      padding: '40px 32px',
      borderLeft: i ? '1px solid var(--stone-300)' : 'none',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.12em',
      color: 'var(--clay-600)'
    }
  }, c.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 28,
      color: 'var(--charcoal-900)',
      margin: '8px 0 16px'
    }
  }, c.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14.5,
      lineHeight: 1.65,
      color: 'var(--taupe-500)',
      margin: '0 0 20px'
    }
  }, c.body), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 17,
      lineHeight: 1.4,
      color: 'var(--clay-700)',
      margin: 'auto 0 0'
    }
  }, c.hook))))));
}

/* ---------- Section 5 — Offers (Charcoal) — four cards incl. cold ---------- */
function Offers({
  onBook
}) {
  const offers = [{
    t: 'The Rung',
    meta: '60 min · First-time clients',
    price: '300 ₪',
    body: 'The first step. A breathwork opening and 55 minutes of targeted massage. No commitment — just results.',
    includes: 'Includes: intake consultation on first visit.',
    miluim: 'Miluim rate: 250 ₪ — book via WhatsApp.',
    btn: 'Book The Rung',
    kind: 'plain'
  }, {
    t: 'The Sulam Session',
    meta: '90 min · Flagship',
    price: '300 ₪',
    body: 'Our complete experience. Breathwork, full therapeutic massage, and a grounding close. The session that changes how you feel for days.',
    includes: 'Includes: intake consultation · post-session self-care notes.',
    miluim: 'Miluim rate: 250 ₪ — book via WhatsApp.',
    btn: 'Book The Session',
    kind: 'featured'
  }, {
    t: 'The Ladder',
    meta: '4 / month · Programme',
    price: '[SET] ₪/mo',
    body: 'Monthly commitment. Four sessions, home breathwork audio, and a monthly check-in. For serious long-term recovery.',
    includes: 'Includes: home breathwork audio · priority booking · consistent therapist.',
    btn: 'Join The Ladder',
    kind: 'plain'
  }, {
    t: 'The Cold Rung',
    badge: 'New',
    meta: 'Cold exposure · 45 min',
    price: 'from 200 ₪',
    body: 'Three minutes of controlled cold with guided breathwork. Vessels constrict, then vasodilate — flushing the system and resetting the nervous system. Not a wellness experience. A recovery protocol.',
    includes: 'Solo 500 ₪ · Two 750 ₪ · Group 5+ 200 ₪/person',
    btn: 'Book The Cold Rung',
    kind: 'cold'
  }];
  const isFeatured = o => o.kind === 'featured';
  const isCold = o => o.kind === 'cold';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--charcoal-900)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: '96px 40px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      display: 'block',
      color: 'var(--clay-400)'
    }
  }, "Sessions & offers"), /*#__PURE__*/React.createElement(Display, {
    size: "lg",
    color: "var(--linen)",
    style: {
      marginTop: 18
    }
  }, "Choose your rung.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      border: '1px solid var(--charcoal-800)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, offers.map((o, i) => {
    const feat = isFeatured(o),
      cold = isCold(o);
    return /*#__PURE__*/React.createElement("div", {
      key: o.t,
      style: {
        background: cold ? 'var(--cold-900)' : feat ? 'var(--charcoal-800)' : 'transparent',
        padding: '36px 26px',
        borderLeft: i ? '1px solid var(--charcoal-800)' : 'none',
        borderTop: feat ? '2px solid var(--clay-500)' : cold ? '2px solid var(--ice-300)' : '2px solid transparent',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        minHeight: 24
      }
    }, feat && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--clay-400)',
        border: '1px solid var(--clay-500)',
        borderRadius: 'var(--radius-full)',
        padding: '3px 11px'
      }
    }, "Most popular"), cold && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--ice)',
        border: '1px solid var(--ice-300)',
        borderRadius: 'var(--radius-full)',
        padding: '3px 11px'
      }
    }, "\u2726 New")), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: 26,
        color: 'var(--linen)',
        margin: 0
      }
    }, o.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 300,
        fontSize: 12.5,
        color: 'var(--stone-300)',
        margin: '8px 0 16px'
      }
    }, o.meta), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: 26,
        color: cold ? 'var(--ice)' : 'var(--clay-400)',
        marginBottom: 16,
        whiteSpace: 'nowrap'
      }
    }, o.price), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 300,
        fontSize: 13.5,
        lineHeight: 1.6,
        color: 'var(--stone-300)',
        margin: '0 0 14px'
      }
    }, o.body), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 300,
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--stone-400)',
        margin: '0 0 6px'
      }
    }, o.includes), o.miluim && /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 400,
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--clay-400)',
        margin: '0 0 20px'
      }
    }, o.miluim), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        paddingTop: 14
      }
    }, /*#__PURE__*/React.createElement(Btn, {
      variant: feat ? 'primary' : 'ghostDark',
      size: "md",
      onClick: onBook,
      style: {
        width: '100%',
        ...(cold ? {
          borderColor: 'var(--ice-300)',
          color: 'var(--ice)'
        } : {})
      }
    }, o.btn)));
  })), /*#__PURE__*/React.createElement(CombinedPackages, {
    onBook: onBook
  })));
}

/* ---------- Section 5b — Combined Packages (continues charcoal) ---------- */
function CombinedPackages({
  onBook
}) {
  const packs = [{
    t: 'The Full Reset',
    meta: 'Cold Rung + 90-min Sulam Session',
    price: '680 ₪',
    save: 'save 120 ₪',
    body: 'Our complete experience. Cold exposure with guided breathwork, then the full Sulam Session. The fastest route to a body that has genuinely recovered.',
    btn: 'Book The Full Reset'
  }, {
    t: 'The Reset Rung',
    meta: 'Cold Rung + 60-min massage',
    price: '600 ₪',
    save: 'save 200 ₪',
    body: 'The first-timer combination. Cold exposure, then targeted massage. An hour and a half that changes what recovery means to you.',
    btn: 'Book The Reset Rung'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 72,
      paddingTop: 64,
      paddingBottom: 96,
      borderTop: '1px solid var(--charcoal-800)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      maxWidth: 640,
      margin: '0 auto 44px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      display: 'block',
      color: 'var(--ice)'
    }
  }, "Combine your session"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 30,
      lineHeight: 1.2,
      color: 'var(--linen)',
      margin: '16px 0 14px'
    }
  }, "Cold exposure before massage changes what the massage can do."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.65,
      color: 'var(--stone-300)',
      margin: 0
    }
  }, "Cold constricts the body. The vasodilation that follows \u2014 combined with breathwork during the cold \u2014 primes your nervous system and musculature for deeper, longer-lasting release.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 20
    }
  }, packs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.t,
    style: {
      background: 'var(--charcoal-800)',
      border: '1px solid var(--charcoal-700)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 34px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 26,
      color: 'var(--linen)',
      margin: 0
    }
  }, p.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      color: 'var(--stone-300)',
      margin: '6px 0 14px'
    }
  }, p.meta), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 28,
      lineHeight: 1.1,
      color: 'var(--clay-400)',
      whiteSpace: 'nowrap'
    }
  }, p.price), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12.5,
      color: 'var(--ice)',
      marginTop: 2
    }
  }, p.save)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      lineHeight: 1.65,
      color: 'var(--stone-300)',
      margin: '0 0 22px'
    }
  }, p.body), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghostDark",
    size: "md",
    onClick: onBook,
    style: {
      width: '100%'
    }
  }, p.btn))))));
}

/* ---------- Section 6 — Final CTA (Linen) ---------- */
function FinalCTA({
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-light)',
      borderTop: '1px solid var(--stone-300)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: '0 auto',
      padding: '100px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Display, {
    size: "lg",
    style: {
      fontStyle: 'italic'
    }
  }, "Every ladder starts with a single rung."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-hebrew)',
      direction: 'rtl',
      fontStyle: 'italic',
      fontSize: 22,
      color: 'var(--stone-500)',
      margin: '12px 0 0'
    }
  }, "\u05DB\u05DC \u05E1\u05D5\u05DC\u05DD \u05DE\u05EA\u05D7\u05D9\u05DC \u05D1\u05E9\u05DC\u05D1 \u05D0\u05D7\u05D3."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.65,
      color: 'var(--taupe-500)',
      maxWidth: 480,
      margin: '22px auto 0'
    }
  }, "Book your first session \u2014 and find out what your body feels like when it finally lets go."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      justifyContent: 'center',
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "lg",
    onClick: onBook
  }, "Book Now"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghostLight",
    size: "lg",
    leading: "MessageCircle"
  }, "WhatsApp Us"))));
}

/* ---------- Footer (Charcoal) ---------- */
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--charcoal-900)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      height: 96,
      opacity: 0.05,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1240,
      margin: '0 auto',
      padding: '56px 40px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr 1fr',
      gap: 40,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-wordmark-linen.png",
    alt: "Sulam",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-hebrew)',
      direction: 'rtl',
      fontSize: 15,
      color: 'var(--stone-400)',
      marginTop: 12
    }
  }, "\u05E1\u05D5\u05DC\u05DD \xB7 \u05E2\u05D9\u05E1\u05D5\u05D9 \xB7 \u05E0\u05E9\u05D9\u05DE\u05D4 \xB7 \u05D7\u05E9\u05D9\u05E4\u05D4 \u05DC\u05E7\u05D5\u05E8")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, [['Home', 'index.html'], ['About', '../pages/index.html?p=about'], ['Services', '../pages/index.html?p=services'], ['Contact', '../pages/index.html?p=contact']].map(([l, href]) => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: href,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--stone-300)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, ['Instagram', 'Facebook', 'MessageCircle'].map(ic => /*#__PURE__*/React.createElement("span", {
    key: ic,
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1px solid var(--charcoal-700)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 17,
    color: "var(--stone-300)"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderTop: '1px solid var(--charcoal-800)',
      padding: '20px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      color: 'var(--stone-400)'
    }
  }, "\xA9 2025 Sulam. All rights reserved.")));
}
Object.assign(window, {
  WhoWeWorkWith,
  Offers,
  CombinedPackages,
  FinalCTA,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/site-sections2.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pages/pages-about.jsx
try { (() => {
/* Sulam — About page. Depends on pages-core.jsx. */

function AboutPage({
  onBook
}) {
  const story = ["We kept seeing the same thing: people in real pain, doing everything right — stretching, sleeping, seeing specialists — and still not getting better. Not because the treatments weren't good. But because their nervous system was still in survival mode. And a body in survival mode cannot fully release.", "Breathwork changes that. Before every session, we guide you through a short breathing practice that signals your nervous system it's safe to let go. Then the massage work lands differently — deeper, longer-lasting, more real.", "And now: cold exposure. Three minutes of deliberate, guided cold that forces a vascular response and resets the nervous system in a way massage alone cannot."];
  const bio = ["I served 350+ days in reserve duty post-October 7 — Northern Border, Gaza, Lebanon, Syria. During that time, and in the years of service before it, I watched what prolonged operational stress does to a body. Not just physically. Systemically.", "I trained as a massage therapist and have spent years in breathwork and cold exposure practice — not as wellness habits, but as recovery tools. What I kept seeing was the same gap: people receiving good treatment but not getting lasting results, because their nervous system never had permission to let go.", "I built Sulam around that insight. Breathwork before massage. Cold exposure as a reset protocol. Hands-on work that lands somewhere it couldn't before.", "I work with men, soldiers, and older adults. People who need recovery to be functional, not spiritual. That's what Sulam delivers."];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: {
      background: 'var(--charcoal-900)',
      padding: '88px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: -110,
      bottom: -130,
      height: 360,
      opacity: 0.05,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Display, {
    size: "xl",
    color: "var(--linen)"
  }, "The ladder is a climb.", /*#__PURE__*/React.createElement("br", null), "This is ours."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 18,
      lineHeight: 1.65,
      color: 'var(--stone-300)',
      maxWidth: 600,
      margin: '24px auto 0'
    }
  }, "Sulam (\u05E1\u05D5\u05DC\u05DD) is the Hebrew word for ladder. Both a name and a philosophy \u2014 the belief that recovery isn't a switch. It's a step-by-step return to a body that works with you, not against you."))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: '80px 40px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Why Sulam exists"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, story.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, p)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 24,
      lineHeight: 1.4,
      color: 'var(--charcoal-900)',
      margin: '8px 0'
    }
  }, "Sulam works with men who've been pushing through for too long. Soldiers whose bodies are still running on operational mode. Older adults told their pain is simply the cost of aging. We don't accept that \u2014 and after a few sessions, most of our clients don't either."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "This is the ladder. You've already taken the first step by being here."))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-light)',
      borderTop: '1px solid var(--stone-300)',
      borderBottom: '1px solid var(--stone-300)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: '0 auto',
      padding: '72px 40px',
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: 48,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "sulam-nicky",
    shape: "rounded",
    radius: "16",
    placeholder: "Nicky \u2014 therapist photo",
    style: {
      width: '100%',
      aspectRatio: '3 / 4',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Nicky \u2014 founder of Sulam"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, bio.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, p)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 16,
      color: 'var(--charcoal-900)',
      margin: '4px 0 0'
    }
  }, "\u2014 Nicky, Certified Massage Therapist"))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 640,
      margin: '0 auto',
      padding: '80px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Display, {
    size: "md"
  }, "Sulam. ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hebrew)'
    }
  }, "\u05E1\u05D5\u05DC\u05DD.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "In Hebrew, sulam means ladder. A ladder is structural and symbolic. It goes somewhere. Each rung is intentional. You don't leap \u2014 you climb."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 22,
      color: 'var(--clay-600)',
      margin: 0
    }
  }, "Session by session. Rung by rung. A return to a body that feels like yours again.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "md",
    onClick: onBook,
    trailing: "ArrowRight"
  }, "Book your first session"))));
}
Object.assign(window, {
  AboutPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pages/pages-about.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pages/pages-booking.jsx
try { (() => {
/* Sulam — booking modal (fake multi-step). Uses the Five Rungs ladder. */

function BookingModal({
  open,
  onClose
}) {
  const [step, setStep] = React.useState(0);
  const [offer, setOffer] = React.useState(null);
  const [slot, setSlot] = React.useState(null);
  const [name, setName] = React.useState('');
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setStep(0);
      setOffer(null);
      setSlot(null);
      setName('');
      setDone(false);
    }
  }, [open]);
  if (!open) return null;
  const steps = [{
    label: 'Session'
  }, {
    label: 'Time'
  }, {
    label: 'Details'
  }];
  const offers = [{
    k: 'rung',
    t: 'The Rung',
    meta: '60 min · 300 ₪',
    icon: 'Footprints'
  }, {
    k: 'session',
    t: 'The Sulam Session',
    meta: '90 min · 300 ₪',
    icon: 'Sparkle'
  }, {
    k: 'cold',
    t: 'The Cold Rung',
    meta: '45 min · from 200 ₪',
    icon: 'Snowflake'
  }, {
    k: 'full',
    t: 'The Full Reset',
    meta: 'Cold + 90 min · 680 ₪',
    icon: 'Layers'
  }, {
    k: 'ladder',
    t: 'The Ladder',
    meta: '4 / month · programme',
    icon: 'TrendingUp'
  }];
  const slots = ['Sun 18:00', 'Mon 09:00', 'Tue 17:30', 'Wed 12:00', 'Thu 08:00', 'Thu 19:00'];
  const canNext = step === 0 ? offer : step === 1 ? slot : name.trim();
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(42,37,32,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 540,
      maxWidth: '100%',
      background: 'var(--cream)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 30px',
      borderBottom: '1px solid var(--stone-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 22,
      color: 'var(--charcoal-900)'
    }
  }, "Sulam"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12,
      color: 'var(--taupe-500)',
      borderLeft: '1px solid var(--stone-300)',
      paddingLeft: 10
    }
  }, "Book a session")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-md)',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "X",
    size: 18,
    color: "var(--taupe-500)"
  }))), !done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 30px 6px'
    }
  }, /*#__PURE__*/React.createElement(MiniLadder, {
    steps: steps,
    current: step
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 30px 8px',
      minHeight: 220
    }
  }, done ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--clay-100)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Check",
    size: 26,
    color: "var(--clay-600)",
    stroke: 2.5
  })), /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "You're booked."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      color: 'var(--taupe-500)',
      marginTop: 10
    }
  }, offers.find(o => o.k === offer)?.t, " \xB7 ", slot, ". We'll send a confirmation and a short breathing primer to get you ready."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      color: 'var(--clay-700)',
      marginTop: 12
    }
  }, "Miluim? Book via WhatsApp for the 250 \u20AA rate.")) : step === 0 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Choose your rung."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 18
    }
  }, offers.map(o => {
    const on = offer === o.k;
    return /*#__PURE__*/React.createElement("button", {
      key: o.k,
      onClick: () => setOffer(o.k),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        background: on ? 'var(--clay-100)' : 'var(--white)',
        border: on ? '1.5px solid var(--clay-500)' : '1px solid var(--stone-300)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 140ms ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: on ? 'var(--clay-500)' : 'var(--surface-light)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: o.icon,
      size: 19,
      color: on ? 'var(--linen)' : 'var(--taupe-500)'
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--charcoal-900)'
      }
    }, o.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 300,
        fontSize: 13,
        color: 'var(--taupe-500)'
      }
    }, o.meta)), on && /*#__PURE__*/React.createElement(Icon, {
      name: "Check",
      size: 18,
      color: "var(--clay-600)"
    }));
  }))) : step === 1 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Pick a time."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      marginTop: 18
    }
  }, slots.map(sl => {
    const on = slot === sl;
    return /*#__PURE__*/React.createElement("button", {
      key: sl,
      onClick: () => setSlot(sl),
      style: {
        padding: '14px 8px',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        color: on ? 'var(--linen)' : 'var(--charcoal-900)',
        background: on ? 'var(--clay-500)' : 'var(--white)',
        border: on ? '1.5px solid var(--clay-500)' : '1px solid var(--stone-300)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 140ms ease'
      }
    }, sl);
  }))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Display, {
    size: "sm"
  }, "Almost there."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--taupe-500)',
      marginTop: 8
    }
  }, "First session? Choose The Rung \u2014 60 minutes, no commitment."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Your name",
    value: name,
    onChange: setName,
    placeholder: "First and last"
  })))), !done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 30px 26px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => step === 0 ? onClose() : setStep(step - 1),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--taupe-500)'
    }
  }, step === 0 ? 'Cancel' : 'Back'), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "md",
    onClick: () => canNext && (step < 2 ? setStep(step + 1) : setDone(true)),
    trailing: step < 2 ? 'ArrowRight' : 'Check',
    style: {
      opacity: canNext ? 1 : 0.4,
      pointerEvents: canNext ? 'auto' : 'none'
    }
  }, step < 2 ? 'Continue' : 'Confirm booking')), done && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 30px 28px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    size: "md",
    onClick: onClose,
    style: {
      width: '100%'
    }
  }, "Done"))));
}
function Field({
  label,
  value,
  onChange,
  placeholder
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--charcoal-900)'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      height: 48,
      padding: '0 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--charcoal-900)',
      background: 'var(--white)',
      border: `1.5px solid ${f ? 'var(--clay-500)' : 'var(--stone-300)'}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: f ? '0 0 0 3px rgba(181,112,79,0.16)' : 'none',
      transition: 'all 140ms ease'
    }
  }));
}
function MiniLadder({
  steps,
  current
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start'
    }
  }, steps.map((s, i) => {
    const d = i < current,
      a = i === current,
      last = i === steps.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: last ? '0 0 auto' : 1,
        minWidth: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: d ? 'var(--clay-500)' : a ? 'var(--white)' : 'var(--surface-light)',
        border: `2px solid ${d || a ? 'var(--clay-500)' : 'var(--stone-300)'}`,
        boxShadow: a ? '0 0 0 4px var(--clay-100)' : 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 600,
        color: a ? 'var(--clay-600)' : 'var(--taupe-500)'
      }
    }, d ? /*#__PURE__*/React.createElement(Icon, {
      name: "Check",
      size: 12,
      color: "var(--linen)",
      stroke: 3
    }) : i + 1), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        height: 2,
        flex: 1,
        margin: '0 4px',
        background: d ? 'var(--clay-500)' : 'var(--stone-300)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: a ? 600 : 400,
        color: a || d ? 'var(--charcoal-900)' : 'var(--taupe-500)',
        marginTop: 8
      }
    }, s.label));
  }));
}
Object.assign(window, {
  BookingModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pages/pages-booking.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pages/pages-contact.jsx
try { (() => {
/* Sulam — Contact page. Depends on pages-core.jsx. */

function ContactPage({
  onBook
}) {
  const details = [['MapPin', 'Address', '[Full address, City]'], ['MessageCircle', 'WhatsApp', '[+972 XX XXX XXXX]'], ['Mail', 'Email', '[hello@sulam.co.il]'], ['Clock', 'Hours', 'Sun–Thu 8:00–20:00 · Fri 8:00–14:00']];
  const [vals, setVals] = React.useState({
    name: '',
    phone: '',
    msg: ''
  });
  const [focus, setFocus] = React.useState(null);
  const field = (k, label, ph, tall) => /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--charcoal-900)'
    }
  }, label), tall ? /*#__PURE__*/React.createElement("textarea", {
    value: vals[k],
    onChange: e => setVals(v => ({
      ...v,
      [k]: e.target.value
    })),
    placeholder: ph,
    onFocus: () => setFocus(k),
    onBlur: () => setFocus(null),
    rows: 4,
    style: {
      padding: '12px 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--charcoal-900)',
      background: 'var(--white)',
      border: `1.5px solid ${focus === k ? 'var(--clay-500)' : 'var(--stone-300)'}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      resize: 'none',
      boxShadow: focus === k ? '0 0 0 3px rgba(181,112,79,0.16)' : 'none'
    }
  }) : /*#__PURE__*/React.createElement("input", {
    value: vals[k],
    onChange: e => setVals(v => ({
      ...v,
      [k]: e.target.value
    })),
    placeholder: ph,
    onFocus: () => setFocus(k),
    onBlur: () => setFocus(null),
    style: {
      height: 48,
      padding: '0 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--charcoal-900)',
      background: 'var(--white)',
      border: `1.5px solid ${focus === k ? 'var(--clay-500)' : 'var(--stone-300)'}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: focus === k ? '0 0 0 3px rgba(181,112,79,0.16)' : 'none'
    }
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: {
      background: 'var(--charcoal-900)',
      padding: '80px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Display, {
    size: "xl",
    color: "var(--linen)"
  }, "Ready to climb?")), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 980,
      margin: '0 auto',
      padding: '72px 40px',
      display: 'grid',
      gridTemplateColumns: '0.85fr 1fr',
      gap: 56,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Contact"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, details.map(([ic, label, val]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '16px 0',
      borderBottom: '1px solid var(--stone-200)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-light)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18,
    color: "var(--clay-600)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--stone-500)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      color: 'var(--charcoal-900)',
      marginTop: 3
    }
  }, val))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--clay-600)',
      textDecoration: 'none'
    }
  }, "Instagram: @sulam_massage"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--clay-600)',
      textDecoration: 'none'
    }
  }, "Facebook: Sulam"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--cream)',
      border: '1px solid var(--stone-300)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 34px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 26,
      color: 'var(--charcoal-900)',
      margin: '0 0 6px'
    }
  }, "Book online \u2014 or send a message."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--taupe-500)',
      margin: '0 0 22px'
    }
  }, "Use the form to book your first session. Prefer WhatsApp? Send a message and we'll reply within a few hours. First session? Choose The Rung \u2014 60 minutes, no commitment."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, field('name', 'Name', 'Your name'), field('phone', 'Phone', '[+972 XX XXX XXXX]'), field('msg', 'Message', 'What would you like to book?', true), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "md",
    onClick: onBook
  }, "Book Now"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghostLight",
    size: "md",
    leading: "MessageCircle"
  }, "WhatsApp Us"))))));
}
Object.assign(window, {
  ContactPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pages/pages-contact.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pages/pages-core.jsx
try { (() => {
/* Sulam interior pages — shared shell. Per Wix Brief v3. Uses real token CSS. */

const {
  useState,
  useEffect,
  useRef
} = React;
function Icon({
  name,
  size = 18,
  color = 'currentColor',
  stroke = 1.75
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide && lucide[name]) {
      ref.current.innerHTML = '';
      const el = lucide.createElement(lucide[name]);
      el.setAttribute('width', size);
      el.setAttribute('height', size);
      el.setAttribute('stroke', color);
      el.setAttribute('stroke-width', stroke);
      ref.current.appendChild(el);
    }
  }, [name, size, color, stroke]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  leading,
  trailing,
  style
}) {
  const [h, setH] = useState(false);
  const sizes = {
    sm: {
      p: '0 18px',
      hgt: 40,
      fs: 14
    },
    md: {
      p: '0 24px',
      hgt: 50,
      fs: 15
    }
  };
  const s = sizes[size];
  const variants = {
    primary: {
      background: h ? 'var(--clay-600)' : 'var(--clay-500)',
      color: 'var(--linen)',
      border: '1px solid transparent'
    },
    light: {
      background: h ? 'var(--white)' : 'var(--linen)',
      color: 'var(--charcoal-900)',
      border: '1px solid transparent'
    },
    ghostDark: {
      background: h ? 'rgba(245,240,232,0.08)' : 'transparent',
      color: 'var(--linen)',
      border: '1px solid rgba(245,240,232,0.25)'
    },
    ghostLight: {
      background: h ? 'var(--surface-light)' : 'transparent',
      color: 'var(--charcoal-900)',
      border: '1px solid var(--charcoal-900)'
    },
    secondary: {
      background: h ? 'var(--surface-light)' : 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      height: s.hgt,
      padding: s.p,
      fontFamily: 'var(--font-sans)',
      fontSize: s.fs,
      fontWeight: 500,
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 200ms ease',
      ...variants[variant],
      ...style
    }
  }, leading && /*#__PURE__*/React.createElement(Icon, {
    name: leading,
    size: 18,
    color: "currentColor"
  }), children, trailing && /*#__PURE__*/React.createElement(Icon, {
    name: trailing,
    size: 18,
    color: "currentColor"
  }));
}
function Eyebrow({
  children,
  color = 'var(--clay-500)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color,
      ...style
    }
  }, children);
}
function Display({
  children,
  size = 'lg',
  color = 'var(--charcoal-900)',
  style
}) {
  const sizes = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56
  };
  return /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: sizes[size],
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color,
      margin: 0,
      textWrap: 'balance',
      ...style
    }
  }, children);
}

/* Page tabs (stand in for Wix nav between interior pages) */
function PageNav({
  page,
  setPage,
  onBook
}) {
  const tabs = [['services', 'Services'], ['about', 'About'], ['contact', 'Contact']];
  const linkStyle = active => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: active ? 500 : 300,
    fontSize: 15,
    color: active ? 'var(--linen)' : 'var(--stone-300)',
    borderBottom: active ? '1px solid var(--clay-400)' : '1px solid transparent',
    paddingBottom: 4,
    whiteSpace: 'nowrap'
  });
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      background: 'var(--charcoal-900)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--charcoal-800)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '0 40px',
      height: 74,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    style: {
      height: 28
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-wordmark-linen.png",
    alt: "Sulam",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 13,
      color: 'var(--stone-300)',
      borderLeft: '1px solid var(--charcoal-700)',
      paddingLeft: 12
    }
  }, "Massage Therapy")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    style: linkStyle(false)
  }, "Home"), tabs.map(([k, t]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPage(k),
    style: linkStyle(page === k)
  }, t))), /*#__PURE__*/React.createElement(Btn, {
    variant: "light",
    size: "sm",
    onClick: onBook,
    trailing: "ArrowRight"
  }, "Book Now")));
}

/* ---------- Footer (shared, Charcoal) ---------- */
function SiteFooter({
  onNav
}) {
  const links = [['Home', '../marketing/index.html', null], ['About', null, 'about'], ['Services', null, 'services'], ['Contact', null, 'contact']];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--charcoal-900)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-ladder-mark-linen-transparent.png",
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      height: 96,
      opacity: 0.05,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1100,
      margin: '0 auto',
      padding: '56px 40px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr 1fr',
      gap: 40,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    style: {
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/sulam-wordmark-linen.png",
    alt: "Sulam",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-hebrew)',
      direction: 'rtl',
      fontSize: 15,
      color: 'var(--stone-400)',
      marginTop: 12
    }
  }, "\u05E1\u05D5\u05DC\u05DD \xB7 \u05E2\u05D9\u05E1\u05D5\u05D9 \xB7 \u05E0\u05E9\u05D9\u05DE\u05D4 \xB7 \u05D7\u05E9\u05D9\u05E4\u05D4 \u05DC\u05E7\u05D5\u05E8")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, links.map(([l, href, p]) => href ? /*#__PURE__*/React.createElement("a", {
    key: l,
    href: href,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--stone-300)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, l) : /*#__PURE__*/React.createElement("button", {
    key: l,
    onClick: () => onNav(p),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      color: 'var(--stone-300)',
      whiteSpace: 'nowrap',
      padding: 0
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, ['Instagram', 'Facebook', 'MessageCircle'].map(ic => /*#__PURE__*/React.createElement("span", {
    key: ic,
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1px solid var(--charcoal-700)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 17,
    color: "var(--stone-300)"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderTop: '1px solid var(--charcoal-800)',
      padding: '20px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      color: 'var(--stone-400)'
    }
  }, "\xA9 2025 Sulam. All rights reserved.")));
}
Object.assign(window, {
  Icon,
  Btn,
  Eyebrow,
  Display,
  PageNav,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pages/pages-core.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pages/pages-services.jsx
try { (() => {
/* Sulam — Services page. Depends on pages-core.jsx. */

function OfferRow({
  o,
  onBook
}) {
  const cold = o.kind === 'cold';
  const feat = o.kind === 'featured';
  const dark = cold;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: cold ? 'var(--cold-900)' : feat ? 'var(--cream)' : 'var(--surface-light)',
      border: cold ? '1px solid var(--cold-800)' : feat ? '1px solid var(--clay-200)' : '1px solid var(--stone-300)',
      borderTop: feat ? '2px solid var(--clay-500)' : cold ? '2px solid var(--ice-300)' : '1px solid var(--stone-300)',
      borderRadius: 'var(--radius-lg)',
      padding: '36px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 32,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 32,
      color: dark ? 'var(--linen)' : 'var(--charcoal-900)',
      margin: 0
    }
  }, o.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: cold ? 'var(--ice)' : 'var(--clay-600)'
    }
  }, o.dur, o.flag ? ' · ' + o.flag : ''), cold && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 10.5,
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--ice)',
      border: '1px solid var(--ice-300)',
      borderRadius: 'var(--radius-full)',
      padding: '3px 11px'
    }
  }, "\u2726 New")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 20,
      color: cold ? 'var(--ice)' : 'var(--clay-700)',
      margin: '0 0 14px'
    }
  }, o.lead), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.7,
      color: dark ? 'var(--stone-300)' : 'var(--taupe-500)',
      margin: '0 0 14px',
      maxWidth: 580
    }
  }, o.body), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 13,
      color: dark ? 'var(--stone-400)' : 'var(--stone-500)',
      margin: 0
    }
  }, o.includes), o.miluim && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      color: 'var(--clay-600)',
      margin: '6px 0 0'
    }
  }, o.miluim)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 14,
      minWidth: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 28,
      lineHeight: 1.15,
      color: dark ? 'var(--ice)' : 'var(--charcoal-900)',
      whiteSpace: 'nowrap'
    }
  }, o.price), /*#__PURE__*/React.createElement(Btn, {
    variant: feat ? 'primary' : 'secondary',
    size: "md",
    onClick: onBook,
    style: cold ? {
      borderColor: 'var(--ice-300)',
      color: 'var(--linen)'
    } : {}
  }, o.btn)));
}
function ServicesPage({
  onBook
}) {
  const offers = [{
    t: 'The Rung',
    dur: '60 min · First-time clients',
    lead: 'The first step on the ladder.',
    body: "A focused 60-minute session that begins with a 5-minute breathwork opening — enough to settle your nervous system and prepare your body to receive the work. Followed by 55 minutes of targeted therapeutic massage. Skeptical about the breathwork? Five minutes in, most people understand why it's the first thing we do.",
    includes: 'Includes: intake consultation on first visit.',
    miluim: 'Miluim rate: 250 ₪ — book via WhatsApp.',
    price: '300 ₪',
    btn: 'Book The Rung',
    kind: 'plain'
  }, {
    t: 'The Sulam Session',
    dur: '90 min',
    flag: 'Flagship',
    lead: 'Our complete, integrated experience.',
    body: 'Begins with 10 minutes of guided breathwork — shifting your nervous system from fight-or-flight to rest-and-release. Followed by 75 minutes of targeted therapeutic massage, then 5 minutes of grounding to anchor the release. The session clients describe as the first time their body actually recovered — not just relaxed.',
    includes: 'Includes: intake consultation · post-session self-care notes.',
    miluim: 'Miluim rate: 250 ₪ — book via WhatsApp.',
    price: '300 ₪',
    btn: 'Book The Sulam Session',
    kind: 'featured'
  }, {
    t: 'The Ladder',
    dur: '4 / month · Programme',
    lead: 'Real change happens over time.',
    body: 'Four Sulam Sessions per month, a personalised breathwork practice to use at home, and a monthly check-in to adjust the approach. Best for chronic pain, operational stress, or anyone serious about building recovery into their life — not just their schedule.',
    includes: 'Includes: home breathwork audio · priority booking · consistent therapist · discounted monthly rate.',
    price: '[SET] ₪/mo',
    btn: 'Join The Ladder',
    kind: 'plain'
  }, {
    t: 'The Cold Rung',
    dur: 'Cold exposure · 45 min',
    lead: 'Three minutes that a massage cannot do alone.',
    body: 'Controlled cold forces a vascular response, flushes metabolic waste, and signals your nervous system that the threat is over. Cold constricts; the warmth that follows vasodilates. Combined with breathwork guidance during the exposure, the result is a genuine nervous system reset — not a wellness experience.',
    includes: 'Includes: guided breathwork throughout · private space · post-session guidance.',
    price: 'from 200 ₪',
    btn: 'Book The Cold Rung',
    kind: 'cold'
  }];
  const coldPrices = [['Solo session', '500 ₪'], ['Two people', '750 ₪'], ['Group (5+ people)', '200 ₪ / person']];
  const coldTrust = ['Guided breathwork included in every cold session', 'Cold exposure is used in IDF elite unit preparation — evidence-based', 'Private, quiet space — in and out in 45 minutes', 'Solo, couples, and group sessions available', 'No experience needed — Nicky guides you through the full session'];
  const packs = [{
    t: 'The Full Reset',
    meta: 'Cold Rung + 90-min Sulam Session',
    price: '680 ₪',
    save: 'save 120 ₪',
    body: 'Cold exposure with guided breathwork, then the full Sulam Session. The fastest route to a body that has genuinely recovered.',
    miluim: 'Miluim: cold at standard rate + massage at 250 ₪. Book via WhatsApp.',
    btn: 'Book The Full Reset'
  }, {
    t: 'The Reset Rung',
    meta: 'Cold Rung + 60-min massage',
    price: '600 ₪',
    save: 'save 200 ₪',
    body: 'The first-timer combination. Cold exposure, then targeted massage. An hour and a half that changes what recovery means to you.',
    miluim: 'Miluim: cold at standard rate + massage at 250 ₪. Book via WhatsApp.',
    btn: 'Book The Reset Rung'
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: {
      background: 'var(--charcoal-900)',
      padding: '80px 40px 76px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--clay-400)"
  }, "Sessions & offers"), /*#__PURE__*/React.createElement(Display, {
    size: "xl",
    color: "var(--linen)",
    style: {
      marginTop: 18
    }
  }, "Choose your rung."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 18,
      color: 'var(--stone-300)',
      marginTop: 16
    }
  }, "Five offers. One method. A body that finally lets go.")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: '0 auto',
      padding: '72px 40px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, offers.map(o => /*#__PURE__*/React.createElement(OfferRow, {
    key: o.t,
    o: o,
    onBook: onBook
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--cream)',
      borderTop: '1px solid var(--stone-300)',
      borderBottom: '1px solid var(--stone-300)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: '0 auto',
      padding: '88px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: 'var(--clay-600)'
    }
  }, "Why cold exposure"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 34,
      lineHeight: 1.15,
      color: 'var(--charcoal-900)',
      margin: '16px 0 20px'
    }
  }, "Not a trend. A physiological tool."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "Cold exposure forces the body to respond. Vessels constrict, pulling blood to the core. Noradrenaline spikes \u2014 the same mechanism that drives alertness under pressure. Then you get out, and the body rebounds: vasodilation, circulation surge, inflammation reduction."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.7,
      color: 'var(--taupe-500)',
      margin: 0
    }
  }, "With breathwork guidance during the cold, your nervous system learns to stay regulated under discomfort. That skill transfers \u2014 it changes how you manage stress, pain, and pressure long after you've left the room."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 15,
      color: 'var(--charcoal-900)',
      margin: 0
    }
  }, "Every cold session includes guided breathwork. Because controlled breathing is what separates a genuine reset from just being cold."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 28,
      borderLeft: '2px solid var(--ice-300)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontStyle: 'italic',
      fontSize: 26,
      lineHeight: 1.3,
      color: 'var(--charcoal-900)',
      margin: 0
    }
  }, "\"Cold exposure is used in elite military training. Not because it feels good. Because it works.\""), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      color: 'var(--taupe-500)',
      marginTop: 16
    }
  }, "\u2014 The Sulam method")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-light)',
      border: '1px solid var(--stone-300)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px 26px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, coldTrust.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 11,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--clay-100)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Check",
    size: 12,
    color: "var(--clay-600)",
    stroke: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 13.5,
      lineHeight: 1.45,
      color: 'var(--charcoal-900)'
    }
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, coldPrices.map(([l, p]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 22,
      color: 'var(--charcoal-900)'
    }
  }, p), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      color: 'var(--taupe-500)'
    }
  }, l))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-light)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: '0 auto',
      padding: '80px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      maxWidth: 620,
      margin: '0 auto 44px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      display: 'block'
    }
  }, "Combine your session"), /*#__PURE__*/React.createElement(Display, {
    size: "md",
    style: {
      marginTop: 16
    }
  }, "Cold exposure before massage changes what the massage can do."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.65,
      color: 'var(--taupe-500)',
      marginTop: 16
    }
  }, "Cold constricts the body. The vasodilation that follows \u2014 combined with breathwork during the cold \u2014 primes your nervous system and musculature for deeper, longer-lasting release.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 20
    }
  }, packs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.t,
    style: {
      background: 'var(--cream)',
      border: '1px solid var(--stone-300)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 34px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 26,
      color: 'var(--charcoal-900)',
      margin: 0
    }
  }, p.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12.5,
      color: 'var(--taupe-500)',
      margin: '6px 0 14px'
    }
  }, p.meta), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 28,
      color: 'var(--charcoal-900)',
      whiteSpace: 'nowrap'
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      color: 'var(--clay-600)',
      marginLeft: 10
    }
  }, p.save)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 14,
      lineHeight: 1.65,
      color: 'var(--taupe-500)',
      margin: '0 0 10px'
    }
  }, p.body), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 12,
      lineHeight: 1.5,
      color: 'var(--stone-500)',
      margin: '0 0 22px'
    }
  }, p.miluim), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    size: "md",
    onClick: onBook,
    style: {
      width: '100%'
    }
  }, p.btn))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--charcoal-900)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: '0 auto',
      padding: '64px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 28,
      color: 'var(--linen)',
      margin: '0 0 10px'
    }
  }, "He won't book it himself. You can do it for him."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.65,
      color: 'var(--stone-300)',
      margin: 0
    }
  }, "A Sulam gift voucher is one of the most practical things you can give a soldier coming back from miluim, a father who never stops, or anyone who's been told to just push through. Available for any session or package. Valid for 6 months.")), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "md",
    onClick: onBook
  }, "Buy a Gift Voucher"))));
}
Object.assign(window, {
  ServicesPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pages/pages-services.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.LadderProgress = __ds_scope.LadderProgress;

})();
