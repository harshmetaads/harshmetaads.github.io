/* Harsh Pratap Singh portfolio: dungeon-gate world.
   3D scene (Three.js r128), synthesized sound (Web Audio) and UI behaviour.
   Everything here is original. No audio files, no franchise assets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent);
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------------------------------------------------------- SOUND */
  var Sfx = (function () {
    var ctx, master, verb, dry, on = false, started = false, noiseBuf;
    function build() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      dry = ctx.createGain(); dry.gain.value = 1; dry.connect(master);
      // reverb: generated impulse response (decaying noise)
      var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      var conv = ctx.createConvolver(); conv.buffer = ir;
      verb = ctx.createGain(); verb.gain.value = .55; verb.connect(conv); conv.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var nd = noiseBuf.getChannelData(0); for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
      return true;
    }
    function drone() {
      var t = ctx.currentTime, out = ctx.createGain(); out.gain.value = .16;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 340; lp.Q.value = 5;
      [[55, "sawtooth", 0], [55.35, "sawtooth", 0], [110.2, "sine", 0], [82.4, "triangle", 0]].forEach(function (o) {
        var s = ctx.createOscillator(); s.type = o[1]; s.frequency.value = o[0]; s.connect(lp); s.start(t);
      });
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
      lp.connect(out); out.connect(dry); out.connect(verb);
      // airy wind
      var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = .8;
      var ng = ctx.createGain(); ng.gain.value = .022;
      var l2 = ctx.createOscillator(), l2g = ctx.createGain(); l2.frequency.value = .11; l2g.gain.value = 320; l2.connect(l2g); l2g.connect(bp.frequency); l2.start(t);
      n.connect(bp); bp.connect(ng); ng.connect(verb); n.start(t);
      // slow deep pulse
      (function pulse() { if (ctx) { if (on) boom(.5); setTimeout(pulse, 7500 + Math.random() * 3500); } })();
    }
    function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
    function tone(f, type, dt, a, d, peak, send) {
      if (!ready()) return;
      var t = ctx.currentTime + (dt || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; env(g, t, a, peak, d); o.connect(g); g.connect(dry); if (send) { var s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); }
      o.start(t); o.stop(t + a + d + .05);
    }
    function boom(v) {
      if (!ready()) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.4);
      env(g, t, .02, (v || .5) * .5, 1.6); o.connect(g); g.connect(dry); g.connect(verb); o.start(t); o.stop(t + 1.8);
    }
    function sweep(from, to, dur, peak, q) {
      if (!ready()) return;
      var t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = noiseBuf;
      var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q || 1.2;
      f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
      var g = ctx.createGain(); env(g, t, dur * .35, peak, dur * .65);
      n.connect(f); f.connect(g); g.connect(dry); g.connect(verb); n.start(t); n.stop(t + dur + .1);
    }
    function ready() { return ctx && on && ctx.state !== "closed"; }
    return {
      get on() { return on; },
      enable: function () {
        if (!ctx && !build()) return false;
        if (ctx.state === "suspended") ctx.resume();
        if (!started) { started = true; drone(); }
        on = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.9, ctx.currentTime, .6); return true;
      },
      disable: function () { on = false; if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .15); },
      tick: function () { tone(2100, "sine", 0, .003, .05, .035); },
      click: function () { tone(520, "square", 0, .004, .09, .04); tone(1040, "sine", .02, .004, .12, .05, .2); },
      chime: function () { tone(880, "sine", 0, .01, .9, .12, .8); tone(1320, "sine", .09, .01, .9, .08, .8); tone(1760, "triangle", .18, .01, .7, .04, .8); },
      levelUp: function () { [440, 554.4, 659.3, 880, 1108.7].forEach(function (f, i) { tone(f, "triangle", i * .09, .01, .6, .09, .7); }); boom(.35); sweep(300, 2600, .7, .09); },
      whoosh: function () { sweep(180, 2200, .8, .07); },
      gate: function () { boom(.9); sweep(120, 3200, 1.6, .14, .7); [220, 330, 440, 660].forEach(function (f, i) { tone(f, "sawtooth", .1 + i * .05, .2, 1.8, .035, .9); }); }
    };
  })();

  /* ------------------------------------------------------------------ UI */
  var soundBtn = $("sound"), soundTxt = $("soundTxt");
  function paintSound() {
    var on = Sfx.on; soundBtn.setAttribute("aria-pressed", on ? "true" : "false"); soundTxt.textContent = on ? "Sound on" : "Sound off";
  }
  function setSound(want) {
    if (want) { if (!Sfx.enable()) { want = false; } } else Sfx.disable();
    store.set("hp-sound", want ? "on" : "off"); paintSound(); if (want) Sfx.chime();
  }
  soundBtn.addEventListener("click", function () { setSound(!Sfx.on); });

  // typed quest text (starts when the intro gate closes)
  var typeStarted = false;
  function startTyped() {
    var el = $("typed"); if (!el || typeStarted) return; typeStarted = true; if (reduce) return;
    var full = el.getAttribute("data-text"), i = 0; el.textContent = "";
    function step() { el.textContent = full.slice(0, ++i); if (Sfx.on && i % 3 === 0) Sfx.tick(); if (i < full.length) setTimeout(step, 38); }
    setTimeout(step, 500);
  }

  // reveal + stat/rank bars
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .15 }) : null;
  qsa(".rv,.about-panel").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  // level + toast per section
  var lvlEl = $("lvl"), toast = $("toast"), toastL = $("toastL"), toastS = $("toastS"), toastT = 0, maxLv = 1;
  function showToast(l, s) {
    toastL.textContent = l; toastS.textContent = s; toast.classList.add("show"); clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }
  var secs = qsa("section[data-lv]");
  var sio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var lv = +e.target.getAttribute("data-lv"); lvlEl.textContent = lv;
      if (lv > maxLv) {
        maxLv = lv; showToast("LEVEL UP · LV " + lv, e.target.getAttribute("data-title") + " — " + e.target.getAttribute("data-sub"));
        Sfx.levelUp(); World.flash(1);
      }
    });
  }, { rootMargin: "-45% 0px -45% 0px" }) : null;
  if (sio) secs.forEach(function (s) { sio.observe(s); });

  // exp bar
  var exp = $("exp"), prog = 0;
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight; prog = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    exp.style.transform = "scaleX(" + prog + ")";
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // hover / click sounds
  var lastHover = null;
  document.addEventListener("mouseover", function (e) {
    var t = e.target.closest && e.target.closest(".btn,.navcta,.card,.gig,.cc,.sound"); if (t && t !== lastHover) { lastHover = t; if (Sfx.on) Sfx.tick(); } else if (!t) lastHover = null;
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".btn,.navcta,.cc"); if (t && Sfx.on) Sfx.click();
  });
  $("accept").addEventListener("click", function () { World.flash(1.6); Sfx.gate(); });

  // 3D card tilt + light follow
  if (!reduce && matchMedia("(hover:hover)").matches) {
    qsa(".card").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--ry", ((x - .5) * 9).toFixed(2) + "deg"); c.style.setProperty("--rx", ((.5 - y) * 9).toFixed(2) + "deg");
        c.style.setProperty("--mx", (x * 100).toFixed(0) + "%"); c.style.setProperty("--my", (y * 100).toFixed(0) + "%");
      });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }

  // copy email
  qsa(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-copy"), done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, done); else done();
    });
  });
  var yr = $("year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------- 3D WORLD */
  var World = { flash: function () {} };
  (function () {
    var canvas = $("stage"), renderer;
    if (!window.THREE) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, powerPreference: "high-performance" });
    } catch (e) { return; }
    var T = THREE, DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(DPR); renderer.setClearColor(0x03020a, 1);
    var scene = new T.Scene(); scene.fog = new T.FogExp2(0x03020a, .055);
    var camera = new T.PerspectiveCamera(50, 1, .1, 90);
    var BASE = { x: 0, y: 1.1, z: 9.8 };
    var gateGroup = new T.Group(), soldiers = new T.Group(); scene.add(gateGroup, soldiers);
    var GATE_Y = 2.7, uni = { t: { value: 0 }, flash: { value: 0 } };

    /* gate interior: swirling energy */
    var swirl = new T.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: [
        "varying vec2 vUv;uniform float t;uniform float flash;",
        "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
        "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
        "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}",
        "void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x);",
        "float s=fbm(vec2(a*1.3+t*.35,r*3.-t*.7));float s2=fbm(p*3.+vec2(t*.2,-t*.3)+s*1.6);",
        "vec3 deep=vec3(.04,.015,.16),mid=vec3(.36,.13,.95),hi=vec3(.55,.88,1.);",
        "float edge=smoothstep(.45,1.,r);vec3 c=mix(deep,mid,s2);c=mix(c,hi,pow(s2,3.)*.9*(.35+edge));",
        "c+=vec3(.32,.16,.95)*edge*edge*1.3;c*=1.+flash*1.6;",
        "gl_FragColor=vec4(c,smoothstep(1.,.9,r)*.94);}"
      ].join("\n")
    });
    var disc = new T.Mesh(new T.CircleGeometry(1, 72), swirl); disc.scale.set(1.75, 2.6, 1); disc.position.y = GATE_Y; gateGroup.add(disc);
    function ringMat(c, o) { return new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, fog: false }); }
    var rim = new T.Mesh(new T.TorusGeometry(1, .045, 14, 160), ringMat(0x9b7bff, .95)); rim.scale.set(1.78, 2.64, 1); rim.position.y = GATE_Y; gateGroup.add(rim);
    var rim2 = new T.Mesh(new T.TorusGeometry(1, .012, 8, 160), ringMat(0x7be3ff, .8)); rim2.scale.set(1.95, 2.85, 1); rim2.position.y = GATE_Y; gateGroup.add(rim2);
    var orbit1 = new T.Mesh(new T.TorusGeometry(1, .02, 8, 140), ringMat(0x6d3df0, .7)); orbit1.scale.set(2.5, 2.5, 1); orbit1.position.y = GATE_Y; orbit1.rotation.x = 1.15; gateGroup.add(orbit1);
    var orbit2 = new T.Mesh(new T.TorusGeometry(1, .015, 8, 140), ringMat(0x7be3ff, .55)); orbit2.scale.set(3.1, 3.1, 1); orbit2.position.y = GATE_Y; orbit2.rotation.set(-.6, .9, 0); gateGroup.add(orbit2);

    /* orbiting runes */
    var RN = mobile ? 28 : 48, runes = new T.InstancedMesh(new T.OctahedronGeometry(.075), ringMat(0x9ceaff, .95), RN), dm = new T.Object3D(), rseed = [];
    for (var i = 0; i < RN; i++) rseed.push({ a: Math.random() * 6.283, r: 2.1 + Math.random() * 1.2, y: (Math.random() - .5) * 4.4, s: .15 + Math.random() * .3, z: (Math.random() - .5) * 1.2 });
    gateGroup.add(runes);

    /* lightning arcs around the rim */
    var ARCS = mobile ? 3 : 6, arcs = [];
    for (i = 0; i < ARCS; i++) {
      var g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(30 * 3), 3));
      var l = new T.Line(g, new T.LineBasicMaterial({ color: 0x9ceaff, transparent: true, opacity: .0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      l.position.y = GATE_Y; gateGroup.add(l); arcs.push(l);
    }
    function zap(l) {
      var p = l.geometry.attributes.position, a0 = Math.random() * 6.283, span = .5 + Math.random() * .9, k;
      for (k = 0; k < 30; k++) {
        var a = a0 + span * k / 29, rr = 1.02 + (Math.random() - .5) * .16 * (k > 0 && k < 29 ? 1 : 0) + Math.sin(k * .8) * .02 + (k % 7 === 3 ? .25 * Math.random() : 0);
        p.setXYZ(k, Math.cos(a) * 1.8 * rr, Math.sin(a) * 2.65 * rr, (Math.random() - .5) * .1);
      }
      p.needsUpdate = true; l.material.opacity = .95;
    }

    /* floor glow + faint grid */
    var floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: "varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec2 vP;uniform float flash;void main(){float d=length(vec2(vP.x*.8,vP.y+1.));float g=exp(-d*.16);vec2 q=abs(fract(vP*.5)-.5);float line=smoothstep(.02,0.,min(q.x,q.y));vec3 c=vec3(.42,.2,1.)*g*.55+vec3(.3,.5,1.)*line*g*.35;c*=1.+flash*1.2;gl_FragColor=vec4(c,1.);}"
    }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = .001; gateGroup.add(floor);

    /* shadow figures (original silhouettes) */
    var NS = mobile ? 14 : 26, bodyMat = new T.MeshBasicMaterial({ color: 0x04030c }), rimMat = new T.MeshBasicMaterial({ color: 0x6d3df0, transparent: true, opacity: .3, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false });
    var eyeMat = new T.MeshBasicMaterial({ color: 0x9ceaff, fog: false }), figs = [];
    var bodyG = new T.CylinderGeometry(.14, .3, 1.35, 9), headG = new T.SphereGeometry(.19, 10, 8), spikeG = new T.ConeGeometry(.07, .5, 5), eyeG = new T.PlaneGeometry(.1, .03);
    for (i = 0; i < NS; i++) {
      var f = new T.Group(), s = .85 + Math.random() * .75;
      var b = new T.Mesh(bodyG, bodyMat); b.position.y = .68; f.add(b);
      var bo = new T.Mesh(bodyG, rimMat); bo.position.y = .68; bo.scale.set(1.14, 1.02, 1.14); f.add(bo);
      var hd = new T.Mesh(headG, bodyMat); hd.position.y = 1.55; f.add(hd);
      var ho = new T.Mesh(headG, rimMat); ho.position.y = 1.55; ho.scale.setScalar(1.18); f.add(ho);
      for (var sd = -1; sd <= 1; sd += 2) { var sp = new T.Mesh(spikeG, bodyMat); sp.position.set(sd * .27, 1.38, 0); sp.rotation.z = -sd * .6; f.add(sp); }
      for (sd = -1; sd <= 1; sd += 2) { var ey = new T.Mesh(eyeG, eyeMat); ey.position.set(sd * .07, 1.58, .17); f.add(ey); }
      var ang = (i / (NS - 1) - .5) * 2.6 + (Math.random() - .5) * .2, rad = 3.4 + Math.random() * 4.6, px = Math.sin(ang) * rad;
      if (Math.abs(px) < 2.7) px += (px < 0 ? -1 : 1) * 2.7;
      f.position.set(px, 0, .4 + (1 - Math.cos(ang)) * 2.2 + Math.random() * 1.6);
      s = .7 + Math.random() * .4; f.scale.setScalar(s); f.rotation.y = Math.atan2(-f.position.x, -f.position.z + 1) * .8; f.userData = { base: s, ph: Math.random() * 6.283, d: i * .05 + Math.random() * .4 };
      soldiers.add(f); figs.push(f);
    }

    /* rising embers */
    var NP = mobile ? 700 : 1800, pg = new T.BufferGeometry(), pos = new Float32Array(NP * 3), vel = new Float32Array(NP), col = new Float32Array(NP * 3);
    for (i = 0; i < NP; i++) {
      pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = (Math.random() - .5) * 18 + 1; vel[i] = .15 + Math.random() * .5;
      var cc = Math.random() < .3 ? [.48, .89, 1] : [.55, .36, 1]; col[i * 3] = cc[0]; col[i * 3 + 1] = cc[1]; col[i * 3 + 2] = cc[2];
    }
    pg.setAttribute("position", new T.BufferAttribute(pos, 3)); pg.setAttribute("color", new T.BufferAttribute(col, 3));
    var sc = document.createElement("canvas"); sc.width = sc.height = 64; var sx = sc.getContext("2d"), gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.4, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    var parts = new T.Points(pg, new T.PointsMaterial({ size: mobile ? .13 : .1, map: new T.CanvasTexture(sc), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .85, sizeAttenuation: true }));
    scene.add(parts);

    /* layout: put the gate behind the hero visual */
    var gateX = 3, aspect = 1.6;
    function layout() {
      var w = innerWidth, h = innerHeight; aspect = w / h;
      renderer.setSize(w, h, false); camera.aspect = aspect; camera.updateProjectionMatrix();
      var vis = document.querySelector(".visual"), nx = .5, wide = aspect > 1.05;
      if (vis && wide) { var r = vis.getBoundingClientRect(); nx = (r.left + scrollX + r.width / 2) / w; }
      var halfH = Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * BASE.z; gateX = wide ? (nx * 2 - 1) * halfH * aspect : 0;
      var sc2 = wide ? 1 : Math.min(1, aspect * 1.1) * .95; gateGroup.scale.setScalar(sc2); gateGroup.position.x = gateX;
      soldiers.position.x = wide ? gateX * .55 : 0;
    }
    addEventListener("resize", layout); layout(); setTimeout(layout, 600); setTimeout(layout, 1800);

    var mx = 0, my = 0, tx = 0, ty = 0, flash = 0, introT = reduce ? 9 : 0, clock = new T.Clock(), visible = true;
    World.flash = function (v) { flash = Math.max(flash, v || 1); };
    addEventListener("pointermove", function (e) { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (visible) clock.getDelta(); });
    function ease(x) { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
    function lerp(a, b, k) { return a + (b - a) * k; }
    var zapT = 0, started = false;
    World.start = function () { if (!started) { started = true; introT = 0; flash = 1.4; } };
    if (reduce) started = true;

    function frame() {
      requestAnimationFrame(frame); if (!visible) return;
      var dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
      if (started) introT += dt; uni.t.value = reduce ? 3 : t; flash *= Math.pow(.04, dt); uni.flash.value = flash;
      mx += (tx - mx) * Math.min(1, dt * 3); my += (ty - my) * Math.min(1, dt * 3);
      var p = prog, e = ease(p), k = ease(introT / 2.4);
      camera.position.set(lerp(BASE.x, gateX * .8, e) + mx * .55, lerp(BASE.y, 1.5, e) - my * .25, lerp(BASE.z, 6.6, e) - (1 - k) * 2.4);
      camera.lookAt(lerp(0, gateX, Math.min(1, p * 1.2)) + mx * .2, lerp(2.2, 2.7, e), 0);
      var open = .35 + .65 * ease(introT / 2.8); disc.scale.set(1.75 * open, 2.6 * open, 1); rim.scale.set(1.78 * open, 2.64 * open, 1); rim2.scale.set(1.95 * open, 2.85 * open, 1);
      var pulse = 1 + Math.sin(t * 1.6) * .015; rim.scale.multiplyScalar(pulse);
      rim.material.opacity = .8 + Math.sin(t * 2.2) * .15 + flash * .2;
      orbit1.rotation.z = t * .25; orbit2.rotation.z = -t * .18; orbit2.rotation.y = .9 + Math.sin(t * .3) * .2; rim2.rotation.z = Math.sin(t * .4) * .03;
      for (var i = 0; i < RN; i++) {
        var r = rseed[i], a = r.a + t * r.s; dm.position.set(Math.cos(a) * r.r * .85, GATE_Y + r.y + Math.sin(t * .6 + i) * .15, Math.sin(a) * r.r * .5 + r.z);
        dm.rotation.set(t + i, t * .7, 0); dm.scale.setScalar(.6 + .6 * Math.abs(Math.sin(t + i))); dm.updateMatrix(); runes.setMatrixAt(i, dm.matrix);
      }
      runes.instanceMatrix.needsUpdate = true;
      zapT -= dt; if (zapT <= 0) { zap(arcs[(Math.random() * ARCS) | 0]); zapT = .08 + Math.random() * .22; if (Math.random() < .08) flash = Math.max(flash, .5); }
      arcs.forEach(function (l) { l.material.opacity *= Math.pow(.0008, dt); });
      for (i = 0; i < figs.length; i++) {
        var f = figs[i], u = f.userData, rise = ease((introT - u.d) / 1.4);
        f.position.y = -2.4 * (1 - rise) + Math.sin(t * .9 + u.ph) * .02; f.scale.setScalar(u.base * (.6 + .4 * rise) * (1 + Math.sin(t * 1.1 + u.ph) * .012));
      }
      var pp = pg.attributes.position.array;
      for (i = 0; i < NP; i++) { pp[i * 3 + 1] += vel[i] * dt * (reduce ? 0 : 1); pp[i * 3] += Math.sin(t * .5 + i) * .0025; if (pp[i * 3 + 1] > 14) { pp[i * 3 + 1] = -.2; pp[i * 3] = (Math.random() - .5) * 30; } }
      pg.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    frame();
  })();

  /* ---------------------------------------------------------- INTRO GATE */
  (function () {
    var pref = store.get("hp-sound");
    function begin(withSound) {
      if (withSound) setSound(true); else { store.set("hp-sound", "off"); }
      if (withSound) { Sfx.gate(); }
      World.start && World.start(); World.flash(1.2); startTyped();
      var g = $("introGate"); if (g) { g.classList.add("out"); setTimeout(function () { g.remove(); }, 1000); }
    }
    if (reduce || pref === "off") { setTimeout(function () { World.start && World.start(); startTyped(); }, 50); return; }
    var g = document.createElement("div"); g.className = "gate"; g.id = "introGate"; g.setAttribute("role", "dialog"); g.setAttribute("aria-label", "Enter the site");
    g.innerHTML = '<div class="gate-inner"><div class="ring" aria-hidden="true"></div><div class="tag-sys">[ System ] Gate detected</div><h2>Enter the gate?</h2><p>Best with sound on. Audio is generated live in your browser and you can switch it off any time from the top bar.</p><div class="hero-actions"><button class="btn" id="enterSound" type="button">Enter with sound ♪</button><button class="btn secondary" id="enterSilent" type="button">Enter silently</button></div></div>';
    document.body.appendChild(g);
    $("enterSound").addEventListener("click", function () { begin(true); });
    $("enterSilent").addEventListener("click", function () { begin(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("introGate")) begin(false); });
    setTimeout(function () { var b = $("enterSound"); if (b) b.focus({ preventScroll: true }); }, 100);
  })();
})();
