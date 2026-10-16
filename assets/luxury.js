(function () {
  "use strict";
  var canvas = document.getElementById("particles");
  var ctx = canvas && canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
  if (canvas && ctx) {
    var w = 0, h = 0, dpr = 1, points = [], pointer = { x: -1000, y: -1000 };
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.7);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = reduce ? 0 : Math.min(mobile ? 34 : 72, Math.floor(w * h / (mobile ? 18000 : 14500)));
      points = [];
      for (var i = 0; i < count; i++) points.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: .5 + Math.random() * 1.15, a: .12 + Math.random() * .32
      });
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; }
        if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5; if (p.y > h + 5) p.y = -5;
        var dx = p.x - pointer.x, dy = p.y - pointer.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 125) { p.x += dx / (dist || 1) * .18; p.y += dy / (dist || 1) * .18; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,245,197," + p.a + ")"; ctx.fill();
        for (var j = i + 1; j < points.length; j++) {
          var q = points[j], x = p.x - q.x, y = p.y - q.y, d = Math.sqrt(x * x + y * y);
          if (d < 105) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(112,191,140," + ((1 - d / 105) * .095) + ")";
            ctx.lineWidth = .6; ctx.stroke();
          }
        }
      }
      if (!reduce) window.requestAnimationFrame(draw);
    }
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    resize(); draw();
  }
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduce) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: .12 });
    items.forEach(function (el) { observer.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("visible"); });
  }
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();